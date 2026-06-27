(function () {
  "use strict";

  const champStatEl = document.getElementById("champStat");
  const champListEl = document.getElementById("champList");
  const winnerUpdatedEl = document.getElementById("winnerUpdated");
  const projListEl = document.getElementById("projList");

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

  const sideName = (m, key) =>
    key === "home" ? m.home.name : key === "away" ? m.away.name : "Match nul";
  const sideFlag = (m, key) =>
    key === "home" ? m.home.flag : key === "away" ? m.away.flag : "🤝";
  const favored = (p) =>
    p.home >= p.draw && p.home >= p.away ? "home" : p.away >= p.draw ? "away" : "draw";
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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
        <div class="champ-hero-flag">${top.flag}</div>
        <div>
          <div class="stat-value">${top.name}</div>
          <div class="stat-label">Favori pour le titre · ${top.prob}%</div>
        </div>
      </div>`;

    champListEl.innerHTML = teams
      .map((t, i) => `
        <div class="champ-row">
          <span class="champ-rank">${i + 1}</span>
          <span class="champ-flag">${t.flag}</span>
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

  /* ---------- Issues projetées des prochains matchs ---------- */
  function renderProjections(data) {
    if (!data || !data.matches) {
      projListEl.innerHTML = '<p class="empty-state">Aucun match à venir.</p>';
      return;
    }
    const now = new Date();
    const upcoming = data.matches
      .filter((m) => new Date(m.datetime) >= now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const list = upcoming.length ? upcoming : data.matches;
    if (!list.length) {
      projListEl.innerHTML = '<p class="empty-state">Aucun match à venir.</p>';
      return;
    }

    projListEl.innerHTML = list
      .map((m) => {
        const fav = favored(m.probs);
        const pct = m.probs[fav];
        const issue = fav === "draw" ? "Match nul" : `Victoire ${sideName(m, fav)}`;
        return `
          <div class="proj-row">
            <div class="proj-match">
              <span>${m.home.flag} ${m.home.code}</span>
              <span class="proj-score">${m.predictedScore.home}–${m.predictedScore.away}</span>
              <span>${m.away.code} ${m.away.flag}</span>
            </div>
            <div class="proj-outcome">
              <span class="proj-pick">${sideFlag(m, fav)} ${issue}</span>
              <span class="proj-conf">${pct}%</span>
            </div>
            <div class="proj-date">${fmtDate(m.datetime)}</div>
          </div>`;
      })
      .join("");
  }

  Promise.all([
    loadJSON("winner.json", "WC_WINNER"),
    loadJSON("data.json", "WC_DATA"),
  ]).then(([winner, data]) => {
    renderWinner(winner);
    renderProjections(data);
  });
})();
