// Adaptateur "paris" : transforme les cotes des bookmakers en probabilités.
import { marketConsensus } from "../lib/odds.mjs";

/**
 * @param {object} match   entrée fixtures
 * @param {object} ctx     { mode, env } — 'fixtures' (démo) ou 'live'
 * @returns {{probs, books, sampleSize}}
 */
export async function fetchBetting(match, ctx) {
  let books = match.market?.books || [];

  if (ctx.mode === "live") {
    // TODO live : appeler une API de cotes (ex. The Odds API) avec ctx.env.ODDS_API_KEY
    // et remplir `books` au format [{ name, odds:{home,draw,away} }].
    // const res = await fetch(`https://api.the-odds-api.com/...&apiKey=${ctx.env.ODDS_API_KEY}`);
    // books = parseOddsApi(await res.json());
  }

  return {
    probs: marketConsensus(books),
    books: books.map((b) => b.name),
    sampleSize: books.length,
  };
}
