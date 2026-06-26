#!/usr/bin/env node
// Robot d'actualisation des pronostics.
// Lit les sources (paris / presse / X), agrège une prédiction par match,
// puis écrit data.json (canonique) et data.js (miroir pour ouverture file://).
//
// Usage : node robot/update.mjs [--mode fixtures|live]

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { fetchBetting } from "./sources/betting.mjs";
import { fetchPress } from "./sources/press.mjs";
import { fetchSocial } from "./sources/social.mjs";
import { aggregate, buildAnalysis, favoredOutcome } from "./lib/aggregate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const here = (p) => resolve(__dirname, p);

async function readJSON(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const config = await readJSON(here("config.json"));
  const fixtures = await readJSON(here("fixtures.json"));
  const mode = arg("mode", config.mode || "fixtures");
  const ctx = { mode, env: process.env, alpha: config.prior?.alpha ?? 0.05 };

  console.log(`[robot] mode=${mode} — ${fixtures.matches.length} matchs`);

  const matches = [];
  for (const m of fixtures.matches) {
    const [betting, press, social] = await Promise.all([
      fetchBetting(m, ctx),
      fetchPress(m, ctx),
      fetchSocial(m, ctx),
    ]);

    const sources = [
      { key: "betting", weight: config.weights.betting, probs: betting.probs },
      { key: "press", weight: config.weights.press, probs: press.probs },
      { key: "social", weight: config.weights.social, probs: social.probs },
    ];

    const prediction = aggregate(sources, m.market?.xg || { home: 1, away: 1 });
    const analysis = buildAnalysis(m, prediction, sources);

    const pct = (p) => ({
      home: Math.round(p.home * 100),
      draw: Math.round(p.draw * 100),
      away: Math.round(p.away * 100),
    });

    matches.push({
      id: m.id,
      stage: m.stage,
      projected: !!m.projected,
      datetime: m.datetime,
      venue: m.venue,
      home: m.home,
      away: m.away,
      probs: roundTo100(pct(prediction.probs)),
      predictedScore: prediction.predictedScore,
      confidence: prediction.confidence,
      analysis,
      sources: {
        betting: {
          label: "Paris",
          weight: config.weights.betting,
          probs: pct(betting.probs),
          favored: favoredOutcome(betting.probs),
          detail: `${betting.sampleSize} bookmakers`,
        },
        press: {
          label: "Presse",
          weight: config.weights.press,
          probs: pct(press.probs),
          favored: favoredOutcome(press.probs),
          detail: `${press.sampleSize} médias`,
        },
        social: {
          label: "X",
          weight: config.weights.social,
          probs: pct(social.probs),
          favored: favoredOutcome(social.probs),
          detail: `${formatCount(social.sampleSize)} mentions`,
        },
      },
    });
  }

  const out = {
    tournament: fixtures.tournament,
    updatedAt: new Date().toISOString(),
    mode,
    weights: config.weights,
    matches,
  };

  const jsonPath = here(config.output.json);
  const jsPath = here(config.output.js);
  const json = JSON.stringify(out, null, 2);

  await writeFile(jsonPath, json + "\n", "utf8");
  await writeFile(
    jsPath,
    "// Généré automatiquement par robot/update.mjs — NE PAS éditer à la main.\n" +
      "// Miroir de data.json pour permettre l'ouverture du site en file://.\n" +
      `window.WC_DATA = ${json};\n`,
    "utf8"
  );

  console.log(`[robot] écrit ${rel(jsonPath)} et ${rel(jsPath)}`);
  console.log(`[robot] mis à jour : ${out.updatedAt}`);
}

// Corrige les arrondis pour que home+draw+away = 100.
function roundTo100(p) {
  const keys = ["home", "draw", "away"];
  const diff = 100 - keys.reduce((s, k) => s + p[k], 0);
  if (diff !== 0) {
    const k = keys.reduce((a, b) => (p[a] >= p[b] ? a : b));
    p[k] += diff;
  }
  return p;
}

function formatCount(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

function rel(p) {
  return p.replace(resolve(__dirname, ".."), ".");
}

main().catch((err) => {
  console.error("[robot] échec :", err);
  process.exit(1);
});
