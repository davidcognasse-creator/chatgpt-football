/* Page Loto Foot : lit lotofoot.json (généré par grille-optim.py) et affiche
   l'analyse marché vs public, les value bets, et la grille optimale à 12/24/48 €. */
(function () {
  "use strict";

  const pct = (x) => Math.round((x || 0) * 100);
  const SIGN = { "1": "1", "N": "N", "2": "2" };
  const GRID_SUB_DEFAULT =
    "Choisis ton budget. On place les doubles/triples sur les matchs les plus " +
    "incertains pour maximiser la probabilité de toucher un rang (≥ 13 bons).";

  function probCell(p) {
    return `<span class="prob">
      <span class="p1">${pct(p["1"])}</span>
      <span class="pN">${pct(p["N"])}</span>
      <span class="p2">${pct(p["2"])}</span></span>`;
  }

  // Signe(s) couvert(s) par une grille pour un match donné (repli sur le prono).
  function gridPicksFor(data, g, m) {
    const byI = {};
    g.picks.forEach((p) => (byI[p.i] = p));
    const p = byI[m.i];
    return p ? p.picks : [m.coted ? m.marketPick : m.crowdPick];
  }

  // Résultat réel d'une grille : nb de bons + gain FDJ (si les résultats sont figés).
  function realResult(data, g) {
    const b = data.bilan;
    if (!b || !b.reels || !b.reels.length) return null;
    const reelByI = {};
    b.reels.forEach((r) => (reelByI[r.i] = r));
    const rap = b.rapports || {};
    let correct = 0;
    for (const m of data.matchs) {
      const r = reelByI[m.i];
      if (!r) continue;
      if (gridPicksFor(data, g, m).includes(r.reel)) correct++;
    }
    const n = b.reels.length;
    const gain = Number(rap[String(correct)] || 0);
    return { correct, n, gain, net: gain - g.cost };
  }

  function render(data) {
    // Bandeau méta
    const meta = document.getElementById("lotoMeta");
    meta.innerHTML =
      `<span class="loto-tag">🏆 <b>${data.nom || "Loto Foot"}</b></span>` +
      `<span class="loto-tag">📈 Source : <b>${data.source || "cotes"}</b></span>` +
      `<span class="loto-tag">⚽ <b>${data.matchs.length}</b> matchs</span>`;

    // Sous-titre réinitialisé à chaque grille (évite de garder le texte d'une
    // grille réglée quand on revient sur une grille en cours).
    const finished = !!(data.bilan && data.bilan.reels && data.bilan.reels.length);
    const gridSub = document.getElementById("gridSub");
    if (gridSub) {
      gridSub.innerHTML = finished
        ? (data.bilan.note ? data.bilan.note + " — " : "") +
          "sélectionne un budget pour voir le <b>gain réel</b> qu'aurait rapporté chaque grille."
        : GRID_SUB_DEFAULT;
    }

    // Tableau marché vs public
    const mt = document.getElementById("matchTable");
    let rows =
      "<tr><th>#</th><th>Match</th><th>Marché 1·N·2</th><th>Public 1·N·2</th>" +
      "<th>Prono</th><th>Value</th></tr>";
    for (const m of data.matchs) {
      const market = m.coted
        ? `<span class="pick">${SIGN[m.marketPick]}</span>`
        : `<span class="pick na">public</span>`;
      const marketProb = m.coted ? probCell(m.p) : '<span class="prob">non coté</span>';
      const value = m.divergence
        ? `<span class="value">marché ${SIGN[m.marketPick]} ≠ public ${SIGN[m.crowdPick]}</span>`
        : "";
      rows +=
        `<tr><td>${m.i}</td><td class="match">${m.dom} - ${m.ext}</td>` +
        `<td>${marketProb}</td><td>${probCell(m.foule)}</td>` +
        `<td>${market}</td><td>${value}</td></tr>`;
    }
    mt.innerHTML = rows;

    // Value bets
    if (data.divergences && data.divergences.length) {
      document.getElementById("valueCard").hidden = false;
      document.getElementById("valueList").innerHTML = data.divergences
        .map(
          (d) =>
            `<p style="margin:6px 0;line-height:1.5">` +
            `<strong>Match ${d.i} · ${d.dom} - ${d.ext}</strong> : le marché voit ` +
            `<span class="pick">${SIGN[d.marketPick]}</span> (${pct(d.p[d.marketPick])}%) ` +
            `alors que le public joue <b>${SIGN[d.crowdPick]}</b> (${pct(d.foule[d.crowdPick])}%). ` +
            `<span style="color:var(--muted)">Value si le marché a raison.</span></p>`
        )
        .join("");
    }

    // Grilles par budget
    const tabs = document.getElementById("budgetTabs");
    const grids = data.grids || [];
    let currentG = null;
    tabs.innerHTML = grids
      .map(
        (g, i) =>
          `<button data-idx="${i}" class="${i === grids.length - 1 ? "active" : ""}">${g.budget} €</button>`
      )
      .join("");

    function showGrid(idx) {
      const g = grids[idx];
      if (!g) return;
      [...tabs.children].forEach((b, i) => b.classList.toggle("active", i === idx));

      const s = g.stats;
      document.getElementById("gridStats").innerHTML =
        `<div class="grid-stat"><div class="v">${g.combos}</div><div class="l">combinaisons</div></div>` +
        `<div class="grid-stat"><div class="v">${g.cost} €</div><div class="l">coût</div></div>` +
        `<div class="grid-stat"><div class="v">${g.repartition.simples}·${g.repartition.doubles}·${g.repartition.triples}</div><div class="l">simples·doubles·triples</div></div>` +
        `<div class="grid-stat"><div class="v">${(s.pge13 * 100).toFixed(1)}%</div><div class="l">P(≥ ${data.matchs.length - 2} bons)</div></div>` +
        `<div class="grid-stat"><div class="v">${s.esperance.toFixed(1)}</div><div class="l">espérance /15</div></div>`;

      // Bandeau résultat réel (si la grille est réglée) — dynamique par budget.
      const rr = realResult(data, g);
      const res = document.getElementById("gridResult");
      const reelByI = {};
      if (rr) (data.bilan.reels || []).forEach((r) => (reelByI[r.i] = r));
      if (res) {
        if (rr) {
          const win = rr.gain > 0;
          const netCls = rr.net >= 0 ? "pos" : "neg";
          res.hidden = false;
          res.className = "grid-result" + (win ? " win" : "");
          res.innerHTML =
            `<span class="rlabel">🏁 Résultat réel de la grille ${g.budget} €</span>` +
            `<span class="rscore">${rr.correct}/${rr.n} bons</span>` +
            `<span class="rgain${win ? "" : " zero"}">${win ? "gain " + rr.gain.toFixed(2) + " €" : "hors rang · 0 €"}</span>` +
            `<span class="rnet ${netCls}">net ${rr.net >= 0 ? "+" : ""}${rr.net.toFixed(2)} €</span>`;
        } else {
          res.hidden = true;
        }
      }

      const byI = {};
      g.picks.forEach((p) => (byI[p.i] = p));
      let rows =
        "<tr><th>#</th><th>Match</th><th>Type</th><th>Pronostic(s)</th><th>Couverture</th>" +
        (rr ? "<th>Réel</th>" : "") +
        "</tr>";
      for (const m of data.matchs) {
        const p = byI[m.i] || { type: "simple", picks: [m.coted ? m.marketPick : m.crowdPick], coverage: 0 };
        const label = { simple: "simple", double: "DOUBLE", triple: "TRIPLE" }[p.type];
        let realCell = "";
        if (rr) {
          const r = reelByI[m.i];
          if (r) {
            const hit = p.picks.includes(r.reel);
            realCell = `<td class="${hit ? "hit" : "miss"}"><b>${SIGN[r.reel]}</b>${r.score ? ' <span class="rsc">(' + r.score + ")</span>" : ""} ${hit ? "✅" : "❌"}</td>`;
          } else {
            realCell = "<td>·</td>";
          }
        }
        rows +=
          `<tr><td>${m.i}</td><td class="match">${m.dom} - ${m.ext}</td>` +
          `<td class="type-${p.type}">${label}</td>` +
          `<td class="picks-cell"><b>${p.picks.map((x) => SIGN[x]).join(" / ")}</b></td>` +
          `<td>${pct(p.coverage)}%</td>` +
          realCell +
          `</tr>`;
      }
      document.getElementById("gridTable").innerHTML = rows;
      currentG = g;
      const pdf = document.getElementById("exportPdf");
      if (pdf) pdf.textContent = `📄 Exporter la grille à ${g.budget} € en PDF`;
    }

    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) showGrid(Number(b.dataset.idx));
    });
    showGrid(grids.length - 1); // 48 € par défaut

    const pdf = document.getElementById("exportPdf");
    if (pdf) pdf.addEventListener("click", () => exportPdf(data, currentG));
  }

  // Génère un PDF propre et autonome de la grille choisie (via iframe d'impression).
  function exportPdf(data, g) {
    if (!g) return;
    const TYPE = { simple: "Simple", double: "Double", triple: "Triple" };
    const byI = {};
    g.picks.forEach((p) => (byI[p.i] = p));
    const rows = data.matchs.map((m) => {
      const p = byI[m.i] || { type: "simple", picks: [m.coted ? m.marketPick : m.crowdPick], coverage: 0 };
      const star = p.type === "triple" ? "triple" : p.type === "double" ? "double" : "";
      return `<tr>
        <td class="n">${m.i}</td>
        <td class="mt">${m.dom} <span class="vs">–</span> ${m.ext}</td>
        <td class="ty ${star}">${TYPE[p.type]}</td>
        <td class="pk">${p.picks.map((x) => SIGN[x]).join(" / ")}</td>
        <td class="cv">${pct(p.coverage)}%</td></tr>`;
    }).join("");
    const s = g.stats;
    const rep = `${g.repartition.simples} simples · ${g.repartition.doubles} doubles · ${g.repartition.triples} triple(s)`;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Grille ${g.budget}€ — ${data.nom || "Loto Foot"}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #14203a; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  .sub { color: #5a678a; font-size: 11.5px; margin: 0 0 12px; }
  .sub b { color: #14203a; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; page-break-inside: avoid; }
  th, td { padding: 5px 8px; border-bottom: 1px solid #e2e7f1; text-align: center; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #5a678a; border-bottom: 2px solid #cfd7e6; }
  td.mt { text-align: left; font-weight: 600; }
  td.n { color: #97a1bd; }
  .vs { color: #b3bcd2; }
  td.pk { font-weight: 800; letter-spacing: .08em; }
  td.ty.double { color: #c2680f; font-weight: 700; }
  td.ty.triple { color: #b3247e; font-weight: 800; }
  .stats { margin: 14px 0 4px; font-size: 12px; color: #14203a; }
  .stats span { display: inline-block; margin-right: 16px; }
  .stats b { font-size: 14px; }
  .foot { margin-top: 14px; font-size: 10px; color: #8a93ab; border-top: 1px solid #e2e7f1; padding-top: 8px; }
</style></head><body>
  <h1>🎯 ${data.nom || "Loto Foot"} — Grille ${g.budget} €</h1>
  <p class="sub"><b>${g.combos}</b> combinaisons · coût <b>${g.cost} €</b> · ${rep} · source : ${data.source || "cotes"}</p>
  <table>
    <thead><tr><th>#</th><th>Match</th><th>Type</th><th>Pronostic(s)</th><th>Couv.</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="stats">
    <span>Grille parfaite (${data.matchs.length}/${data.matchs.length}) : <b>${(s.p15 * 100).toFixed(2)} %</b></span>
    <span>Rang gagnant (≥ ${data.matchs.length - 2}) : <b>${(s.pge13 * 100).toFixed(1)} %</b></span>
    <span>Espérance : <b>${s.esperance.toFixed(1)} / ${data.matchs.length}</b></span>
  </p>
  <p class="foot">Cotes des bookmakers (API-Football) confrontées au public FDJ · pronostic éducatif, ne constitue pas un conseil de pari. Jouer comporte des risques.</p>
</body></html>`;

    const ifr = document.createElement("iframe");
    ifr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    ifr.setAttribute("aria-hidden", "true");
    ifr.onload = () => {
      try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) { console.error(e); }
      setTimeout(() => ifr.remove(), 60000);
    };
    ifr.srcdoc = html;
    document.body.appendChild(ifr);
  }

  const bust = () => "?v=" + Date.now();

  function loadGrid(file) {
    fetch(file + bust())
      .then((r) => { if (!r.ok) throw new Error(file + " introuvable"); return r.json(); })
      .then(render)
      .catch((err) => {
        document.getElementById("lotoMeta").innerHTML =
          `<span class="loto-tag">⚠️ Grille indisponible pour le moment.</span>`;
        console.error(err);
      });
  }

  // Sélecteur de grilles (actuelle + précédentes) depuis lotofoot-archive.json.
  fetch("lotofoot-archive.json" + bust())
    .then((r) => (r.ok ? r.json() : null))
    .then((arch) => {
      const sel = document.getElementById("gridPicker");
      const list = arch && arch.grilles && arch.grilles.length ? arch.grilles : null;
      if (sel && list) {
        sel.innerHTML = list.map((g, i) => `<option value="${g.file}">${g.nom}</option>`).join("");
        sel.parentElement.hidden = false;
        sel.addEventListener("change", () => loadGrid(sel.value));
        loadGrid(list[0].file);
      } else {
        loadGrid("lotofoot.json"); // repli
      }
    })
    .catch(() => loadGrid("lotofoot.json"));
})();
