// Conversion des cotes décimales en probabilités implicites,
// avec retrait de la marge bookmaker ("de-vig") et moyenne multi-books.

/** Probabilité implicite brute d'une cote décimale (inclut la marge). */
export function impliedFromDecimal(odds) {
  return 1 / odds;
}

/** Normalise un vecteur {home,draw,away} pour que la somme fasse 1. */
export function normalize(v) {
  const sum = v.home + v.draw + v.away;
  if (sum <= 0) return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 };
  return { home: v.home / sum, draw: v.draw / sum, away: v.away / sum };
}

/**
 * Probabilités dévignées (sans marge) pour un seul bookmaker.
 * On convertit chaque cote en probabilité implicite puis on normalise.
 */
export function devigBook(odds) {
  return normalize({
    home: impliedFromDecimal(odds.home),
    draw: impliedFromDecimal(odds.draw),
    away: impliedFromDecimal(odds.away),
  });
}

/**
 * Probabilités consensus du marché à partir de plusieurs bookmakers :
 * moyenne des probabilités dévignées de chaque book.
 */
export function marketConsensus(books) {
  if (!books || books.length === 0) return null;
  const acc = { home: 0, draw: 0, away: 0 };
  for (const b of books) {
    const p = devigBook(b.odds);
    acc.home += p.home;
    acc.draw += p.draw;
    acc.away += p.away;
  }
  return normalize(acc);
}
