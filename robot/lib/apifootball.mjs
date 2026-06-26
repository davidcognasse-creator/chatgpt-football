// Client minimal API-Football (api-sports.io) — utilisé pour le face-à-face.
// Clé gratuite (100 req/jour) : APIFOOTBALL_KEY. Endpoint H2H dédié, couvre
// bien l'historique des sélections nationales. Throttle (free = 10 req/min).
import { fetchT } from "./http.mjs";
import { throttle } from "./throttle.mjs";

const BASE = "https://v3.football.api-sports.io";
const idCache = new Map(); // nom (lower) -> team id

function headers(ctx) {
  const key = ctx.env.APIFOOTBALL_KEY;
  if (!key) throw new Error("APIFOOTBALL_KEY manquant");
  return { "x-apisports-key": key };
}

async function get(ctx, path) {
  const gap = ctx.config?.live?.apiFootball?.minGapMs ?? 6500;
  return throttle("apifootball", gap, async () => {
    const res = await fetchT(BASE + path, { headers: headers(ctx) });
    if (!res.ok) throw new Error(`API-Football HTTP ${res.status} sur ${path}`);
    const j = await res.json();
    // api-sports renvoie 200 même en cas d'erreur (clé, quota, plan) -> on remonte.
    const errs = j.errors;
    const hasErr = Array.isArray(errs) ? errs.length > 0 : errs && Object.keys(errs).length > 0;
    if (hasErr) throw new Error(`API-Football errors: ${JSON.stringify(errs)}`);
    return j;
  });
}

/** Identifiant API-Football d'une sélection (privilégie l'équipe nationale). */
export async function teamId(ctx, name) {
  const key = (name || "").toLowerCase();
  if (idCache.has(key)) return idCache.get(key);
  // Cache persistant (évite de reconsommer des requêtes pour les mêmes équipes).
  const persisted = ctx.cache?.teams;
  if (persisted && persisted[key] != null) {
    idCache.set(key, persisted[key]);
    return persisted[key];
  }
  // Le champ search n'accepte que [alphanumérique + espaces] (pas de "&", etc.).
  const search = (name || "").replace(/[^A-Za-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const j = await get(ctx, `/teams?search=${encodeURIComponent(search)}`);
  const arr = j.response || [];
  if (!arr.length) {
    throw new Error(`API-Football: 0 résultat pour "${name}" (results=${j.results}, params=${JSON.stringify(j.parameters || {})})`);
  }
  const national = arr.find((x) => x.team && x.team.national);
  const id = (national || arr[0]).team.id;
  idCache.set(key, id);
  if (persisted) persisted[key] = id;
  return id;
}

/** Confrontations passées entre deux équipes (fixtures terminés).
 *  NB : le paramètre "last" est réservé aux plans payants → on ne l'envoie pas. */
export async function headToHead(ctx, id1, id2) {
  const j = await get(ctx, `/fixtures/headtohead?h2h=${id1}-${id2}`);
  return j.response || [];
}
