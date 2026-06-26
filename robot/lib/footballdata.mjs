// Client minimal football-data.org (résultats réels) — utilisé par les sources
// "forme" et "face-à-face" en mode live. Clé gratuite : FOOTBALL_DATA_KEY.
// Sans clé, les fonctions lèvent une erreur et les adaptateurs se replient (skip).

const BASE = "https://api.football-data.org/v4";
let teamIndexCache = null;

function headers(ctx) {
  const key = ctx.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_KEY manquant");
  return { "X-Auth-Token": key };
}

async function get(ctx, path) {
  const res = await fetch(BASE + path, { headers: headers(ctx) });
  if (!res.ok) throw new Error(`football-data HTTP ${res.status} sur ${path}`);
  return res.json();
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

/** Identifiant football-data d'une équipe à partir de son nom. */
export async function teamId(ctx, name) {
  const idx = await teamIndex(ctx);
  return idx.get((name || "").toLowerCase()) || null;
}

/** N derniers matchs terminés d'une équipe (les plus récents d'abord). */
export async function finishedMatches(ctx, id, limit = 5) {
  const data = await get(ctx, `/teams/${id}/matches?status=FINISHED&limit=${limit}`);
  return (data.matches || []).slice().reverse(); // API renvoie chronologique
}
