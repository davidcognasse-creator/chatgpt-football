#!/usr/bin/env node
// Robot d'actualisation des pronostics.
// Agrège 5 sources (paris / forme / face-à-face / presse / public) en une
// prédiction par match, puis écrit data.json (canonique) et data.js (miroir).
//
// Usage : node robot/update.mjs [--mode fixtures|live]

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { fetchBetting, fetchLiveEvents } from "./sources/betting.mjs";
import { fetchPress } from "./sources/press.mjs";
import { fetchSocial } from "./sources/social.mjs";
import { fetchForm } from "./sources/form.mjs";
import { fetchH2H } from "./sources/h2h.mjs";
import { fetchScorers } from "./sources/scorers.mjs";
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
  const ctx = { mode, env: process.env, alpha: config.prior?.alpha ?? 0.05, config };

  // Cache persistant API-Football (équipes + face-à-face), réutilisé si le
  // crédit de l'API est épuisé.
  const cachePath = here(config.state.apifootballCache);
  ctx.cache = (await readJSONSafe(cachePath)) || {};
  if (!ctx.cache.teams) ctx.cache.teams = {};
  if (!ctx.cache.h2h) ctx.cache.h2h = {};

  // Liste des matchs : The Odds API en live, fichier fixtures sinon.
  const inputMatches =
    mode === "live" ? await fetchLiveEvents(ctx, config) : fixtures.matches;

  console.log(`[robot] mode=${mode} — ${inputMatches.length} matchs`);

  const W = config.weights;
  const matches = [];
  for (const m of inputMatches) {
    const [betting, form, h2h, press, social, scorers] = await Promise.all([
      fetchBetting(m, ctx),
      fetchForm(m, ctx),
      fetchH2H(m, ctx),
      fetchPress(m, ctx),
      fetchSocial(m, ctx),
      fetchScorers(m, ctx),
    ]);

    if (!betting.probs) {
      console.warn(`[robot] match ignoré (pas de cotes) : ${m.home.name}-${m.away.name}`);
      continue;
    }

    const sources = [
      { key: "betting", weight: W.betting, probs: betting.probs },
      { key: "form", weight: W.form, probs: form.probs },
      { key: "h2h", weight: W.h2h, probs: h2h.probs },
      { key: "press", weight: W.press, probs: press.probs },
      { key: "social", weight: W.social, probs: social.probs },
    ];

    const prediction = aggregate(sources, m.market?.xg || null);
    const analysis = buildAnalysis(m, prediction, sources);

    const pct = (p) => ({
      home: Math.round(p.home * 100),
      draw: Math.round(p.draw * 100),
      away: Math.round(p.away * 100),
    });

    // Construit un bloc source seulement si la source est disponible.
    const srcBlock = (label, weight, r, detail) =>
      r.probs
        ? { label, weight, probs: pct(r.probs), favored: favoredOutcome(r.probs), detail }
        : { label, weight, probs: null, favored: null, detail: "indisponible" };

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
      scorers: scorers || null,
      sources: {
        betting: srcBlock("Paris", W.betting, betting, `${betting.sampleSize} bookmakers`),
        form: srcBlock("Forme", W.form, form, form.detail || "5 derniers matchs"),
        h2h: srcBlock("Face-à-face", W.h2h, h2h, h2h.detail || "historique"),
        press: srcBlock("Presse", W.press, press, `${press.sampleSize} articles`),
        social: srcBlock("Public", W.social, social, social.detail || `${formatCount(social.sampleSize)} signaux`),
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

  // Historique : uniquement en mode live (snapshot des pronostics + règlement).
  if (mode === "live") {
    await updateHistory(ctx, config, matches);
    await writeFile(cachePath, JSON.stringify(ctx.cache, null, 2) + "\n", "utf8");
    console.log(
      `[cache] ${Object.keys(ctx.cache.teams).length} équipes · ${Object.keys(ctx.cache.h2h).length} face-à-face mémorisés`
    );
  }
}

/**
 * Archive le pronostic de chaque match à venir puis, dès qu'un match est
 * terminé, le déplace dans history.json avec le résultat réel (bon / raté).
 */
async function updateHistory(ctx, config, matches) {
  const pendingPath = here(config.state.pending);
  const historyPath = here(config.output.history);

  const pending = (await readJSONSafe(pendingPath)) || {};
  const history = (await readJSONSafe(historyPath)) || { entries: [] };
  if (!Array.isArray(history.entries)) history.entries = [];

  // 1) Snapshot du dernier pronostic d'avant-match (+ probas par source pour
  //    pouvoir ré-optimiser les poids sur les vrais résultats — voir robot/tune.mjs).
  for (const m of matches) {
    const srcProbs = {};
    for (const [k, v] of Object.entries(m.sources || {})) srcProbs[k] = v.probs || null;
    pending[m.id] = {
      id: m.id,
      datetime: m.datetime,
      home: m.home,
      away: m.away,
      predicted: {
        probs: m.probs,
        score: m.predictedScore,
        favored: favoredOutcome({
          home: m.probs.home,
          draw: m.probs.draw,
          away: m.probs.away,
        }),
      },
      sources: srcProbs,
    };
  }

  // 2) Règlement à partir des résultats des matchs terminés.
  let settled = 0;
  try {
    const { fetchResults } = await import("./sources/results.mjs");
    const results = await fetchResults(ctx);
    const known = new Set(history.entries.map((e) => e.id));
    for (const r of results) {
      const p = pending[r.id];
      if (!p || known.has(r.id)) continue;
      history.entries.push({
        id: r.id,
        datetime: p.datetime,
        home: p.home,
        away: p.away,
        predicted: p.predicted,
        sources: p.sources || null,
        actual: { home: r.scoreHome, away: r.scoreAway, outcome: r.outcome },
        correctOutcome: p.predicted.favored === r.outcome,
        correctScore:
          p.predicted.score.home === r.scoreHome && p.predicted.score.away === r.scoreAway,
      });
      delete pending[r.id];
      settled++;
    }
  } catch (e) {
    console.warn(`[history] résultats indisponibles : ${e.message}`);
  }

  history.entries.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  history.updatedAt = new Date().toISOString();

  const hjson = JSON.stringify(history, null, 2);
  await writeFile(historyPath, hjson + "\n", "utf8");
  await writeFile(
    here(config.output.historyJs),
    "// Généré automatiquement par robot/update.mjs — NE PAS éditer à la main.\n" +
      `window.WC_HISTORY = ${hjson};\n`,
    "utf8"
  );
  await writeFile(pendingPath, JSON.stringify(pending, null, 2) + "\n", "utf8");
  console.log(`[history] ${settled} match(s) réglé(s) · ${history.entries.length} au total`);
}

async function readJSONSafe(p) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
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
