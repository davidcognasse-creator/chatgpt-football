// Source "vainqueur" : probabilités de remporter la Coupe du Monde, à partir
// des cotes "outright winner" des bookmakers (The Odds API). Ces cotes intègrent
// déjà tout le tableau ET les vrais résultats (recalculées après chaque match).
import { fetchT } from "../lib/http.mjs";
import { team } from "../lib/teams.mjs";

const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/** @returns {Array<{name, flag, code, prob}>} trié par probabilité décroissante. */
export async function fetchWinner(ctx) {
  const key = ctx.env.ODDS_API_KEY;
  const live = ctx.config?.live || {};
  if (!key) return null;
  const sport = live.winnerSport || "soccer_fifa_world_cup_winner";
  const regions = live.regions || "eu,uk";
  const url =
    `https://api.the-odds-api.com/v4/sports/${sport}/odds` +
    `?regions=${encodeURIComponent(regions)}&markets=outrights&oddsFormat=decimal&apiKey=${key}`;

  const res = await fetchT(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Odds API (winner) HTTP ${res.status}`);
  const events = await res.json();

  // Moyenne des probabilités implicites (1/cote) par équipe sur tous les books.
  const acc = new Map(); // name -> { sum, n }
  for (const ev of events) {
    for (const b of ev.bookmakers || []) {
      for (const mk of b.markets || []) {
        if (mk.key !== "outrights") continue;
        for (const o of mk.outcomes || []) {
          if (!o.name || !o.price) continue;
          const cur = acc.get(o.name) || { sum: 0, n: 0 };
          cur.sum += 1 / o.price;
          cur.n += 1;
          acc.set(o.name, cur);
        }
      }
    }
  }
  if (acc.size === 0) return null;

  const raw = [...acc.entries()].map(([name, v]) => ({ name, p: v.sum / v.n }));
  const total = raw.reduce((s, x) => s + x.p, 0) || 1; // de-vig (normalisation)
  return raw
    .map((x) => {
      const t = team(x.name);
      return { name: x.name, flag: t.flag, code: t.code, prob: Math.round((x.p / total) * 1000) / 10 };
    })
    .sort((a, b) => b.prob - a.prob);
}
