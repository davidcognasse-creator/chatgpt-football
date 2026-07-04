/* Page Loto Foot : lit lotofoot.json (généré par grille-optim.py) et affiche
   l'analyse marché vs public, les value bets, et la grille optimale à 12/24/48 €. */
(function () {
  "use strict";

  const pct = (x) => Math.round((x || 0) * 100);
  const SIGN = { "1": "1", "N": "N", "2": "2" };

  function probCell(p) {
    return `<span class="prob">
      <span class="p1">${pct(p["1"])}</span>
      <span class="pN">${pct(p["N"])}</span>
      <span class="p2">${pct(p["2"])}</span></span>`;
  }

  function render(data) {
    // Bandeau méta
    const meta = document.getElementById("lotoMeta");
    meta.innerHTML =
      `<span class="loto-tag">🏆 <b>${data.nom || "Loto Foot"}</b></span>` +
      `<span class="loto-tag">📈 Source : <b>${data.source || "cotes"}</b></span>` +
      `<span class="loto-tag">⚽ <b>${data.matchs.length}</b> matchs</span>`;

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
        `<div class="grid-stat"><div class="v">${(s.pge13 * 100).toFixed(1)}%</div><div class="l">P(≥ 13 bons)</div></div>` +
        `<div class="grid-stat"><div class="v">${s.esperance.toFixed(1)}</div><div class="l">espérance /15</div></div>`;

      const byI = {};
      g.picks.forEach((p) => (byI[p.i] = p));
      let rows =
        "<tr><th>#</th><th>Match</th><th>Type</th><th>Pronostic(s)</th><th>Couverture</th></tr>";
      for (const m of data.matchs) {
        const p = byI[m.i] || { type: "simple", picks: [m.coted ? m.marketPick : m.crowdPick], coverage: 0 };
        const label = { simple: "simple", double: "DOUBLE", triple: "TRIPLE" }[p.type];
        rows +=
          `<tr><td>${m.i}</td><td class="match">${m.dom} - ${m.ext}</td>` +
          `<td class="type-${p.type}">${label}</td>` +
          `<td class="picks-cell"><b>${p.picks.map((x) => SIGN[x]).join(" / ")}</b></td>` +
          `<td>${pct(p.coverage)}%</td></tr>`;
      }
      document.getElementById("gridTable").innerHTML = rows;
    }

    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) showGrid(Number(b.dataset.idx));
    });
    showGrid(grids.length - 1); // 48 € par défaut

    const pdf = document.getElementById("exportPdf");
    if (pdf) pdf.addEventListener("click", () => window.print());
  }

  fetch("lotofoot.json?v=" + Date.now())
    .then((r) => {
      if (!r.ok) throw new Error("lotofoot.json introuvable");
      return r.json();
    })
    .then(render)
    .catch((err) => {
      document.getElementById("lotoMeta").innerHTML =
        `<span class="loto-tag">⚠️ Grille indisponible pour le moment.</span>`;
      console.error(err);
    });
})();
