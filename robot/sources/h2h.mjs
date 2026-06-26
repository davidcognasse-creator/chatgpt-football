// Adaptateur "face-à-face" : historique des confrontations -> probabilités.
//  - fixtures : bilan pré-rempli { home, draw, away } (victoires/nuls).
//  - live     : API-Football (endpoint H2H dédié, clé APIFOOTBALL_KEY) en
//               priorité ; repli sur football-data si pas de clé ou erreur.
import { countsToProbs } from "../lib/aggregate.mjs";
import { teamId as fdTeamId, teamMatches } from "../lib/footballdata.mjs";
import { teamId as afTeamId, headToHead } from "../lib/apifootball.mjs";

const FINISHED = new Set(["FT", "AET", "PEN"]);

/** H2H via API-Football (endpoint dédié). */
async function viaApiFootball(ctx, homeName, awayName) {
  const [hid, aid] = await Promise.all([afTeamId(ctx, homeName), afTeamId(ctx, awayName)]);
  if (!hid || !aid) throw new Error("équipe inconnue (API-Football)");
  const fixtures = await headToHead(ctx, hid, aid);
  const counts = { home: 0, draw: 0, away: 0 };
  for (const f of fixtures) {
    if (!FINISHED.has(f.fixture?.status?.short)) continue;
    const gh = f.goals?.home;
    const ga = f.goals?.away;
    if (gh == null || ga == null) continue;
    let winnerId = gh > ga ? f.teams?.home?.id : ga > gh ? f.teams?.away?.id : null;
    if (winnerId === null) counts.draw++;
    else if (winnerId === hid) counts.home++;
    else counts.away++;
  }
  if (counts.home + counts.draw + counts.away === 0) throw new Error("aucune confrontation");
  return counts;
}

/** H2H via football-data (repli) : on filtre les matchs de l'équipe à domicile. */
async function viaFootballData(ctx, homeName, awayName) {
  const [hid, aid] = await Promise.all([fdTeamId(ctx, homeName), fdTeamId(ctx, awayName)]);
  if (!hid || !aid) throw new Error("équipe inconnue");
  const ms = await teamMatches(ctx, hid);
  const counts = { home: 0, draw: 0, away: 0 };
  for (const m of ms) {
    const opp = m.homeTeam?.id === hid ? m.awayTeam?.id : m.homeTeam?.id;
    if (opp !== aid) continue;
    const w = m.score?.winner;
    if (w === "DRAW") counts.draw++;
    else if (w === (m.homeTeam?.id === hid ? "HOME_TEAM" : "AWAY_TEAM")) counts.home++;
    else counts.away++;
  }
  if (counts.home + counts.draw + counts.away === 0) throw new Error("aucune confrontation");
  return counts;
}

async function liveH2H(ctx, homeName, awayName) {
  if (ctx.env.APIFOOTBALL_KEY) {
    try {
      return await viaApiFootball(ctx, homeName, awayName);
    } catch (e) {
      console.warn(`[h2h] API-Football indisponible (${e.message}) — repli football-data`);
    }
  }
  return viaFootballData(ctx, homeName, awayName);
}

export async function fetchH2H(match, ctx) {
  try {
    let counts;
    if (ctx.mode === "live") {
      counts = await liveH2H(ctx, match.home.name, match.away.name);
    } else {
      counts = match.h2h;
      if (!counts || counts.home + counts.draw + counts.away === 0)
        return { probs: null, detail: "indisponible" };
    }
    return {
      probs: countsToProbs(counts, 0.15),
      detail: `${counts.home}V ${counts.draw}N ${counts.away}D`,
    };
  } catch (e) {
    console.warn(`[h2h] indisponible pour ${match.home.name}-${match.away.name}: ${e.message}`);
    return { probs: null, detail: "indisponible" };
  }
}
