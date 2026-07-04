// Agrégation des trois sources (paris, presse, X) en une prédiction unique.
import { normalize } from "./odds.mjs";

/** Convertit des comptes {home,draw,away} en probabilités lissées par un prior. */
export function countsToProbs(counts, alpha = 0.05) {
  const total = counts.home + counts.draw + counts.away;
  const a = alpha * total || alpha; // lissage proportionnel au volume
  return normalize({
    home: counts.home + a,
    draw: counts.draw + a,
    away: counts.away + a,
  });
}

const KEYS = ["home", "draw", "away"];

/** Distance de variation totale entre deux vecteurs de probabilités (0–1). */
function tvDistance(a, b) {
  return 0.5 * KEYS.reduce((s, k) => s + Math.abs(a[k] - b[k]), 0);
}

/** Issue la plus probable d'un vecteur. */
export function favoredOutcome(p) {
  if (p.home >= p.draw && p.home >= p.away) return "home";
  if (p.away >= p.draw && p.away >= p.home) return "away";
  return "draw";
}

/**
 * Combine des sources pondérées en une prédiction.
 * sources = [{ key, weight, probs }]. Les poids sont renormalisés sur les
 * sources réellement disponibles.
 */
export function aggregate(sources, xg) {
  const avail = sources.filter((s) => s.probs);
  const wsum = avail.reduce((s, x) => s + x.weight, 0) || 1;

  const probs = normalize(
    avail.reduce(
      (acc, s) => {
        const w = s.weight / wsum;
        acc.home += w * s.probs.home;
        acc.draw += w * s.probs.draw;
        acc.away += w * s.probs.away;
        return acc;
      },
      { home: 0, draw: 0, away: 0 }
    )
  );

  // Accord entre sources : 1 - distance moyenne au consensus (0–1).
  let agreement = 1;
  if (avail.length > 1) {
    const avgDist =
      avail.reduce((s, x) => s + tvDistance(x.probs, probs), 0) / avail.length;
    agreement = 1 - avgDist;
  }

  // Confiance : concentration de la prédiction + accord des sources.
  const maxProb = Math.max(probs.home, probs.draw, probs.away);
  const confidence = Math.round(
    Math.min(95, Math.max(35, maxProb * 100 * 0.6 + agreement * 100 * 0.4))
  );

  // Score attendu : à partir des expected goals si fournis, sinon dérivé des probas.
  const predictedScore = xg
    ? { home: Math.max(0, Math.round(xg.home)), away: Math.max(0, Math.round(xg.away)) }
    : scoreFromProbs(probs);

  return { probs, confidence, predictedScore, agreement };
}

/** Score plausible déduit des probabilités, COHÉRENT avec l'issue favorite. */
export function scoreFromProbs(p) {
  const fav = favoredOutcome(p); // home / draw / away (= argmax)
  if (fav === "draw") return { home: 1, away: 1 };
  // L'équipe favorite gagne ; l'ampleur dépend de l'écart de probabilités.
  const margin = Math.abs(p.home - p.away);
  const win = margin > 0.3 ? 3 : 2;
  const lose = margin > 0.3 ? 0 : 1;
  return fav === "home" ? { home: win, away: lose } : { home: lose, away: win };
}

/**
 * Probabilités à deux forces : répartit la masse hors-nul entre domicile et
 * extérieur au prorata de leurs scores de force, le nul gardant un prior fixe.
 */
export function twoSidedProbs(strengthHome, strengthAway, drawPrior = 0.26) {
  const a = strengthHome + 1e-6;
  const b = strengthAway + 1e-6;
  const remain = 1 - drawPrior;
  return normalize({
    home: (remain * a) / (a + b),
    draw: drawPrior,
    away: (remain * b) / (a + b),
  });
}

const PCT = (x) => Math.round(x * 100);

/** Génère une analyse en français : synthèse (accord/désaccord) plutôt qu'une
 *  liste répétitive où le nom de l'équipe revient à chaque phrase. */
export function buildAnalysis(match, prediction, sources) {
  const sideName = (k) =>
    k === "home" ? match.home.name : k === "away" ? match.away.name : "le nul";
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const joinFr = (arr) =>
    arr.length <= 1 ? arr[0] || "" : arr.slice(0, -1).join(", ") + " et " + arr[arr.length - 1];

  const fav = favoredOutcome(prediction.probs);
  const favName = sideName(fav);
  const p = PCT(prediction.probs[fav]);
  const probs = (k) => (sources.find((s) => s.key === k) || {}).probs;
  const LABELS = {
    form: "la forme récente",
    h2h: "l'historique des confrontations",
    press: "la presse",
    social: "le public",
  };

  const parts = [];

  // 1) Ouverture, ton modulé par la confiance.
  const conf = p >= 62 ? "se détache" : p >= 52 ? "tient la corde" : "part favori de justesse";
  parts.push(`${cap(favName)} ${conf} avec ${p}% de chances estimées.`);

  // 2) Le marché (cotes) : confirme ou contredit.
  const betting = probs("betting");
  if (betting) {
    const bf = favoredOutcome(betting);
    parts.push(
      bf === fav
        ? `Les cotes confirment (${PCT(betting[bf])}%).`
        : `Les cotes, elles, penchent pour ${sideName(bf)} (${PCT(betting[bf])}%).`
    );
  }

  // 3) Signaux qualitatifs : on regroupe ceux qui vont dans le sens du modèle
  //    et on met en avant les signaux contraires (l'info la plus utile).
  const signals = ["form", "h2h", "press", "social"]
    .map((k) => ({ k, pr: probs(k) }))
    .filter((x) => x.pr);
  const agree = signals.filter((x) => favoredOutcome(x.pr) === fav).map((x) => LABELS[x.k]);
  const disagree = signals.filter((x) => favoredOutcome(x.pr) !== fav);

  if (agree.length >= 2) parts.push(`${cap(joinFr(agree))} vont dans le même sens.`);
  else if (agree.length === 1) parts.push(`${cap(agree[0])} abonde aussi.`);

  if (disagree.length) {
    const byTeam = {};
    disagree.forEach((x) => {
      const team = sideName(favoredOutcome(x.pr));
      (byTeam[team] = byTeam[team] || []).push(LABELS[x.k]);
    });
    const frags = Object.entries(byTeam).map(
      ([team, ls]) => `${joinFr(ls)} ${ls.length > 1 ? "penchent" : "penche"} plutôt pour ${team}`
    );
    parts.push(`À contre-courant, ${frags.join(" ; ")}.`);
  }

  if (match.note) parts.push(match.note);
  return parts.join(" ");
}
