// Adaptateur "paris" : cotes des bookmakers -> probabilités.
// En mode live, fournit AUSSI la liste des matchs réels à venir (The Odds API).
import { marketConsensus } from "../lib/odds.mjs";
import { team } from "../lib/teams.mjs";

const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/**
 * Récupère les matchs à venir et leurs cotes depuis The Odds API.
 * Nécessite ctx.env.ODDS_API_KEY. Renvoie des objets au format "fixture".
 */
export async function fetchLiveEvents(ctx, config) {
  const key = ctx.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY manquant (mode live)");

  const live = config.live || {};
  const sport = live.sport || "soccer_fifa_world_cup";
  const regions = live.regions || "eu,uk";
  const url =
    `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
    `?regions=${encodeURIComponent(regions)}&markets=h2h&oddsFormat=decimal&apiKey=${key}`;

  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Odds API HTTP ${res.status}: ${await res.text()}`);
  const events = await res.json();

  return events
    .map((ev) => {
      const books = (ev.bookmakers || [])
        .map((b) => {
          const h2h = (b.markets || []).find((m) => m.key === "h2h");
          if (!h2h) return null;
          const get = (name) => h2h.outcomes.find((o) => o.name === name)?.price;
          const home = get(ev.home_team);
          const away = get(ev.away_team);
          const draw = get("Draw");
          if (!home || !draw || !away) return null;
          return { name: b.title || b.key, odds: { home, draw, away } };
        })
        .filter(Boolean);

      if (books.length === 0) return null;
      return {
        id: ev.id || `${ev.home_team}-${ev.away_team}-${ev.commence_time}`,
        eventId: ev.id,
        stage: live.stageLabel || "À venir",
        projected: false,
        datetime: ev.commence_time,
        venue: "",
        home: team(ev.home_team),
        away: team(ev.away_team),
        market: { books },
      };
    })
    .filter(Boolean);
}

/**
 * Probabilités consensus du marché à partir des cotes du match (les deux modes).
 */
export async function fetchBetting(match, _ctx) {
  const books = match.market?.books || [];
  return {
    probs: marketConsensus(books),
    books: books.map((b) => b.name),
    sampleSize: books.length,
  };
}
