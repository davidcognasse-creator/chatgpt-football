// Adaptateur "X" : transforme le volume de mentions par issue en probabilités.
import { countsToProbs } from "../lib/aggregate.mjs";

/**
 * @param {object} match entrée fixtures
 * @param {object} ctx   { mode, env, alpha }
 * @returns {{probs, sampleSize, sentiment}}
 */
export async function fetchSocial(match, ctx) {
  let mentions = match.social?.mentions || { home: 0, draw: 0, away: 0 };
  let sentiment = match.social?.sentiment || "";

  if (ctx.mode === "live") {
    // TODO live : interroger l'API X (recherche récente) avec ctx.env.X_BEARER_TOKEN,
    // classer chaque post par issue soutenue et compter le volume.
    // mentions = tallyMentions(posts);
  }

  const total = mentions.home + mentions.draw + mentions.away;
  return {
    probs: countsToProbs(mentions, ctx.alpha),
    sampleSize: total,
    sentiment,
  };
}
