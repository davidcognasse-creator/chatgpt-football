(function () {
  "use strict";

  const champStatEl = document.getElementById("champStat");
  const champListEl = document.getElementById("champList");
  const winnerUpdatedEl = document.getElementById("winnerUpdated");

  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE" };
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

  let lastWinner = null;
  loadJSON("winner.json", "WC_WINNER").then((w) => { lastWinner = w; renderWinner(w); });
  document.addEventListener("i18n:changed", () => renderWinner(lastWinner));
})();
