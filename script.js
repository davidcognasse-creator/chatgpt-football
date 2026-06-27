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
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const sideLabel = (m, key) =>
    key === "home" ? flagHTML(m.home, 14) : key === "away" ? flagHTML(m.away, 14) : "Nul";

  // « il y a 3 h » plutôt qu'une date brute.
  function relativeTime(iso) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const h = Math.round(mins / 60);
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.round(h / 24)} j`;
  }

  // Précision du modèle calculée sur l'historique (history.js → window.WC_HISTORY).
  function histAccuracy() {
    const entries = (window.WC_HISTORY && window.WC_HISTORY.entries) || [];
    const settled = entries.filter((e) => e.actual && e.predicted);
    if (!settled.length) return null;
    const correct = settled.filter((e) => e.predicted.favored === e.actual.outcome).length;
    return { total: settled.length, pct: Math.round((correct / settled.length) * 100) };
  }

  const favoredName = (m) => {
    const { home, draw, away } = m.probs;
    if (home >= draw && home >= away) return m.home.name;
    if (away >= draw && away >= home) return m.away.name;
    return "Nul";
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
    const stats = [{ value: matches.length, label: "Matchs analysés" }];
    if (acc) stats.push({ value: acc.pct + "%", label: `Précision (${acc.total} matchs)` });
    stats.push({ value: avgConf + "%", label: "Confiance moyenne" });
    stats.push({ value: next ? favoredName(next) : "—", label: "Prochain favori" });
    if (!acc) stats.push({ value: String(nSources), label: "Sources agrégées" });
    heroStatsEl.innerHTML = stats
      .map(
        (s) =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      )
      .join("");
  }

  /* ---------- filtres ---------- */
  function renderFilters() {
    const stages = ["Tous", ...new Set(matches.map((m) => m.stage))];
    filtersEl.innerHTML = stages
      .map(
        (s) =>
          `<button class="filter-btn${s === activeStage ? " active" : ""}" data-stage="${s}" role="tab">${s}</button>`
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
    Forme: "5 derniers matchs, du plus récent au plus ancien — V victoire · N nul · D défaite",
    "Face-à-face": "Bilan des confrontations passées — V victoires · N nuls · D défaites",
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
          <div class="scorers-head">⚽ Buteurs probables</div>
          <ul class="scorer-list">${sc.combined.map(scorerItem).join("")}</ul>
        </div>`;
    }
    if ((sc.home && sc.home.length) || (sc.away && sc.away.length)) {
      return `
        <div class="scorers">
          <div class="scorers-head">⚽ Buteurs probables</div>
          <div class="scorers-grid">
            <div>
              <div class="scorers-team">${flagHTML(m.home, 15)} ${m.home.name}</div>
              <ul class="scorer-list">${(sc.home || []).map(scorerItem).join("")}</ul>
            </div>
            <div>
              <div class="scorers-team">${flagHTML(m.away, 15)} ${m.away.name}</div>
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
        <summary>Détail des sources agrégées</summary>
        ${order.map((k) => (m.sources[k] ? sourceRow(m, m.sources[k]) : "")).join("")}
        ${legend}
      </details>`;
  }

  /* ---------- carte match ---------- */
  function card(m) {
    const { home, draw, away } = m.probs;
    const projected = m.projected
      ? '<span class="badge-proj" title="Affiche projetée selon les pronostics">Projeté</span>'
      : "";
    return `
      <article class="match-card${m.projected ? " is-projected" : ""}">
        <div class="match-top">
          <span class="stage-tag">${m.stage}${projected}</span>
          <span class="match-date">${fmtDate(m.datetime)} · ${fmtTime(m.datetime)}</span>
        </div>

        <div class="teams">
          <div class="team">
            <span class="flag">${flagHTML(m.home, 34)}</span>
            <span class="tname">${m.home.name}</span>
          </div>
          <div class="score-pred">
            <span class="vs">Score IA</span>
            <span class="score">${m.predictedScore.home} – ${m.predictedScore.away}</span>
          </div>
          <div class="team">
            <span class="flag">${flagHTML(m.away, 34)}</span>
            <span class="tname">${m.away.name}</span>
          </div>
        </div>

        <div class="prob-bar" role="img" aria-label="Probabilités ${home}% ${m.home.name}, ${draw}% nul, ${away}% ${m.away.name}">
          <div class="prob-seg home" style="width:${home}%"></div>
          <div class="prob-seg draw" style="width:${draw}%"></div>
          <div class="prob-seg away" style="width:${away}%"></div>
        </div>
        <div class="prob-legend">
          <span class="lg home"><b>${home}%</b>&nbsp;${flagHTML(m.home, 13)}</span>
          <span class="lg draw"><b>${draw}%</b>&nbsp;Nul</span>
          <span class="lg away"><b>${away}%</b>&nbsp;${flagHTML(m.away, 13)}</span>
        </div>

        <div class="confidence">
          <span class="confidence-label">Confiance</span>
          <div class="confidence-track"><div class="confidence-fill" style="width:${m.confidence}%"></div></div>
          <span class="confidence-pct">${m.confidence}%</span>
        </div>

        <p class="analysis">${m.analysis}</p>
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
        m.home.name.toLowerCase().includes(q) ||
        m.away.name.toLowerCase().includes(q);
      return stageOk && searchOk;
    });

    listEl.innerHTML = filtered.map(card).join("");
    listEl.querySelectorAll(".match-card").forEach((el, i) => {
      el.style.animationDelay = i * 50 + "ms";
    });
    emptyEl.hidden = filtered.length !== 0;
  }

  /* ---------- init ---------- */
  loadData()
    .then((data) => {
      matches = (data.matches || []).slice().sort(
        (a, b) => new Date(a.datetime) - new Date(b.datetime)
      );

      if (data.updatedAt) {
        updatedEl.textContent = "Mis à jour " + relativeTime(data.updatedAt);
        updatedEl.title = new Date(data.updatedAt).toLocaleString("fr-FR");
      }

      searchEl.addEventListener("input", (e) => {
        query = e.target.value;
        renderMatches();
      });

      renderHeroStats();
      renderFilters();
      renderMatches();
    })
    .catch(() => {
      listEl.innerHTML =
        '<p class="empty-state">Impossible de charger les pronostics (data.json).</p>';
    });
})();
