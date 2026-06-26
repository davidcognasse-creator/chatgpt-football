// Adaptateur "forme" : performances récentes (5 derniers matchs) -> probabilités.
//  - fixtures : chaîne de résultats pré-remplie, ex. "WWDLW" (récent -> ancien).
//  - live     : football-data.org (clé gratuite FOOTBALL_DATA_KEY), sinon skip.
import { twoSidedProbs } from "../lib/aggregate.mjs";
import { teamId, finishedMatches } from "../lib/footballdata.mjs";

const POINTS = { W: 3, D: 1, L: 0 };

/** Force de forme dans [0,1] à partir d'une chaîne de résultats type "WWDLW". */
function strengthFromString(s) {
  const r = (s || "").toUpperCase().replace(/[^WDL]/g, "");
  if (!r) return 0.5;
  const pts = [...r].reduce((a, c) => a + (POINTS[c] || 0), 0);
  return pts / (r.length * 3); // 0 = nul partout, 1 = 5 victoires
}

/** Résultat d'un match du point de vue de l'équipe (W/D/L). */
function resultFor(match, id) {
  const w = match.score?.winner;
  if (w === "DRAW") return "D";
  const homeWon = w === "HOME_TEAM";
  const isHome = match.homeTeam?.id === id;
  return homeWon === isHome ? "W" : "L";
}

async function liveFormString(ctx, name) {
  const id = await teamId(ctx, name);
  if (!id) throw new Error(`équipe inconnue: ${name}`);
  const last = ctx.config?.live?.footballData?.formLast || 5;
  const ms = await finishedMatches(ctx, id, last);
  return ms.map((m) => resultFor(m, id)).join("");
}

export async function fetchForm(match, ctx) {
  try {
    let hs, as;
    if (ctx.mode === "live") {
      [hs, as] = await Promise.all([
        liveFormString(ctx, match.home.name),
        liveFormString(ctx, match.away.name),
      ]);
    } else {
      hs = match.form?.home || "";
      as = match.form?.away || "";
      if (!hs && !as) return { probs: null, detail: "indisponible" };
    }
    return {
      probs: twoSidedProbs(strengthFromString(hs) + 0.05, strengthFromString(as) + 0.05),
      detail: `${hs || "—"} vs ${as || "—"}`,
    };
  } catch (e) {
    console.warn(`[form] indisponible pour ${match.home.name}-${match.away.name}: ${e.message}`);
    return { probs: null, detail: "indisponible" };
  }
}
