(function () {
  "use strict";

  const champStatEl = document.getElementById("champStat");
  const champListEl = document.getElementById("champList");
  const winnerUpdatedEl = document.getElementById("winnerUpdated");
  const bracketEl = document.getElementById("bracket");

  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE", ar: "ar" };
  const locale = () => LOC[window.getLang ? window.getLang() : "fr"] || "fr-FR";

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
      champListEl.innerHTML = `<p class="empty-state">${t("sim_unavailable")}</p>`;
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
          <div class="stat-label">${t("sim_fav_label", { p: top.prob })}</div>
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
      const d = new Date(winner.updatedAt).toLocaleDateString(locale(), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      winnerUpdatedEl.textContent = t("sim_updated", { d });
    }
  }

  /* ---------- Chemin projeté vers le titre (bracket hypothétique) ---------- */
  // Probabilité que A batte B, dérivée des probabilités de titre (style Bradley-Terry).
  // Ordre des têtes de série pour un bracket de n équipes (n puissance de 2),
  // de sorte que les favoris se rencontrent le plus tard possible.
  function seedOrder(n) {
    let pls = [1, 2];
    for (let r = 0; r < Math.log2(n) - 1; r++) {
      const sum = pls.length * 2 + 1, out = [];
      for (const p of pls) { out.push(p, sum - p); }
      pls = out;
    }
    return pls; // seeds 1-indexés, dans l'ordre du tableau
  }

  function buildBracket(teams) {
    const n = teams.length >= 16 ? 16 : 8; // 8es si ≥ 16 équipes, sinon quarts
    const top = teams.slice(0, n);
    const order = seedOrder(n);
    let round = [];
    for (let i = 0; i < order.length; i += 2) {
      const a = top[order[i] - 1], b = top[order[i + 1] - 1];
      if (a && b) round.push([a, b]);
    }
    const rounds = [];
    while (round.length >= 1) {
      const winners = [];
      const matches = round.map(([a, b]) => {
        const wa = a.prob / (a.prob + b.prob);
        const winner = wa >= 0.5 ? a : b;
        winners.push(winner);
        return { a, b, winner, winPct: Math.round(Math.max(wa, 1 - wa) * 100) };
      });
      rounds.push(matches);
      if (round.length === 1) break;
      const next = [];
      for (let i = 0; i < winners.length; i += 2) next.push([winners[i], winners[i + 1]]);
      round = next;
    }
    return rounds; // [quarts(4), demies(2), finale(1)]
  }

  function brTeam(team, win, pct) {
    return `<div class="br-team ${win ? "win" : "lose"}">
      <span class="br-flag">${flagHTML(team, 18)}</span>
      <span class="br-name">${team.name}</span>
      ${win ? `<span class="br-win">🏆 ${pct}%</span>` : `<span class="br-prob">${team.prob}%</span>`}
    </div>`;
  }

  function renderBracket(winner) {
    if (!bracketEl) return;
    if (!winner || !winner.teams || winner.teams.length < 8) { bracketEl.innerHTML = ""; return; }
    const teams = winner.teams.slice().sort((a, b) => b.prob - a.prob);
    const rounds = buildBracket(teams);
    const labelKeys = rounds.length === 4
      ? ["sim_round_r16", "sim_round_quarter", "sim_round_semi", "sim_round_final"]
      : ["sim_round_quarter", "sim_round_semi", "sim_round_final"];
    let html = "";
    rounds.forEach((matches, ri) => {
      html += `<div class="br-round"><div class="br-round-label">${t(labelKeys[ri] || "sim_round_final")}</div>`;
      matches.forEach((m) => {
        html += `<div class="br-match">
          ${brTeam(m.a, m.winner === m.a, m.winPct)}
          ${brTeam(m.b, m.winner === m.b, m.winPct)}
        </div>`;
      });
      html += `</div>`;
    });
    const champ = rounds[rounds.length - 1][0].winner;
    html += `<div class="br-champion"><span class="br-trophy">🏆</span> ${flagHTML(champ, 28)} <b>${champ.name}</b> <span class="br-champ-label">${t("sim_champion")}</span></div>`;
    bracketEl.innerHTML = html;
  }

  let lastWinner = null;
  loadJSON("winner.json", "WC_WINNER").then((w) => { lastWinner = w; renderWinner(w); renderBracket(w); });
  document.addEventListener("i18n:changed", () => { renderWinner(lastWinner); renderBracket(lastWinner); });
})();
