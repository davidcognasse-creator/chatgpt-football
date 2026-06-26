#!/usr/bin/env node
// Optimiseur de "clé de répartition" : cherche les poids des sources qui
// maximisent la précision (1N2) sur les matchs déjà joués de history.json.
//
//   node robot/tune.mjs            # affiche les meilleurs poids trouvés
//   node robot/tune.mjs --apply    # écrit ces poids dans robot/config.json
//
// Ne fonctionne que sur les entrées d'historique qui contiennent les probas
// PAR SOURCE (générées par le robot en mode live). Au fil des matchs réels
// joués, l'échantillon grandit et le réglage devient plus fiable.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const here = (p) => resolve(__dirname, p);
const KEYS = ["betting", "form", "h2h", "press", "social"];

const argmax = (p) =>
  p.home >= p.draw && p.home >= p.away ? "home" : p.away >= p.draw ? "away" : "draw";

function accuracy(entries, weights) {
  let correct = 0;
  let total = 0;
  for (const e of entries) {
    const acc = { home: 0, draw: 0, away: 0 };
    let wsum = 0;
    for (const k of KEYS) {
      const p = e.sources[k];
      if (!p) continue;
      const w = weights[k] || 0;
      acc.home += w * p.home;
      acc.draw += w * p.draw;
      acc.away += w * p.away;
      wsum += w;
    }
    if (wsum === 0) continue;
    total++;
    if (argmax(acc) === e.actual.outcome) correct++;
  }
  return { acc: total ? correct / total : 0, total };
}

/** Vecteur de poids aléatoire sur le simplexe (somme = 1). */
function randomWeights() {
  const raw = KEYS.map(() => -Math.log(1 - Math.random()));
  const sum = raw.reduce((a, b) => a + b, 0);
  return Object.fromEntries(KEYS.map((k, i) => [k, raw[i] / sum]));
}

async function main() {
  const config = JSON.parse(await readFile(here("config.json"), "utf8"));
  const history = JSON.parse(await readFile(here(config.output.history), "utf8"));
  const usable = (history.entries || []).filter(
    (e) => e.sources && e.actual && KEYS.some((k) => e.sources[k])
  );

  console.log(`[tune] ${usable.length} match(s) exploitables (avec probas par source)`);
  if (usable.length < 8) {
    console.log(
      "[tune] échantillon trop faible pour optimiser — relancez quand plus de matchs live seront joués."
    );
    return;
  }

  const current = accuracy(usable, config.weights);
  console.log(`[tune] précision poids actuels : ${(current.acc * 100).toFixed(1)}%`);

  const samples = Number(process.env.TUNE_SAMPLES || 50000);
  let best = { acc: -1, w: null };
  for (let i = 0; i < samples; i++) {
    const w = randomWeights();
    const r = accuracy(usable, w);
    if (r.acc > best.acc) best = { acc: r.acc, w };
  }

  const round = (x) => Math.round(x * 100) / 100;
  const tuned = Object.fromEntries(KEYS.map((k) => [k, round(best.w[k])]));
  console.log(`[tune] meilleure précision trouvée : ${(best.acc * 100).toFixed(1)}%`);
  console.log("[tune] poids suggérés :", JSON.stringify(tuned));

  if (process.argv.includes("--apply")) {
    config.weights = tuned;
    await writeFile(here("config.json"), JSON.stringify(config, null, 2) + "\n", "utf8");
    console.log("[tune] poids écrits dans robot/config.json ✅");
  } else {
    console.log("[tune] (relancez avec --apply pour écrire ces poids)");
  }
}

main().catch((e) => {
  console.error("[tune] échec :", e.message);
  process.exit(1);
});
