// Adaptateur "paris" : cotes des bookmakers -> probabilités.
// En mode live, fournit AUSSI la liste des matchs à venir (API-Football).
// Migré de The Odds API vers API-Football (quota Odds API épuisé).
import { fetchT } from "../lib/http.mjs";
import { marketConsensus } from "../lib/odds.mjs";
import { throttle } from "../lib/throttle.mjs";
import { team } from "../lib/teams.mjs";

const AF = "https://v3.football.api-sports.io";

async function afGet(ctx, path) {
  const key = ctx.env.APIFOOTBALL_KEY;
  const gap = ctx.config?.live?.apiFootball?.minGapMs ?? 1200;
  return throttle("apifootball", gap, async () => {
    const res = await fetchT(AF + path, { headers: { "x-apisports-key": key } });
    if (!res.ok) throw new Error(`API-Football HTTP ${res.status} sur ${path}`);
    const j = await res.json();
    const e = j.errors;
    if (Array.isArray(e) ? e.length : e && Object.keys(e).length)
      throw new Error(`API-Football errors: ${JSON.stringify(e)}`);
    return j.response || [];
  });
}

/** Cotes "Match Winner" multi-books d'un fixture -> [{name, odds:{home,draw,away}}]. */
async function fixtureBooks(ctx, fixtureId) {
  let resp;
  try { resp = await afGet(ctx, `/odds?fixture=${fixtureId}`); }
  catch { return []; }
  const books = [];
  for (const bk of resp[0]?.bookmakers || []) {
    const bet = (bk.bets || []).find((b) => b.id === 1 || b.name === "Match Winner");
    if (!bet) continue;
    const px = {};
    for (const v of bet.values || []) px[String(v.value).toLowerCase()] = Number(v.odd);
    if (px.home && px.draw && px.away)
      books.push({ name: bk.name || String(bk.id), odds: { home: px.home, draw: px.draw, away: px.away } });
  }
  return books;
}

/**
 * Matchs à venir + cotes depuis API-Football. Nécessite ctx.env.APIFOOTBALL_KEY.
 * config.live.apiFootballLeagues = ligues (déf. [1]=Coupe du Monde),
 * config.live.season = saison (déf. année en cours), maxMatches = plafond.
 */
export async function fetchLiveEvents(ctx, config) {
  if (!ctx.env.APIFOOTBALL_KEY) throw new Error("APIFOOTBALL_KEY manquant (mode live)");
  const live = config.live || {};
  const leagues = live.apiFootballLeagues || [1]; // 1 = World Cup
  const season = live.season || new Date().getUTCFullYear();
  const maxMatches = live.maxMatches || 15;

  // 1) Fixtures à venir (non commencés) sur les ligues configurées.
  const fixtures = [];
  for (const lg of leagues) {
    try {
      const arr = await afGet(ctx, `/fixtures?league=${lg}&season=${season}&next=${maxMatches}`);
      for (const f of arr) if (f.fixture?.status?.short === "NS") fixtures.push(f);
    } catch (e) {
      console.warn(`[betting] ligue ${lg} indisponible : ${e.message}`);
    }
  }
  fixtures.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
  const chosen = fixtures.slice(0, maxMatches);
  console.log(`[betting] ${chosen.length} match(s) à venir (API-Football, ligues ${leagues.join(",")})`);

  // 2) Cotes par fixture -> format "fixture" attendu par le pipeline.
  const out = [];
  for (const f of chosen) {
    const books = await fixtureBooks(ctx, f.fixture.id);
    if (!books.length) {
      console.log(`[betting] pas de cotes : ${f.teams.home.name}-${f.teams.away.name}`);
      continue;
    }
    out.push({
      id: String(f.fixture.id),
      eventId: f.fixture.id,
      stage: live.stageLabel || f.league?.round || "À venir",
      projected: false,
      datetime: f.fixture.date,
      venue: f.fixture.venue?.name || "",
      home: team(f.teams.home.name),
      away: team(f.teams.away.name),
      market: { books },
    });
  }
  return out;
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
