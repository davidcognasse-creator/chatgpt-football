// Adaptateur "presse" : transforme les penchants éditoriaux en probabilités.
import { countsToProbs } from "../lib/aggregate.mjs";

/**
 * @param {object} match entrée fixtures
 * @param {object} ctx   { mode, env, alpha }
 * @returns {{probs, sampleSize, sentiment}}
 */
export async function fetchPress(match, ctx) {
  let leans = match.press?.leans || { home: 0, draw: 0, away: 0 };
  let outlets = match.press?.outlets || 0;
  let sentiment = match.press?.sentiment || "";

  if (ctx.mode === "live") {
    // TODO live : agréger des articles (NewsAPI, GDELT, flux RSS) puis classer
    // le penchant de chacun (home/draw/away) via un modèle de sentiment.
    // leans = tallyArticleLeans(articles); outlets = articles.length;
  }

  return {
    probs: countsToProbs(leans, ctx.alpha),
    sampleSize: outlets,
    sentiment,
  };
}
