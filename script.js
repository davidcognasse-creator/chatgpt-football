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
    key === "home" ? m.home.code : key === "away" ? m.away.code : "Nul";

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
    const stats = [
      { value: matches.length, label: "Matchs analysés" },
      { value: avgConf + "%", label: "Confiance moyenne" },
      { value: next ? favoredName(next) : "—", label: "Prochain favori" },
      { value: String(nSources), label: "Sources agrégées" },
    ];
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
  function sourceRow(m, src) {
    const w = Math.round(src.weight * 100);
    if (!src.probs) {
      return `
      <div class="src-row src-off">
        <span class="src-name">${src.label}</span>
        <div class="src-bar"></div>
        <span class="src-pick">indisponible</span>
        <span class="src-meta">pond. ${w}%</span>
      </div>`;
    }
    const fav = src.favored;
    const pct = src.probs[fav];
    return `
      <div class="src-row">
        <span class="src-name">${src.label}</span>
        <div class="src-bar"><div class="src-fill" style="width:${pct}%"></div></div>
        <span class="src-pick">${sideLabel(m, fav)} <b>${pct}%</b></span>
        <span class="src-meta">pond. ${w}% · ${src.detail}</span>
      </div>`;
  }

  function sourcesBlock(m) {
    if (!m.sources) return "";
    const order = ["betting", "form", "h2h", "press", "social"];
    return `
      <details class="sources">
        <summary>Détail des sources agrégées</summary>
        ${order.map((k) => (m.sources[k] ? sourceRow(m, m.sources[k]) : "")).join("")}
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
            <span class="flag">${m.home.flag}</span>
            <span class="tname">${m.home.name}</span>
          </div>
          <div class="score-pred">
            <span class="vs">Score IA</span>
            <span class="score">${m.predictedScore.home} – ${m.predictedScore.away}</span>
          </div>
          <div class="team">
            <span class="flag">${m.away.flag}</span>
            <span class="tname">${m.away.name}</span>
          </div>
        </div>

        <div class="prob-bar" role="img" aria-label="Probabilités ${home}% ${m.home.name}, ${draw}% nul, ${away}% ${m.away.name}">
          <div class="prob-seg home" style="width:${home}%"></div>
          <div class="prob-seg draw" style="width:${draw}%"></div>
          <div class="prob-seg away" style="width:${away}%"></div>
        </div>
        <div class="prob-legend">
          <span class="lg home"><b>${home}%</b>&nbsp;${m.home.code}</span>
          <span class="lg draw"><b>${draw}%</b>&nbsp;Nul</span>
          <span class="lg away"><b>${away}%</b>&nbsp;${m.away.code}</span>
        </div>

        <div class="confidence">
          <span class="confidence-label">Confiance</span>
          <div class="confidence-track"><div class="confidence-fill" style="width:${m.confidence}%"></div></div>
          <span class="confidence-pct">${m.confidence}%</span>
        </div>

        <p class="analysis">${m.analysis}</p>
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
        updatedEl.textContent =
          "MàJ " +
          new Date(data.updatedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
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
