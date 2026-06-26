// Client minimal API-Football (api-sports.io) — utilisé pour le face-à-face.
// Clé gratuite (100 req/jour) : APIFOOTBALL_KEY. Endpoint H2H dédié, couvre
// bien l'historique des sélections nationales. Throttle (free = 10 req/min).
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
    const res = await fetch(BASE + path, { headers: headers(ctx) });
    if (!res.ok) throw new Error(`API-Football HTTP ${res.status} sur ${path}`);
    return res.json();
  });
}

/** Identifiant API-Football d'une sélection (privilégie l'équipe nationale). */
export async function teamId(ctx, name) {
  const key = (name || "").toLowerCase();
  if (idCache.has(key)) return idCache.get(key);
  const j = await get(ctx, `/teams?search=${encodeURIComponent(name)}`);
  const arr = j.response || [];
  const national = arr.find((x) => x.team && x.team.national);
  const id = (national && national.team.id) || (arr[0] && arr[0].team && arr[0].team.id) || null;
  idCache.set(key, id);
  return id;
}

/** Confrontations passées entre deux équipes (fixtures terminés). */
export async function headToHead(ctx, id1, id2, last = 20) {
  const j = await get(ctx, `/fixtures/headtohead?h2h=${id1}-${id2}&last=${last}`);
  return j.response || [];
}
