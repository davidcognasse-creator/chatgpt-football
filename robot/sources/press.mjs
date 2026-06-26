// Adaptateur "presse".
//  - fixtures : penchants éditoriaux pré-remplis.
//  - live     : GDELT (gratuit, sans clé) — volume + tonalité des articles par
//               équipe, convertis en probabilités.
import { countsToProbs, twoSidedProbs } from "../lib/aggregate.mjs";
import { throttle } from "../lib/throttle.mjs";

const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/** Volume et tonalité moyenne GDELT pour une requête sur les N dernières heures. */
async function gdeltTone(queryTerm, hours) {
  const query = `"${queryTerm}" (football OR soccer OR "world cup")`;
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}` +
    `&mode=tonechart&format=json&timespan=${hours}h`;
  const data = await throttle("gdelt", 5000, async () => {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
    return res.json();
  });
  let volume = 0;
  let toneSum = 0;
  for (const b of data.tonechart || []) {
    volume += b.count;
    toneSum += b.bin * b.count;
  }
  return { volume, tone: volume ? toneSum / volume : 0 };
}

// Force = volume pondéré par la favorabilité de la tonalité (tone GDELT ~ -10..+10).
const strength = (s) => (s.volume + 1) * (1 / (1 + Math.exp(-s.tone / 3)));

export async function fetchPress(match, ctx) {
  // Mode fixtures : on garde les penchants pré-remplis.
  if (ctx.mode !== "live") {
    const leans = match.press?.leans || { home: 0, draw: 0, away: 0 };
    return {
      probs: countsToProbs(leans, ctx.alpha),
      sampleSize: match.press?.outlets || 0,
      sentiment: match.press?.sentiment || "",
    };
  }

  // Mode live : GDELT.
  try {
    const hours = ctx.config?.live?.newsLookbackHours || 72;
    const [h, a] = await Promise.all([
      gdeltTone(match.home.name, hours),
      gdeltTone(match.away.name, hours),
    ]);
    return {
      probs: twoSidedProbs(strength(h), strength(a)),
      sampleSize: Math.round(h.volume + a.volume),
      sentiment: `tonalité ${h.tone.toFixed(1)} / ${a.tone.toFixed(1)}`,
    };
  } catch (e) {
    console.warn(`[press] indisponible pour ${match.home.name}-${match.away.name}: ${e.message}`);
    return { probs: null, sampleSize: 0, sentiment: "" };
  }
}
