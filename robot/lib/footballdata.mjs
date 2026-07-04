// Client minimal football-data.org (résultats réels) — utilisé par les sources
// "forme" et "face-à-face" en mode live. Clé gratuite : FOOTBALL_DATA_KEY.
// Sans clé, les fonctions lèvent une erreur et les adaptateurs se replient (skip).
//
// Le palier gratuit limite à ~10 requêtes/min : on sérialise les appels (throttle)
// et on ne récupère qu'UNE fois les matchs de chaque équipe (cache), la forme et
// le face-à-face étant tous deux dérivés de cette même liste.
import { fetchT } from "./http.mjs";
import { throttle } from "./throttle.mjs";

const BASE = "https://api.football-data.org/v4";
let teamIndexCache = null;
const matchesCache = new Map(); // teamId -> matches[] (récent -> ancien)

// Alias nom (The Odds API) -> variantes possibles côté football-data.
const ALIASES = {
  "dr congo": ["congo dr", "democratic republic of congo", "congo"],
  "bosnia & herzegovina": ["bosnia and herzegovina", "bosnia-herzegovina"],
  "ivory coast": ["côte d'ivoire", "cote d'ivoire"],
  "south korea": ["korea republic"],
  "usa": ["united states"],
  "cape verde": ["cabo verde", "cape verde islands"],
};

function headers(ctx) {
  const key = ctx.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_KEY manquant");
  return { "X-Auth-Token": key };
}

async function get(ctx, path) {
  const gap = ctx.config?.live?.footballData?.minGapMs ?? 6500;
  return throttle("football-data", gap, async () => {
    const res = await fetchT(BASE + path, { headers: headers(ctx) });
    if (!res.ok) throw new Error(`football-data HTTP ${res.status} sur ${path}`);
    return res.json();
  });
}

/** Index nom→id des équipes de la compétition (mémoïsé sur la durée du run). */
export async function teamIndex(ctx) {
  if (teamIndexCache) return teamIndexCache;
  const comp = ctx.config?.live?.footballData?.competition || "WC";
  const data = await get(ctx, `/competitions/${comp}/teams`);
  const idx = new Map();
  for (const t of data.teams || []) {
    for (const alias of [t.name, t.shortName, t.tla]) {
      if (alias) idx.set(alias.toLowerCase(), t.id);
    }
  }
  teamIndexCache = idx;
  return idx;
}

let compMatchesCache = null;

/** Matchs du calendrier de la compétition (mémoïsé). Sert au filtre WC strict. */
export async function competitionMatches(ctx) {
  if (compMatchesCache) return compMatchesCache;
  const comp = ctx.config?.live?.footballData?.competition || "WC";
  const data = await get(ctx, `/competitions/${comp}/matches`);
  compMatchesCache = data.matches || [];
  return compMatchesCache;
}

/**
 * Dénouement d'un match (prolongation / tirs au but) via le calendrier WC.
 * Retourne { decidedBy: "aet"|"pens", outcome: "home"|"away"|"draw", pens }
 * ou null si le match s'est joué dans le temps réglementaire (ou introuvable).
 * Sert à connaître le VRAI vainqueur des matchs à élimination directe.
 */
export async function matchOutcome(ctx, homeName, awayName, dateISO) {
  let ms;
  try { ms = await competitionMatches(ctx); } catch { return null; }
  const norm = (s) => (s || "").toLowerCase().trim();
  const day = (dateISO || "").slice(0, 10);
  const same = (fdName, oddsName) => {
    const a = norm(fdName), b = norm(oddsName);
    if (!a || !b) return false;
    if (a === b || a.includes(b) || b.includes(a)) return true;
    for (const [k, arr] of Object.entries(ALIASES)) {
      const set = new Set([k, ...arr]);
      if (set.has(a) && set.has(b)) return true;
    }
    return false;
  };
  const m = ms.find((x) => {
    const d = (x.utcDate || "").slice(0, 10);
    return d === day && same(x.homeTeam && x.homeTeam.name, homeName) &&
      same(x.awayTeam && x.awayTeam.name, awayName);
  });
  const sc = m && m.score;
  if (!sc) return null;
  const decidedBy = sc.duration === "PENALTY_SHOOTOUT" ? "pens"
    : sc.duration === "EXTRA_TIME" ? "aet" : null;
  if (!decidedBy) return null;
  const outcome = sc.winner === "HOME_TEAM" ? "home" : sc.winner === "AWAY_TEAM" ? "away" : "draw";
  const pens = sc.penalties && sc.penalties.home != null && sc.penalties.away != null
    ? { home: sc.penalties.home, away: sc.penalties.away } : null;
  return { decidedBy, outcome, pens };
}

/** Identifiant football-data d'une équipe à partir de son nom (avec alias). */
export async function teamId(ctx, name) {
  const idx = await teamIndex(ctx);
  const key = (name || "").toLowerCase();
  if (idx.has(key)) return idx.get(key);
  for (const alt of ALIASES[key] || []) {
    if (idx.has(alt)) return idx.get(alt);
  }
  return null;
}

/**
 * Matchs terminés d'une équipe (les plus récents d'abord), mis en cache.
 * Une seule requête par équipe et par run, réutilisée par forme + face-à-face.
 */
export async function teamMatches(ctx, id) {
  if (matchesCache.has(id)) return matchesCache.get(id);
  const limit = ctx.config?.live?.footballData?.h2hScan || 50;
  const data = await get(ctx, `/teams/${id}/matches?status=FINISHED&limit=${limit}`);
  const ms = (data.matches || []).slice().reverse(); // API renvoie chronologique
  matchesCache.set(id, ms);
  return ms;
}
