(function () {
  "use strict";

  const listEl = document.getElementById("matchList");
  const emptyEl = document.getElementById("emptyState");
  const filtersEl = document.getElementById("stageFilters");
  const searchEl = document.getElementById("searchInput");
  const heroStatsEl = document.getElementById("heroStats");
  const updatedEl = document.getElementById("lastUpdated");

  let matches = [];
  let activeStage = "Tous";
  let query = "";

  /* ---------- chargement des données ----------
     On lit data.json (fichier canonique actualisé par le robot).
     Repli sur window.WC_DATA (data.js) si fetch échoue, ex. ouverture file://. */
  async function loadData() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      if (window.WC_DATA) return window.WC_DATA;
      throw e;
    }
  }

  /* ---------- helpers ---------- */
  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE", ar: "ar" };
  const locale = () => LOC[window.getLang ? window.getLang() : "fr"] || "fr-FR";

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale(), {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });

  const sideLabel = (m, key) =>
    key === "home" ? flagHTML(m.home, 14) : key === "away" ? flagHTML(m.away, 14) : t("card_draw");

  // « à 11:27 le 27 juin » (traduit + locale courante)
  function updatedLabel(iso) {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString(locale(), { day: "numeric", month: "long" });
    return t("updated_at", { time, date });
  }

  // Précision du modèle calculée sur l'historique (history.js → window.WC_HISTORY).
  function histAccuracy() {
    const entries = (window.WC_HISTORY && window.WC_HISTORY.entries) || [];
    const settled = entries.filter((e) => e.actual && e.predicted);
    if (!settled.length) return null;
    const correct = settled.filter((e) => e.predicted.favored === e.actual.outcome).length;
    return { total: settled.length, pct: Math.round((correct / settled.length) * 100) };
  }

  // Remplace les noms des 2 équipes par leur version localisée dans l'analyse
  // (phrase pré-générée par le robot, en anglais/mixte).
  const localizedAnalysis = (m) => {
    let a = m.analysis || "";
    [m.home, m.away].forEach((tm) => {
      if (tm && tm.name) {
        const loc = window.teamName(tm);
        if (loc && loc !== tm.name) a = a.split(tm.name).join(loc);
      }
    });
    return a;
  };

  // Suffixe prolongation / tirs au but sur un score final.
  const resultExtra = (r) => {
    if (!r) return "";
    if (r.pens && (r.pens.home != null || r.pens.away != null))
      return ` <span class="ai-note">${t("his_pens")} ${r.pens.home}‑${r.pens.away}</span>`;
    if (r.decidedBy === "aet") return ` <span class="ai-note">${t("his_aet")}</span>`;
    return "";
  };

  const favoredName = (m) => {
    const { home, draw, away } = m.probs;
    if (home >= draw && home >= away) return window.teamName(m.home);
    if (away >= draw && away >= home) return window.teamName(m.away);
    return t("card_draw");
  };

  const pinIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  /* ---------- hero stats ---------- */
  function renderHeroStats() {
    const avgConf = Math.round(
      matches.reduce((s, m) => s + m.confidence, 0) / matches.length
    );
    const next = matches.find((m) => new Date(m.datetime) >= new Date()) || matches[0];
    const nSources = matches[0] && matches[0].sources ? Object.keys(matches[0].sources).length : 0;
    const acc = histAccuracy();
    const stats = [{ value: matches.length, label: t("st_analyzed") }];
    if (acc) stats.push({ value: acc.pct + "%", label: t("st_accuracy", { n: acc.total }) });
    stats.push({ value: avgConf + "%", label: t("st_avgconf") });
    stats.push({ value: next ? favoredName(next) : "…", label: t("st_nextfav") });
    if (!acc) stats.push({ value: String(nSources), label: t("st_sources") });
    heroStatsEl.innerHTML = stats
      .map(
        (s) =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      )
      .join("");
  }

  /* ---------- filtres ---------- */
  function renderFilters() {
    const distinct = [...new Set(matches.map((m) => m.stage))];
    // Une seule phase (ex. « À venir ») → filtre inutile, on masque la barre.
    if (distinct.length <= 1) {
      filtersEl.innerHTML = "";
      filtersEl.hidden = true;
      activeStage = "Tous";
      return;
    }
    filtersEl.hidden = false;
    const stages = ["Tous", ...distinct];
    filtersEl.innerHTML = stages
      .map(
        (s) =>
          `<button class="filter-btn${s === activeStage ? " active" : ""}" data-stage="${s}" role="tab">${s === "Tous" ? t("filter_all") : s}</button>`
      )
      .join("");
    filtersEl.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeStage = btn.dataset.stage;
        renderFilters();
        renderMatches();
      });
    });
  }

  /* ---------- bloc sources ---------- */
  const SRC_HINTS = {
    Forme: "5 derniers matchs, du plus récent au plus ancien · V victoire · N nul · D défaite",
    "Face-à-face": "Bilan des confrontations passées · V victoires · N nuls · D défaites",
  };

  function sourceRow(m, src) {
    const w = Math.round(src.weight * 100);
    const hint = SRC_HINTS[src.label] ? ` title="${SRC_HINTS[src.label]}"` : "";
    if (!src.probs) {
      return `
      <div class="src-row src-off"${hint}>
        <span class="src-name">${src.label}</span>
        <div class="src-bar"></div>
        <span class="src-pick">indisponible</span>
        <span class="src-meta">pond. ${w}%</span>
      </div>`;
    }
    const fav = src.favored;
    const pct = src.probs[fav];
    return `
      <div class="src-row"${hint}>
        <span class="src-name">${src.label}</span>
        <div class="src-bar"><div class="src-fill" style="width:${pct}%"></div></div>
        <span class="src-pick">${sideLabel(m, fav)} <b>${pct}%</b></span>
        <span class="src-meta">pond. ${w}% · ${src.detail}</span>
      </div>`;
  }

  function scorerItem(s) {
    return `
      <li class="scorer">
        <span class="scorer-name">${s.name}</span>
        <span class="scorer-prob"><span class="scorer-fill" style="width:${s.prob}%"></span><b>${s.prob}%</b></span>
      </li>`;
  }

  function scorersBlock(m) {
    const sc = m.scorers;
    if (!sc) return "";
    // Format par équipe { home:[], away:[] } ou liste combinée { combined:[] }.
    if (sc.combined && sc.combined.length) {
      return `
        <div class="scorers">
          <div class="scorers-head">${t("scorers_head")}</div>
          <ul class="scorer-list">${sc.combined.map(scorerItem).join("")}</ul>
        </div>`;
    }
    if ((sc.home && sc.home.length) || (sc.away && sc.away.length)) {
      return `
        <div class="scorers">
          <div class="scorers-head">${t("scorers_head")}</div>
          <div class="scorers-grid">
            <div>
              <div class="scorers-team">${flagHTML(m.home, 15)} ${window.teamName(m.home)}</div>
              <ul class="scorer-list">${(sc.home || []).map(scorerItem).join("")}</ul>
            </div>
            <div>
              <div class="scorers-team">${flagHTML(m.away, 15)} ${window.teamName(m.away)}</div>
              <ul class="scorer-list">${(sc.away || []).map(scorerItem).join("")}</ul>
            </div>
          </div>
        </div>`;
    }
    return "";
  }

  function sourcesBlock(m) {
    if (!m.sources) return "";
    const order = ["betting", "form", "h2h", "press", "social"];
    const hasFormOrH2h = m.sources.form || m.sources.h2h;
    const legend = hasFormOrH2h
      ? `<p class="src-legend">
           <b>Forme</b> = 5 derniers matchs (du plus récent au plus ancien) ·
           <b>Face-à-face</b> = bilan des confrontations passées.
           <span class="src-legend-keys"><b>V</b> victoire · <b>N</b> nul · <b>D</b> défaite</span>
         </p>`
      : "";
    return `
      <details class="sources">
        <summary>${t("src_summary")}</summary>
        ${order.map((k) => (m.sources[k] ? sourceRow(m, m.sources[k]) : "")).join("")}
        ${legend}
      </details>`;
  }

  /* ---------- carte match ---------- */
  function card(m) {
    const { home, draw, away } = m.probs;
    const finished = m.status === "finished" && m.result;
    const projected = m.projected
      ? `<span class="badge-proj" title="${t("card_projected_title")}">${t("card_projected")}</span>`
      : "";
    const doneBadge = finished ? `<span class="badge-done">${t("card_finished")}</span>` : "";
    const scoreLabel = finished ? t("card_result") : t("card_scoreia");
    const extra = finished ? resultExtra(m.result) : "";
    const scoreVal = finished
      ? `${m.result.home} – ${m.result.away}${extra}`
      : `${m.predictedScore.home} – ${m.predictedScore.away}`;
    const aiNote = finished
      ? `<span class="ai-note">${t("card_ai_short")} ${m.predictedScore.home}–${m.predictedScore.away}</span>`
      : "";
    return `
      <article class="match-card${m.projected ? " is-projected" : ""}${finished ? " is-finished" : ""}">
        <div class="match-top">
          <span class="stage-tag">${finished ? doneBadge : m.stage + projected}</span>
          <span class="match-date">${fmtDate(m.datetime)} · ${fmtTime(m.datetime)}</span>
        </div>

        <div class="teams">
          <div class="team">
            <span class="flag">${flagHTML(m.home, 34)}</span>
            <span class="tname">${window.teamName(m.home)}</span>
          </div>
          <div class="score-pred">
            <span class="vs">${scoreLabel}</span>
            <span class="score">${scoreVal}</span>
            ${aiNote}
          </div>
          <div class="team">
            <span class="flag">${flagHTML(m.away, 34)}</span>
            <span class="tname">${window.teamName(m.away)}</span>
          </div>
        </div>

        <div class="prob-bar" role="img" aria-label="Probabilités ${home}% ${window.teamName(m.home)}, ${draw}% nul, ${away}% ${window.teamName(m.away)}">
          <div class="prob-seg home" style="width:${home}%"></div>
          <div class="prob-seg draw" style="width:${draw}%"></div>
          <div class="prob-seg away" style="width:${away}%"></div>
        </div>
        <div class="prob-legend">
          <span class="lg home"><b>${home}%</b>&nbsp;${flagHTML(m.home, 13)}</span>
          <span class="lg draw"><b>${draw}%</b>&nbsp;${t("card_draw")}</span>
          <span class="lg away"><b>${away}%</b>&nbsp;${flagHTML(m.away, 13)}</span>
        </div>

        <div class="confidence">
          <span class="confidence-label">${t("card_conf")}</span>
          <div class="confidence-track"><div class="confidence-fill" style="width:${m.confidence}%"></div></div>
          <span class="confidence-pct">${m.confidence}%</span>
        </div>

        <p class="analysis">${localizedAnalysis(m)}</p>
        ${scorersBlock(m)}
        ${sourcesBlock(m)}
        ${m.venue ? `<div class="venue">${pinIcon}<span>${m.venue}</span></div>` : ""}
      </article>`;
  }

  /* ---------- rendu liste ---------- */
  function renderMatches() {
    const q = query.trim().toLowerCase();
    const filtered = matches.filter((m) => {
      const stageOk = activeStage === "Tous" || m.stage === activeStage;
      const searchOk =
        !q ||
        (window.teamName(m.home) + " " + m.home.name).toLowerCase().includes(q) ||
        (window.teamName(m.away) + " " + m.away.name).toLowerCase().includes(q);
      return stageOk && searchOk;
    });

    listEl.innerHTML = filtered.map(card).join("");
    listEl.querySelectorAll(".match-card").forEach((el, i) => {
      el.style.animationDelay = i * 50 + "ms";
    });
    emptyEl.hidden = filtered.length !== 0;
  }

  /* ---------- init ---------- */
  let lastUpdatedISO = null;

  function renderAll() {
    if (lastUpdatedISO) {
      updatedEl.textContent = updatedLabel(lastUpdatedISO);
      updatedEl.title = new Date(lastUpdatedISO).toLocaleString(locale());
    }
    renderHeroStats();
    renderFilters();
    renderMatches();
  }

  loadData()
    .then((data) => {
      matches = (data.matches || []).slice().sort(
        (a, b) => new Date(a.datetime) - new Date(b.datetime)
      );
      lastUpdatedISO = data.updatedAt || null;

      searchEl.addEventListener("input", (e) => {
        query = e.target.value;
        renderMatches();
      });

      renderAll();
      // re-render quand la langue change
      document.addEventListener("i18n:changed", renderAll);
    })
    .catch(() => {
      listEl.innerHTML =
        `<p class="empty-state">${t("load_error")}</p>`;
    });
})();
