// Onglet « Gain de l'IA » · portefeuille VIRTUEL (aucun pari réel).
// Gestion de capital compounding : départ 50 €, on mise 40 % du CAPITAL courant
// à chaque pari (favori IA > 50 %), plafonné à 200 €/pari. Cotes Unibet (marge ~6 %).
(function () {
  "use strict";
  const app = document.getElementById("gainsApp");
  if (!app) return;
  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE", ar: "ar" };
  const locale = () => LOC[window.getLang ? window.getLang() : "fr"] || "fr-FR";
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short" });
  const tn = (x) => (window.teamName ? window.teamName(x) : (x && x.name) || "");

  // Paramètres de la stratégie
  const START = 50;       // capital de départ (€)
  const FRAC = 0.40;      // fraction du capital misée à chaque pari
  const CAP = 200;        // plafond de mise par pari (€)
  const OVERROUND = 1.06; // marge bookmaker (Unibet)

  async function load() {
    try {
      const r = await fetch("history.json", { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      if (window.WC_HISTORY) return window.WC_HISTORY;
      throw e;
    }
  }
  function trueOutcome(a) {
    if (a && a.pens && a.pens.home != null && a.pens.away != null && a.pens.home !== a.pens.away)
      return a.pens.home > a.pens.away ? "home" : "away";
    return a ? a.outcome : "draw";
  }
  const eur = (n) => `${Math.round(n)} €`;
  const signed = (n) => `${n >= 0 ? "+" : ""}${Math.round(n)} €`;
  const cls = (n) => (n >= 0 ? "pf-pos" : "pf-neg");

  function render(data) {
    const entries = (data.entries || []).slice().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const bets = entries.filter((e) => e.predicted.probs[e.predicted.favored] > 50);
    if (!bets.length) { app.innerHTML = `<p class="empty-state">${t("his_empty")}</p>`; return; }

    let bank = START, w = 0, l = 0, peak = START, rows = "";
    bets.forEach((e) => {
      const fav = e.predicted.favored;
      const bet = e.sources && e.sources.betting;
      const fair = bet && bet[fav] ? bet[fav] / 100 : e.predicted.probs[fav] / 100;
      const pU = Math.min(0.99, fair * OVERROUND);
      const oddU = 1 / pU;
      const stake = Math.min(bank * FRAC, CAP, bank);
      const won = trueOutcome(e.actual) === fav;
      if (won) { bank += stake * (oddU - 1); w += 1; }
      else { bank -= stake; l += 1; }
      peak = Math.max(peak, bank);
      const pickName = fav === "home" ? tn(e.home) : fav === "away" ? tn(e.away) : t("his_draw");
      rows += `<tr class="${won ? "g-won" : "g-lost"}">
          <td class="g-date">${fmtDate(e.datetime)}</td>
          <td class="g-match">${tn(e.home)} – ${tn(e.away)}</td>
          <td>${pickName} <span class="g-prob">${e.predicted.probs[fav]}%</span></td>
          <td class="g-odds">${oddU.toFixed(2)}</td>
          <td class="g-res">${won ? "✅" : "❌"} ${e.actual.home}-${e.actual.away}</td>
          <td class="g-odds">${eur(stake)}</td>
          <td class="${cls(bank - START)}">${eur(bank)}</td>
        </tr>`;
    });
    const net = bank - START;
    const roi = (bank / START - 1) * 100;

    app.innerHTML = `
      <div class="paper-card">
        <div class="paper-head"><h3>💶 ${t("pf_title")}</h3><span class="paper-tag">${t("pf_virtual")}</span></div>
        <p class="pf-strategy">${t("pf_strategy")} · ${t("pf_start")} ${START} € · plafond ${CAP} €/pari · Unibet</p>
        <div class="paper-grid pf-grid3">
          <div class="pf-stat"><div class="pf-val">${START} €</div><div class="pf-lab">${t("pf_start")}</div></div>
          <div class="pf-stat"><div class="pf-val ${cls(net)}">${eur(bank)}</div><div class="pf-lab">${t("pf_final")}</div></div>
          <div class="pf-stat"><div class="pf-val">${w}/${l}</div><div class="pf-lab">${t("pf_wl")}</div></div>
        </div>
        <div class="pf-platforms">
          <div class="pf-plat">
            <div class="pf-plat-name">Unibet <span class="pf-plat-note">${t("pf_book")}</span></div>
            <div class="pf-plat-figs"><span class="pf-big ${cls(net)}">${signed(net)}</span><span class="pf-roi ${cls(net)}">${roi >= 0 ? "+" : ""}${roi.toFixed(0)} %</span></div>
          </div>
        </div>
        <p class="paper-warn">⚠️ ${t("pf_warn")}</p>
      </div>
      <div class="g-tablewrap">
        <table class="g-table">
          <thead><tr>
            <th></th><th>${t("gains_c_match")}</th><th>${t("gains_c_pick")}</th>
            <th>${t("gains_c_odds")}</th><th>${t("gains_c_res")}</th>
            <th>${t("gains_c_stake")}</th><th>${t("gains_c_bank")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  load()
    .then((d) => { render(d); document.addEventListener("i18n:changed", () => render(d)); })
    .catch(() => { app.innerHTML = `<p class="empty-state">${t("his_unavailable")}</p>`; });
})();
