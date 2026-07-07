// Buteurs probables par équipe.
//  - fixtures (mode non-live) : liste curée fournie dans fixtures.json (match.scorers).
//  - live : ESTIMATION maison à partir des valeurs Transfermarkt (dataset public R2).
//    Pour chaque sélection, on prend les meilleurs attaquants/milieux (par valeur
//    marchande, indexés par pays de citoyenneté) et on répartit le nombre de buts
//    attendu (predictedScore) → proba « marque à tout moment ». C'est une estimation,
//    pas une cote (The Odds API, qui fournissait ce marché, a été abandonnée).

import zlib from "node:zlib";

const R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/players.csv.gz";
const TM_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Le nom d'équipe (CDM) diffère parfois du "country_of_citizenship" Transfermarkt.
// Clé = code FIFA (minuscule) OU nom normalisé ; valeur = citoyenneté TM normalisée.
const CITIZEN_OVERRIDE = {
  usa: "united states", us: "united states",
  kor: "korea south", "korea republic": "korea south", "south korea": "korea south",
  prk: "korea north", ksa: "saudi arabia", "saudi arabia": "saudi arabia",
  civ: "cote d ivoire", "ivory coast": "cote d ivoire",
  ira: "iran", irn: "iran", uae: "united arab emirates",
  rsa: "south africa", "cabo verde": "cape verde", "cape verde": "cape verde",
  "czech republic": "czech republic", tch: "czech republic",
};

// Poste Transfermarkt → poids offensif (proba de marquer).
const POS_WEIGHT = { Attack: 1.0, Midfield: 0.42 };

/** Parseur CSV minimal respectant les guillemets (pour "Korea, South" etc.). */
function* csvRows(text) {
  let field = "", row = [], inq = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inq) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inq = false;
      } else field += c;
    } else if (c === '"') inq = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); yield row; row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); yield row; }
}

let _TM = null; // Map: citoyenneté normalisée -> [{name, value, w}] triée par valeur×poids
async function loadTransfermarkt() {
  if (_TM) return _TM;
  const res = await fetch(R2, { headers: { "User-Agent": TM_UA } });
  if (!res.ok) throw new Error(`Transfermarkt HTTP ${res.status}`);
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf-8");
  const it = csvRows(text);
  const header = (it.next().value || []).map((h) => h.trim());
  const idx = {};
  header.forEach((h, i) => (idx[h] = i));
  const iName = idx.name, iVal = idx.market_value_in_eur,
    iPos = idx.position, iCit = idx.country_of_citizenship;
  if (iName == null || iVal == null || iCit == null) {
    throw new Error("colonnes Transfermarkt inattendues");
  }
  const byCountry = new Map();
  for (const row of it) {
    const value = parseInt(row[iVal], 10);
    if (!value) continue;
    const w = iPos != null ? (POS_WEIGHT[row[iPos]] || 0) : 1; // attaquants/milieux only
    if (!w) continue;
    const cit = norm(row[iCit]);
    if (!cit) continue;
    let arr = byCountry.get(cit);
    if (!arr) byCountry.set(cit, (arr = []));
    arr.push({ name: row[iName], value, w });
  }
  for (const arr of byCountry.values()) arr.sort((a, b) => b.value * b.w - a.value * a.w);
  _TM = byCountry;
  return _TM;
}

function countryKey(team) {
  return (
    CITIZEN_OVERRIDE[norm(team.code)] ||
    CITIZEN_OVERRIDE[norm(team.name)] ||
    norm(team.name)
  );
}

/** Buteurs estimés d'une équipe : répartit ~72% des buts attendus sur le pool offensif. */
function sideScorers(team, lambda, tm, topN) {
  const pool = (tm.get(countryKey(team)) || []).slice(0, 12);
  if (!pool.length) return [];
  const sumW = pool.reduce((s, p) => s + p.value * p.w, 0) || 1;
  const lam = Math.max(0.4, lambda || 1.3) * 0.72; // 72% des buts attribuables à des joueurs identifiés
  return pool
    .map((p) => {
      const li = lam * ((p.value * p.w) / sumW);
      return { name: p.name, prob: Math.min(75, Math.round((1 - Math.exp(-li)) * 100)) };
    })
    .filter((s) => s.prob >= 5)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, topN);
}

async function estimateScorers(match, ctx) {
  const tm = await loadTransfermarkt();
  const ps = match.predictedScore || {};
  const topN = Math.min(5, ctx.config?.live?.scorersTop || 5);
  const home = sideScorers(match.home, ps.home, tm, topN);
  const away = sideScorers(match.away, ps.away, tm, topN);
  if (!home.length && !away.length) return null;
  return { home, away, estimated: true };
}

export async function fetchScorers(match, ctx) {
  try {
    if (ctx.mode !== "live") return match.scorers || null; // fixtures curées
    if (ctx.config?.live?.scorersEstimate === false) return null; // interrupteur
    return await estimateScorers(match, ctx);
  } catch (e) {
    console.warn(`[scorers] indisponible pour ${match.home?.name}-${match.away?.name}: ${e.message}`);
    return null;
  }
}
