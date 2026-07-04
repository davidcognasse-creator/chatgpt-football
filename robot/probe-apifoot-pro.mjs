// Sonde API-Football PRO : valide ce que le plan expose pour construire le
// moteur Loto Foot — cotes (/odds), prédictions (/predictions), compo
// (/fixtures/lineups) et fixtures saison en cours, sur des équipes de la grille.
//
// Lancer sur GitHub Actions (secret APIFOOTBALL_KEY).  node robot/probe-apifoot-pro.mjs
import { writeFile } from "node:fs/promises";

const KEY = process.env.APIFOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";
const TEAMS = ["Hammarby", "Shanghai Shenhua", "Ulsan"]; // Suède, Chine, Corée

let lastHeaders = null;
async function api(path) {
  const r = await fetch(BASE + path, { headers: { "x-apisports-key": KEY } });
  lastHeaders = r.headers;
  const j = await r.json();
  const e = j.errors;
  const hasErr = Array.isArray(e) ? e.length > 0 : e && Object.keys(e).length > 0;
  if (hasErr) throw new Error("API errors: " + JSON.stringify(e));
  return j;
}

const L = [];
const say = (s) => { L.push(s); console.log(s); };

function quota() {
  if (!lastHeaders) return "";
  const day = lastHeaders.get("x-ratelimit-requests-remaining");
  const lim = lastHeaders.get("x-ratelimit-requests-limit");
  return day ? `quota jour restant : ${day}/${lim}` : "";
}

async function probeTeam(name) {
  say(`\n## ${name}`);
  // 1) team id
  let team = null;
  try {
    const j = await api(`/teams?search=${encodeURIComponent(name)}`);
    team = (j.response || [])[0]?.team;
    say(team ? `- ✅ équipe trouvée : ${team.name} (id ${team.id})`
             : "- ❌ équipe introuvable"); if (!team) return;
  } catch (e) { say(`- ❌ /teams : ${e.message}`); return; }

  // 2) prochain match
  let fx = null;
  try {
    const j = await api(`/fixtures?team=${team.id}&next=3`);
    const arr = j.response || [];
    fx = arr[0];
    say(arr.length ? `- ✅ prochains matchs : ${arr.length} — ex. ${fx.teams.home.name}–${fx.teams.away.name} `
        + `(${fx.fixture.date.slice(0, 16)}, fixture ${fx.fixture.id}, league ${fx.league.id} ${fx.league.name})`
        : "- ⚠️ aucun match à venir (hors saison ?)");
    if (!fx) return;
  } catch (e) { say(`- ❌ /fixtures next : ${e.message}`); return; }

  const fid = fx.fixture.id;
  // 3) cotes
  try {
    const j = await api(`/odds?fixture=${fid}`);
    const resp = j.response || [];
    let n = 0;
    if (resp.length) {
      for (const bk of resp[0].bookmakers || []) {
        if ((bk.bets || []).some((b) => b.name === "Match Winner" || b.id === 1)) n++;
      }
    }
    say(resp.length ? `- ✅ cotes : ${n} bookmakers avec "Match Winner"`
                    : "- ⚠️ pas de cotes pour ce match (souvent dispo J-3 à J-1)");
  } catch (e) { say(`- ❌ /odds : ${e.message}`); }

  // 4) prédictions
  try {
    const j = await api(`/predictions?fixture=${fid}`);
    const p = (j.response || [])[0]?.predictions?.percent;
    say(p ? `- ✅ prédiction API : 1=${p.home} N=${p.draw} 2=${p.away}`
          : "- ⚠️ pas de prédiction");
  } catch (e) { say(`- ❌ /predictions : ${e.message}`); }

  // 5) compo (souvent J-40min ; test quand même)
  try {
    const j = await api(`/fixtures/lineups?fixture=${fid}`);
    const lus = j.response || [];
    say(lus.length ? `- ✅ compo dispo (${lus.length} équipes)`
                   : "- ⚠️ compo pas encore publiée (normal loin du coup d'envoi)");
  } catch (e) { say(`- ❌ /fixtures/lineups : ${e.message}`); }
}

async function main() {
  say("# Sonde API-Football PRO — cotes / prédictions / compo / fixtures\n");
  if (!KEY) { say("❌ APIFOOTBALL_KEY manquant."); return finish(); }
  for (const t of TEAMS) {
    try { await probeTeam(t); } catch (e) { say(`\n## ${t}\n- ❌ ${e.message}`); }
  }
  say(`\n---\n${quota()}`);
  say("_But : confirmer que le plan Pro expose cotes+prédictions+compo sur ces "
    + "ligues, pour rebrancher le moteur Loto Foot sur API-Football._");
  return finish();
}

async function finish() {
  try { await writeFile("analyse-ligue1/SONDE-APIFOOT-PRO.md", L.join("\n") + "\n"); }
  catch { /* ignore */ }
}

main();
