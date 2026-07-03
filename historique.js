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
          <span class="ht-score">${e.actual.home} – ${e.actual.away}</span>
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
              e.actual.outcome === "draw" ? t("his_draw") : sideName(e, e.actual.outcome)
            } · ${e.actual.home}–${e.actual.away}</span>
          </div>
        </div>
      </article>`;
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
