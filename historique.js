(function () {
  "use strict";

  const listEl = document.getElementById("historyList");
  const emptyEl = document.getElementById("emptyState");
  const statsEl = document.getElementById("histStats");
  const insightEl = document.getElementById("histInsight");

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

  const t = (k, v) => (window.t ? window.t(k, v) : k);
  const LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", sw: "sw-KE", ar: "ar" };
  const locale = () => LOC[window.getLang ? window.getLang() : "fr"] || "fr-FR";

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });

  const sideName = (m, key) =>
    key === "home" ? window.teamName(m.home) : key === "away" ? window.teamName(m.away) : t("his_draw");

  // Suffixe « a.p. » (prolongation) ou « t.a.b. X-Y » (tirs au but) pour connaître
  // le vrai vainqueur des matchs à élimination directe.
  // Pastille lisible : "prolongation" ou "tirs au but 4–2" (le pronostic 1N2
  // reste réglé sur les 90 min, cette pastille n'est qu'une info).
  // Le score affiché est celui des 90 min (issue 1N2). On indique entre
  // parenthèses le score FINAL du match : (3–2 après prolongation) ou
  // (t.a.b. 4–2), pour montrer les deux scores.
  function scoreExtra(a) {
    if (!a) return "";
    if (a.decidedBy === "pens" || (a.pens && a.pens.home != null)) {
      const sc = a.pens && a.pens.home != null ? ` ${a.pens.home}‑${a.pens.away}` : "";
      return ` <span class="score-extra">🥅 (${t("his_pens")}${sc})</span>`;
    }
    if (a.decidedBy === "aet") {
      return a.full
        ? ` <span class="score-extra">⏱ (${a.full.home}‑${a.full.away})</span>`
        : ` <span class="score-extra">⏱</span>`;
    }
    return "";
  }

  // Résultat 1N2 (90 minutes).
  const res90 = (a) => (a ? a.outcome : "draw");

  // Justesse en 1N2 : on compare au résultat des 90 minutes (actual.outcome).
  // Un match gagné en prolongation/t.a.b. = nul à 90 → pronostic "N".
  function isCorrect(e) {
    return e.predicted.favored === res90(e.actual);
  }
  function isExact(e) {
    return e.predicted.score.home === e.actual.home && e.predicted.score.away === e.actual.away;
  }

  function renderStats(entries) {
    const total = entries.length;
    const correct = entries.filter(isCorrect).length;
    const acc = total ? Math.round((correct / total) * 100) : 0;
    const stats = [
      { value: acc + "%", label: t("his_stat_accuracy") },
      { value: `${correct}/${total}`, label: t("his_stat_good") },
      { value: `${total}`, label: t("his_stat_finished") },
    ];
    statsEl.innerHTML = stats
      .map(
        (s) =>
          `<div class="stat"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`
      )
      .join("");
  }

  // Encart : fiabilité quand l'IA est confiante (probabilité estimée > 50 %).
  function renderInsight(entries) {
    if (!insightEl) return;
    const conf = entries.filter((e) => e.predicted.probs[e.predicted.favored] > 50);
    if (!conf.length) { insightEl.innerHTML = ""; return; }
    const ok = conf.filter(isCorrect).length;
    const pct = Math.round((ok / conf.length) * 100);
    const parfait = ok === conf.length;
    const titre = parfait ? t("his_insight_title_perfect") : t("his_insight_title_good");
    const phrase = parfait
      ? t("his_insight_perfect", { n: conf.length })
      : t("his_insight_good", { n: conf.length, k: ok });
    insightEl.innerHTML = `
      <div class="insight-card">
        <div class="insight-fig"><span class="insight-pct">${pct}%</span><span class="insight-cap">${t("his_insight_cap")}</span></div>
        <div class="insight-body">
          <h3>🎯 ${titre}</h3>
          <p>${phrase}</p>
        </div>
      </div>`;
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
          <span class="verdict ${ok ? "ok" : "ko"}">${ok ? t("his_verdict_ok") : t("his_verdict_ko")}${
      exact ? ` · <span class="exact">${t("his_exact")}</span>` : ""
    }</span>
        </div>

        <div class="hist-teams">
          <span class="ht">${flagHTML(e.home, 16)} ${window.teamName(e.home)}</span>
          <span class="ht-score">${e.actual.home} – ${e.actual.away}${scoreExtra(e.actual)}</span>
          <span class="ht ht-right">${window.teamName(e.away)} ${flagHTML(e.away, 16)}</span>
        </div>

        <div class="hist-compare">
          <div class="cmp">
            <span class="cmp-label">${t("his_pred_label")}
              <span class="cmp-prob" title="${t("his_pred_prob_title")}">${predProb}%</span>
            </span>
            <span class="cmp-val">${predName} · ${e.predicted.score.home}–${e.predicted.score.away}</span>
          </div>
          <div class="cmp">
            <span class="cmp-label">${t("his_real_label")}</span>
            <span class="cmp-val">${
              res90(e.actual) === "draw" ? t("his_draw") : sideName(e, res90(e.actual))
            } · ${e.actual.home}–${e.actual.away}${scoreExtra(e.actual)}</span>
          </div>
        </div>
      </article>`;
  }

  // Portefeuille VIRTUEL : mise fictive de 20 € sur chaque match où l'IA donnait
  // le favori > 50 %. Purement éducatif · aucun pari réel, aucun argent.
  function renderPaper(entries) {
    const el = document.getElementById("paperFolio");
    if (!el) return;
    const STAKE = 20, OVERROUND = 1.06; // marge Unibet ~6 % ; Polymarket ≈ prix marché
    const bets = entries.filter((e) => e.predicted.probs[e.predicted.favored] > 50);
    if (!bets.length) { el.innerHTML = ""; return; }
    let staked = 0, w = 0, l = 0, netU = 0, netP = 0;
    bets.forEach((e) => {
      const fav = e.predicted.favored;
      const bet = e.sources && e.sources.betting;
      const fair = bet && bet[fav] ? bet[fav] / 100 : e.predicted.probs[fav] / 100; // proba « juste »
      const pU = Math.min(0.99, fair * OVERROUND); // prix Unibet (avec marge)
      const pP = fair;                              // prix Polymarket (≈ marché, sans marge)
      staked += STAKE;
      if (res90(e.actual) === fav) {
        netU += STAKE * (1 / pU - 1); netP += STAKE * (1 / pP - 1); w += 1;
      } else { netU -= STAKE; netP -= STAKE; l += 1; }
    });
    const money = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(0)} €`;
    const pct = (n) => `${n >= 0 ? "+" : ""}${(n / staked * 100).toFixed(0)} %`;
    const cls = (n) => (n >= 0 ? "pf-pos" : "pf-neg");
    const cell = (v, lab) => `<div class="pf-stat"><div class="pf-val">${v}</div><div class="pf-lab">${lab}</div></div>`;
    const plat = (name, note, net) => `
      <div class="pf-plat">
        <div class="pf-plat-name">${name} <span class="pf-plat-note">${note}</span></div>
        <div class="pf-plat-figs">
          <span class="pf-big ${cls(net)}">${money(net)}</span>
          <span class="pf-roi ${cls(net)}">${pct(net)}</span>
        </div>
      </div>`;
    el.innerHTML = `
      <div class="paper-card">
        <div class="paper-head">
          <h3>💶 ${t("pf_title")}</h3>
          <span class="paper-tag">${t("pf_virtual")}</span>
        </div>
        <p class="paper-sub">${t("pf_sub", { stake: STAKE })}</p>
        <div class="paper-grid pf-grid3">
          ${cell(bets.length, t("pf_bets"))}
          ${cell(`${w}/${l}`, t("pf_wl"))}
          ${cell(`${staked.toFixed(0)} €`, t("pf_staked"))}
        </div>
        <div class="pf-platforms">
          ${plat("Unibet", t("pf_book"), netU)}
          ${plat("Polymarket", t("pf_poly_note"), netP)}
        </div>
        <p class="paper-warn">⚠️ ${t("pf_warn")}</p>
      </div>`;
  }

  function renderAll(entries) {
    if (!entries.length) {
      emptyEl.hidden = false;
      statsEl.innerHTML = "";
      return;
    }
    renderStats(entries);
    renderInsight(entries);
    listEl.innerHTML = entries.map(row).join("");
    listEl.querySelectorAll(".hist-card").forEach((el, i) => {
      el.style.animationDelay = i * 40 + "ms";
    });
  }

  loadData()
    .then((data) => {
      const entries = (data.entries || []).slice();
      renderAll(entries);
      document.addEventListener("i18n:changed", () => renderAll(entries));
    })
    .catch(() => {
      listEl.innerHTML = `<p class="empty-state">${t("his_unavailable")}</p>`;
    });
})();
