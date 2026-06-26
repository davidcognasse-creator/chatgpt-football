(function () {
  "use strict";

  const data = window.WC_DATA || { matches: [], updatedAt: null };
  const matches = data.matches.slice().sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );

  const listEl = document.getElementById("matchList");
  const emptyEl = document.getElementById("emptyState");
  const filtersEl = document.getElementById("stageFilters");
  const searchEl = document.getElementById("searchInput");
  const heroStatsEl = document.getElementById("heroStats");
  const updatedEl = document.getElementById("lastUpdated");

  let activeStage = "Tous";
  let query = "";

  /* ---------- helpers ---------- */
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const favored = (m) => {
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
    const stats = [
      { value: matches.length, label: "Matchs analysés" },
      { value: avgConf + "%", label: "Confiance moyenne" },
      { value: next ? favored(next) : "—", label: "Prochain favori" },
    ];
    heroStatsEl.innerHTML = stats
      .map(
        (s) =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      )
      .join("");
  }

  /* ---------- filters ---------- */
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

  /* ---------- match card ---------- */
  function card(m) {
    const { home, draw, away } = m.probs;
    return `
      <article class="match-card">
        <div class="match-top">
          <span class="stage-tag">${m.stage}</span>
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

        <div class="prob-bar" role="img" aria-label="Probabilités ${home}% victoire ${m.home.name}, ${draw}% nul, ${away}% victoire ${m.away.name}">
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
        <div class="venue">${pinIcon}<span>${m.venue}</span></div>
      </article>`;
  }

  /* ---------- render list ---------- */
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
      el.style.animationDelay = i * 60 + "ms";
    });
    emptyEl.hidden = filtered.length !== 0;
  }

  /* ---------- init ---------- */
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
})();
