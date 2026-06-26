// Adaptateur "public" (intérêt / buzz).
//  - fixtures : volume de mentions pré-rempli.
//  - live     : essaie l'API X (si X_BEARER_TOKEN fourni et autorisé), sinon
//               se replie sur les pages vues Wikipédia (gratuit, sans clé).
import { countsToProbs, twoSidedProbs } from "../lib/aggregate.mjs";
import { wikiTitle } from "../lib/teams.mjs";

const UA = "wc2026-predictions-robot/1.0 (contact: github actions)";
const yyyymmdd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");

/* ---------- X (Twitter) API v2 ---------- */
async function xMentions(token, term) {
  const query = encodeURIComponent(`"${term}" (football OR soccer OR worldcup) -is:retweet`);
  const url = `https://api.twitter.com/2/tweets/counts/recent?query=${query}&granularity=day`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`X API HTTP ${res.status}`);
  const data = await res.json();
  return data.meta?.total_tweet_count ?? 0;
}

async function viaX(token, match) {
  const [vh, va] = await Promise.all([
    xMentions(token, match.home.name),
    xMentions(token, match.away.name),
  ]);
  return {
    probs: twoSidedProbs(vh, va),
    sampleSize: vh + va,
    detail: `X · ${vh}/${va} mentions`,
    sentiment: `mentions X ${vh} / ${va}`,
  };
}

/* ---------- Wikipédia (repli) ---------- */
async function wikiViews(title, days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const url =
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/" +
    `all-access/all-agents/${encodeURIComponent(title.replace(/ /g, "_"))}/daily/` +
    `${yyyymmdd(start)}/${yyyymmdd(end)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
  const data = await res.json();
  return (data.items || []).reduce((s, it) => s + (it.views || 0), 0);
}

async function viaWikipedia(match, days) {
  const [vh, va] = await Promise.all([
    wikiViews(wikiTitle(match.home.name), days),
    wikiViews(wikiTitle(match.away.name), days),
  ]);
  return {
    probs: twoSidedProbs(vh, va),
    sampleSize: vh + va,
    detail: `Wikipédia · ${vh}/${va} vues`,
    sentiment: `pages vues ${vh} / ${va}`,
  };
}

export async function fetchSocial(match, ctx) {
  // Mode fixtures : volume de mentions pré-rempli.
  if (ctx.mode !== "live") {
    const mentions = match.social?.mentions || { home: 0, draw: 0, away: 0 };
    const total = mentions.home + mentions.draw + mentions.away;
    return {
      probs: countsToProbs(mentions, ctx.alpha),
      sampleSize: total,
      detail: `${total} mentions`,
      sentiment: match.social?.sentiment || "",
    };
  }

  // Mode live : X d'abord (si token), puis repli Wikipédia.
  const token = ctx.env.X_BEARER_TOKEN;
  if (token) {
    try {
      return await viaX(token, match);
    } catch (e) {
      console.warn(`[public] X indisponible (${e.message}) — repli Wikipédia`);
    }
  }
  try {
    const days = ctx.config?.live?.wikiLookbackDays || 3;
    return await viaWikipedia(match, days);
  } catch (e) {
    console.warn(`[public] indisponible pour ${match.home.name}-${match.away.name}: ${e.message}`);
    return { probs: null, sampleSize: 0, detail: "indisponible", sentiment: "" };
  }
}
