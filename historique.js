(function () {
  "use strict";

  const listEl = document.getElementById("historyList");
  const emptyEl = document.getElementById("emptyState");
  const statsEl = document.getElementById("histStats");

  async function loadData() {
    try {
      const res = await fetch("history.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      if (window.WC_HISTORY) return window.WC_HISTORY;
      throw e;
    }
  }

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const sideName = (m, key) =>
    key === "home" ? m.home.name : key === "away" ? m.away.name : "Nul";

  // Recalcule la justesse à partir des données (robuste si les flags manquent).
  function isCorrect(e) {
    return e.predicted.favored === e.actual.outcome;
  }
  function isExact(e) {
    return e.predicted.score.home === e.actual.home && e.predicted.score.away === e.actual.away;
  }

  function renderStats(entries) {
    const total = entries.length;
    const correct = entries.filter(isCorrect).length;
    const acc = total ? Math.round((correct / total) * 100) : 0;
    const stats = [
      { value: acc + "%", label: "Précision (1N2)" },
      { value: `${correct}/${total}`, label: "Bons pronostics" },
      { value: `${total}`, label: "Matchs terminés" },
    ];
    statsEl.innerHTML = stats
      .map(
        (s) =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      )
      .join("");
  }

  function row(e) {
    const ok = isCorrect(e);
    const exact = isExact(e);
    const predName = sideName(e, e.predicted.favored);
    const predProb = e.predicted.probs[e.predicted.favored];
    return `
      <article class="hist-card ${ok ? "is-ok" : "is-ko"}">
        <div class="hist-top">
          <span class="hist-date">${fmtDate(e.datetime)}</span>
          <span class="verdict ${ok ? "ok" : "ko"}">${ok ? "✓ Bon pronostic" : "✗ Raté"}${
      exact ? ' · <span class="exact">score exact</span>' : ""
    }</span>
        </div>

        <div class="hist-teams">
          <span class="ht">${flagHTML(e.home, 16)} ${e.home.name}</span>
          <span class="ht-score">${e.actual.home} – ${e.actual.away}</span>
          <span class="ht ht-right">${e.away.name} ${flagHTML(e.away, 16)}</span>
        </div>

        <div class="hist-compare">
          <div class="cmp">
            <span class="cmp-label">Pronostic IA</span>
            <span class="cmp-val">${predName} <b>${predProb}%</b> · ${e.predicted.score.home}–${e.predicted.score.away}</span>
          </div>
          <div class="cmp">
            <span class="cmp-label">Résultat réel</span>
            <span class="cmp-val">${
              e.actual.outcome === "draw" ? "Match nul" : sideName(e, e.actual.outcome)
            } · ${e.actual.home}–${e.actual.away}</span>
          </div>
        </div>
      </article>`;
  }

  loadData()
    .then((data) => {
      const entries = (data.entries || []).slice();
      if (!entries.length) {
        emptyEl.hidden = false;
        statsEl.innerHTML = "";
        return;
      }
      renderStats(entries);
      listEl.innerHTML = entries.map(row).join("");
      listEl.querySelectorAll(".hist-card").forEach((el, i) => {
        el.style.animationDelay = i * 40 + "ms";
      });
    })
    .catch(() => {
      listEl.innerHTML = '<p class="empty-state">Impossible de charger l\'historique.</p>';
    });
})();
