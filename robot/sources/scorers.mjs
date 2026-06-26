// Buteurs potentiels par équipe (probabilité de marquer "à tout moment").
//  - fixtures : liste curée fournie dans fixtures.json (match.scorers).
//  - live     : marché "buteur" de The Odds API, si activé (config.live.scorers)
//               et disponible sur votre palier. Sinon, section masquée.

const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/** Probabilité (%) "buteur à tout moment" à partir d'une cote décimale. */
const probFromOdds = (price) => Math.min(95, Math.round((1 / price) * 100));

async function liveScorers(match, ctx) {
  const key = ctx.env.ODDS_API_KEY;
  const live = ctx.config?.live || {};
  if (!key || !match.eventId) return null;

  const url =
    `https://api.the-odds-api.com/v4/sports/${live.sport || "soccer_fifa_world_cup"}/events/` +
    `${match.eventId}/odds?regions=${encodeURIComponent(live.regions || "eu,uk")}` +
    `&markets=player_goal_scorer_anytime&oddsFormat=decimal&apiKey=${key}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Odds API (scorers) HTTP ${res.status}`);
  const ev = await res.json();

  // Agrège la meilleure cote par joueur sur l'ensemble des bookmakers.
  const best = new Map();
  for (const b of ev.bookmakers || []) {
    for (const mk of b.markets || []) {
      if (mk.key !== "player_goal_scorer_anytime") continue;
      for (const o of mk.outcomes || []) {
        const name = o.description || o.name;
        if (!name || !o.price) continue;
        if (!best.has(name) || o.price < best.get(name)) best.set(name, o.price);
      }
    }
  }
  if (best.size === 0) return null;

  // Sans information d'effectif, on ne peut pas répartir par équipe : liste combinée.
  const combined = [...best.entries()]
    .map(([name, price]) => ({ name, prob: probFromOdds(price) }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, live.scorersTop || 6);
  return { combined };
}

export async function fetchScorers(match, ctx) {
  try {
    if (ctx.mode !== "live") {
      return match.scorers || null; // { home:[...], away:[...] }
    }
    if (!ctx.config?.live?.scorers) return null; // marché payant : désactivé par défaut
    return await liveScorers(match, ctx);
  } catch (e) {
    console.warn(`[scorers] indisponible pour ${match.home.name}-${match.away.name}: ${e.message}`);
    return null;
  }
}
