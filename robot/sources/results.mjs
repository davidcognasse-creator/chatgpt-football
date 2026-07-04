import { fetchT } from "../lib/http.mjs";
// Récupère les scores des matchs terminés (endpoint "scores" de The Odds API),
// pour confronter les pronostics archivés aux résultats réels (page Historique).
const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/**
 * @returns {Array<{id, home, away, datetime, scoreHome, scoreAway, outcome}>}
 */
export async function fetchResults(ctx) {
  const key = ctx.env.ODDS_API_KEY;
  const live = ctx.config?.live || {};
  if (!key) return [];

  const url =
    `https://api.the-odds-api.com/v4/sports/${live.sport || "soccer_fifa_world_cup"}/scores/` +
    `?daysFrom=${live.scoresDaysFrom || 3}&apiKey=${key}`;
  const res = await fetchT(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Odds API (scores) HTTP ${res.status}`);
  const events = await res.json();

  const out = [];
  for (const e of events) {
    if (!e.completed || !Array.isArray(e.scores)) continue;
    const sh = Number(e.scores.find((s) => s.name === e.home_team)?.score);
    const sa = Number(e.scores.find((s) => s.name === e.away_team)?.score);
    if (Number.isNaN(sh) || Number.isNaN(sa)) continue;
    // Prolongation / tirs au but si la source les expose (champ period/status
    // « ET »/« PEN », ou scores de shootout). The Odds API ne les fournit pas
    // aujourd'hui → null ; plomberie prête pour une source plus riche.
    const per = String(e.period || e.status || "").toUpperCase();
    const ps = e.penalties || e.shootout || null;
    const pens = ps && ps.home != null && ps.away != null
      ? { home: Number(ps.home), away: Number(ps.away) }
      : null;
    const decidedBy = pens || /PEN|SHOOT/.test(per) ? "pens" : /ET|EXTRA|AET/.test(per) ? "aet" : null;
    out.push({
      id: e.id,
      home: e.home_team,
      away: e.away_team,
      datetime: e.commence_time,
      scoreHome: sh,
      scoreAway: sa,
      outcome: sh > sa ? "home" : sh < sa ? "away" : "draw",
      decidedBy,
      pens,
    });
  }
  return out;
}
