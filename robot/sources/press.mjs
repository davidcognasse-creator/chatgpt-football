// Adaptateur "presse".
//  - fixtures : penchants éditoriaux pré-remplis.
//  - live     : GNews (clé NEWS_API_KEY, fonctionne en CI) — volume d'articles
//               par équipe ; repli sur GDELT (sans clé) si pas de clé ou erreur.
import { fetchT } from "../lib/http.mjs";
import { countsToProbs, twoSidedProbs } from "../lib/aggregate.mjs";
import { throttle } from "../lib/throttle.mjs";

const UA = "wc2026-predictions-robot/1.0 (+github actions)";

/** Nombre total d'articles GNews (gnews.io) pour une équipe. */
async function gnewsVolume(term, ctx) {
  const key = ctx.env.NEWS_API_KEY;
  const q = encodeURIComponent(`"${term}" (football OR soccer)`);
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=10&sortby=publishedAt&apikey=${key}`;
  return throttle("gnews", 1500, async () => {
    const res = await fetchT(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`GNews HTTP ${res.status}`);
    const data = await res.json();
    return Number(data.totalArticles ?? (data.articles ? data.articles.length : 0));
  });
}

/** Volume et tonalité moyenne GDELT pour une requête sur les N dernières heures. */
async function gdeltTone(queryTerm, hours, gapMs = 3000) {
  const query = `"${queryTerm}" (football OR soccer OR "world cup")`;
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}` +
    `&mode=tonechart&format=json&timespan=${hours}h`;
  // GDELT est souvent bloqué en CI : 1 seul essai rapide (8s) pour ne pas
  // ralentir tout le run. S'il échoue, la presse est simplement ignorée.
  const data = await throttle("gdelt", gapMs, async () => {
    const res = await fetchT(url, { headers: { "User-Agent": UA } }, 8000);
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

  // Mode live : GNews en priorité (fonctionne en CI), sinon repli GDELT.
  if (ctx.env.NEWS_API_KEY) {
    try {
      const [vh, va] = await Promise.all([
        gnewsVolume(match.home.name, ctx),
        gnewsVolume(match.away.name, ctx),
      ]);
      return {
        probs: twoSidedProbs(vh + 1, va + 1),
        sampleSize: vh + va,
        sentiment: `GNews ${vh}/${va} articles`,
      };
    } catch (e) {
      console.warn(`[press] GNews indisponible (${e.message}) — repli GDELT`);
    }
  }

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
