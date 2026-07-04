import { fetchT } from "../lib/http.mjs";
import { throttle } from "../lib/throttle.mjs";
// Récupère les scores des matchs terminés via API-Football (/fixtures?date=…),
// pour régler les pronostics archivés (page Historique). Remplace The Odds API
// (/scores) dont le quota était limitant. Bonus : API-Football donne le détail
// prolongation (AET) et tirs au but (PEN).
const BASE = "https://v3.football.api-sports.io";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const STOP = new Set(["fc", "cf", "sc", "afc", "the", "club", "de", "national", "team"]);

function norm(x) {
  const s = (x && typeof x === "object" ? x.name : x) || "";
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t));
}

function sideMatch(aTokens, bName) {
  const a = new Set(aTokens);
  const b = new Set(norm(bName));
  const shared = [...a].filter((t) => b.has(t));
  if (!shared.length) return false;
  const maxLen = Math.max(...shared.map((t) => t.length));
  const minLen = aTokens.every((t) => t.length <= 3) ? 3 : 4;
  return maxLen >= minLen;
}

async function fixturesOn(ctx, date) {
  const key = ctx.env.APIFOOTBALL_KEY;
  const url = `${BASE}/fixtures?date=${date}&timezone=UTC`;
  return throttle("apifootball-scores", 1200, async () => {
    const res = await fetchT(url, { headers: { "x-apisports-key": key } });
    if (!res.ok) throw new Error(`API-Football (scores) HTTP ${res.status}`);
    const j = await res.json();
    const e = j.errors;
    if (Array.isArray(e) ? e.length : e && Object.keys(e).length)
      throw new Error(`API-Football errors: ${JSON.stringify(e)}`);
    return (j.response || []).filter((f) => FINISHED.has(f.fixture?.status?.short));
  });
}

/**
 * @param {object} ctx
 * @param {object} pending  map id -> pronostic en attente {id, home, away, datetime}
 * @returns {Array<{id, home, away, datetime, scoreHome, scoreAway, outcome, decidedBy, pens}>}
 */
export async function fetchResults(ctx, pending) {
  if (!ctx.env.APIFOOTBALL_KEY) return [];
  const items = Object.values(pending || {});
  if (!items.length) return [];

  // Dates distinctes des matchs en attente (UTC).
  const dates = [...new Set(items.map((p) => (p.datetime || "").slice(0, 10)).filter(Boolean))];
  const byDate = new Map();
  for (const d of dates.slice(0, 10)) {
    try { byDate.set(d, await fixturesOn(ctx, d)); }
    catch (err) { console.warn(`[results] ${d} : ${err.message}`); }
  }

  const out = [];
  for (const p of items) {
    const d = (p.datetime || "").slice(0, 10);
    const fixtures = byDate.get(d);
    if (!fixtures) continue;
    const ht = norm(p.home), at = norm(p.away);
    if (!ht.length || !at.length) continue;
    for (const f of fixtures) {
      const h = f.teams.home, a = f.teams.away;
      const direct = sideMatch(ht, h.name) && sideMatch(at, a.name);
      const flip = sideMatch(ht, a.name) && sideMatch(at, h.name);
      if (!direct && !flip) continue;
      let gh = f.goals.home, ga = f.goals.away;
      if (gh == null || ga == null) continue;
      if (flip) { const t = gh; gh = ga; ga = t; }
      const short = f.fixture.status.short;
      const pen = f.score?.penalty || {};
      let ph = pen.home, pa = pen.away;
      if (flip && ph != null) { const t = ph; ph = pa; pa = t; }
      const pens = short === "PEN" && ph != null && pa != null ? { home: ph, away: pa } : null;
      const decidedBy = pens ? "pens" : short === "AET" ? "aet" : null;
      // Vainqueur : aux t.a.b. si applicable, sinon au score.
      const outcome = pens
        ? (pens.home > pens.away ? "home" : "away")
        : gh > ga ? "home" : gh < ga ? "away" : "draw";
      out.push({
        id: p.id, home: p.home, away: p.away, datetime: p.datetime,
        scoreHome: gh, scoreAway: ga, outcome, decidedBy, pens,
      });
      break;
    }
  }
  return out;
}
