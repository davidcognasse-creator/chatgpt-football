// fetch avec timeout : évite qu'un appel réseau qui ne répond pas bloque tout
// le robot (sans timeout, fetch attend indéfiniment).
export async function fetchT(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
