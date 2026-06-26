// Client minimal football-data.org (résultats réels) — utilisé par les sources
// "forme" et "face-à-face" en mode live. Clé gratuite : FOOTBALL_DATA_KEY.
// Sans clé, les fonctions lèvent une erreur et les adaptateurs se replient (skip).
//
// Le palier gratuit limite à ~10 requêtes/min : on sérialise les appels (throttle)
// et on ne récupère qu'UNE fois les matchs de chaque équipe (cache), la forme et
// le face-à-face étant tous deux dérivés de cette même liste.
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
    const res = await fetch(BASE + path, { headers: headers(ctx) });
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
