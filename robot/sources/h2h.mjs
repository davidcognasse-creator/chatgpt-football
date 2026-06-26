// Adaptateur "face-à-face" : historique des confrontations -> probabilités.
//  - fixtures : bilan pré-rempli { home, draw, away } (victoires/nuls).
//  - live     : football-data.org — on scanne les matchs terminés d'une équipe
//               et on retient ceux contre l'adversaire (clé FOOTBALL_DATA_KEY).
import { countsToProbs } from "../lib/aggregate.mjs";
import { teamId, teamMatches } from "../lib/footballdata.mjs";

/** Tally W/D/L vu du côté de l'équipe à domicile du match courant. */
async function liveH2H(ctx, homeName, awayName) {
  const [hid, aid] = await Promise.all([teamId(ctx, homeName), teamId(ctx, awayName)]);
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
