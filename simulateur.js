(function () {
  "use strict";

  const champStatEl = document.getElementById("champStat");
  const champListEl = document.getElementById("champList");
  const winnerUpdatedEl = document.getElementById("winnerUpdated");

  async function loadJSON(url, fallbackGlobal) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      if (window[fallbackGlobal]) return window[fallbackGlobal];
      return null;
    }
  }

  /* ---------- Probabilités de titre ---------- */
  function renderWinner(winner) {
    if (!winner || !winner.teams || !winner.teams.length) {
      champListEl.innerHTML = '<p class="empty-state">Estimation de titre indisponible.</p>';
      return;
    }
    const teams = winner.teams.slice().sort((a, b) => b.prob - a.prob);
    const top = teams[0];
    const max = top.prob || 1;

    champStatEl.innerHTML = `
      <div class="stat champ-hero">
        <div class="champ-hero-flag">${flagHTML(top, 48)}</div>
        <div>
          <div class="stat-value">${top.name}</div>
          <div class="stat-label">Favori pour le titre · ${top.prob}%</div>
        </div>
      </div>`;

    champListEl.innerHTML = teams
      .map((t, i) => `
        <div class="champ-row">
          <span class="champ-rank">${i + 1}</span>
          <span class="champ-flag">${flagHTML(t, 22)}</span>
          <span class="champ-name">${t.name}</span>
          <div class="champ-bar"><div class="champ-fill" style="width:${Math.max(2, (t.prob / max) * 100)}%"></div></div>
          <span class="champ-prob">${t.prob}%</span>
        </div>`)
      .join("");

    if (winner.updatedAt) {
      winnerUpdatedEl.textContent =
        "Mis à jour le " +
        new Date(winner.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    }
  }

  loadJSON("winner.json", "WC_WINNER").then(renderWinner);
})();
