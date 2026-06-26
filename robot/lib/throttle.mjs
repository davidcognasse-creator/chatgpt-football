// Limiteur de débit simple : sérialise les appels par "clé" en garantissant un
// écart minimal entre deux départs (pour respecter les quotas/min des API).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = new Map(); // key -> { chain: Promise, last: number }

export function throttle(key, minGapMs, fn) {
  const s = state.get(key) || { chain: Promise.resolve(), last: 0 };
  const run = s.chain.then(async () => {
    const gap = s.last ? minGapMs - (Date.now() - s.last) : 0;
    if (gap > 0) await sleep(gap);
    s.last = Date.now();
    return fn();
  });
  // La chaîne continue quel que soit le résultat de fn.
  s.chain = run.then(
    () => {},
    () => {}
  );
  state.set(key, s);
  return run;
}
