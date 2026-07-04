// Onglet « Gain de l'IA » — portefeuille VIRTUEL (aucun pari réel).
// Mise fictive de 20 € sur chaque match où l'IA donnait le favori > 50 %,
// gains théoriques comparés Unibet (marge ~6 %) vs Polymarket (≈ prix marché).
(function () {
  "use strict";
  const app = document.getElementById("gainsApp");
  if (!app) return;
  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE", ar: "ar" };
  const locale = () => LOC[window.getLang ? window.getLang() : "fr"] || "fr-FR";
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short" });
  const tn = (x) => (window.teamName ? window.teamName(x) : (x && x.name) || "");
  const STAKE = 20, OVERROUND = 1.06;

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
  const money = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(0)} €`;
  const cls = (n) => (n >= 0 ? "pf-pos" : "pf-neg");

  function render(data) {
    const entries = (data.entries || []).slice().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const bets = entries.filter((e) => e.predicted.probs[e.predicted.favored] > 50);
    if (!bets.length) { app.innerHTML = `<p class="empty-state">${t("his_empty")}</p>`; return; }

    let staked = 0, w = 0, l = 0, netU = 0, netP = 0, rows = "";
    bets.forEach((e) => {
      const fav = e.predicted.favored;
      const bet = e.sources && e.sources.betting;
      const fair = bet && bet[fav] ? bet[fav] / 100 : e.predicted.probs[fav] / 100;
      const pU = Math.min(0.99, fair * OVERROUND), pP = fair;
      const oddU = 1 / pU;
      staked += STAKE;
      const won = trueOutcome(e.actual) === fav;
      if (won) { netU += STAKE * (oddU - 1); netP += STAKE * (1 / pP - 1); w += 1; }
      else { netU -= STAKE; netP -= STAKE; l += 1; }
      const pickName = fav === "home" ? tn(e.home) : fav === "away" ? tn(e.away) : t("his_draw");
      rows += `<tr class="${won ? "g-won" : "g-lost"}">
          <td class="g-date">${fmtDate(e.datetime)}</td>
          <td class="g-match">${tn(e.home)} – ${tn(e.away)}</td>
          <td>${pickName} <span class="g-prob">${e.predicted.probs[fav]}%</span></td>
          <td class="g-odds">${oddU.toFixed(2)}</td>
          <td class="g-res">${won ? "✅" : "❌"} ${e.actual.home}-${e.actual.away}</td>
          <td class="${cls(netU)}">${money(netU)}</td>
          <td class="${cls(netP)}">${money(netP)}</td>
        </tr>`;
    });
    const pct = (n) => `${n >= 0 ? "+" : ""}${(n / staked * 100).toFixed(0)} %`;
    const plat = (name, note, net) => `
      <div class="pf-plat">
        <div class="pf-plat-name">${name} <span class="pf-plat-note">${note}</span></div>
        <div class="pf-plat-figs"><span class="pf-big ${cls(net)}">${money(net)}</span><span class="pf-roi ${cls(net)}">${pct(net)}</span></div>
      </div>`;

    app.innerHTML = `
      <div class="paper-card">
        <div class="paper-head"><h3>💶 ${t("pf_title")}</h3><span class="paper-tag">${t("pf_virtual")}</span></div>
        <div class="paper-grid pf-grid3">
          <div class="pf-stat"><div class="pf-val">${bets.length}</div><div class="pf-lab">${t("pf_bets")}</div></div>
          <div class="pf-stat"><div class="pf-val">${w}/${l}</div><div class="pf-lab">${t("pf_wl")}</div></div>
          <div class="pf-stat"><div class="pf-val">${staked.toFixed(0)} €</div><div class="pf-lab">${t("pf_staked")}</div></div>
        </div>
        <div class="pf-platforms">${plat("Unibet", t("pf_book"), netU)}${plat("Polymarket", t("pf_poly_note"), netP)}</div>
        <p class="paper-warn">⚠️ ${t("pf_warn")}</p>
      </div>
      <div class="g-tablewrap">
        <table class="g-table">
          <thead><tr>
            <th></th><th>${t("gains_c_match")}</th><th>${t("gains_c_pick")}</th>
            <th>${t("gains_c_odds")}</th><th>${t("gains_c_res")}</th>
            <th>${t("gains_c_uni")}</th><th>${t("gains_c_poly")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  load()
    .then((d) => { render(d); document.addEventListener("i18n:changed", () => render(d)); })
    .catch(() => { app.innerHTML = `<p class="empty-state">${t("his_unavailable")}</p>`; });
})();
