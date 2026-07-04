// Sonde API-Football : vérifie que le plan renvoie bien COMPO + NOTES JOUEURS,
// et calcule une NOTE D'ÉQUIPE à partir du XI. Base du futur système Loto Foot.
//
// Lancer sur GitHub Actions (secret APIFOOTBALL_KEY + réseau ouvert).
//   node robot/probe-lineup.mjs
import { writeFile } from "node:fs/promises";

const KEY = process.env.APIFOOTBALL_KEY;
const BASE = "https://v3.football.api-sports.io";
const LEAGUE = 61; // Ligue 1
const SEASONS = [2023, 2022]; // le plan gratuit couvre souvent des saisons passées

async function api(path) {
  const r = await fetch(BASE + path, { headers: { "x-apisports-key": KEY } });
  const j = await r.json();
  const e = j.errors;
  const hasErr = Array.isArray(e) ? e.length > 0 : e && Object.keys(e).length > 0;
  if (hasErr) throw new Error("API errors: " + JSON.stringify(e));
  return j;
}

const L = [];
const say = (s) => { L.push(s); console.log(s); };

async function main() {
  say("# Sonde API-Football — compo + notes joueurs → note d'équipe\n");
  if (!KEY) { say("❌ APIFOOTBALL_KEY manquant."); return finish(); }

  // 1) Trouver un match terminé récent de Ligue 1
  let fixture = null, season = null;
  for (const s of SEASONS) {
    try {
      const j = await api(`/fixtures?league=${LEAGUE}&season=${s}`);
      const fts = (j.response || []).filter((f) => f.fixture.status.short === "FT");
      if (fts.length) {
        fts.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
        fixture = fts[0]; season = s;
        say(`✅ Fixtures L1 saison ${s} : ${fts.length} matchs terminés.`);
        break;
      }
      say(`⚠️ Saison ${s} : 0 match terminé (couverture du plan ?).`);
    } catch (err) { say(`⚠️ /fixtures saison ${s} : ${err.message}`); }
  }
  if (!fixture) { say("\n❌ Aucun fixture exploitable — plan trop limité pour la L1 ?"); return finish(); }

  const fid = fixture.fixture.id;
  const home = fixture.teams.home, away = fixture.teams.away;
  say(`\nMatch test : ${home.name} ${fixture.goals.home}-${fixture.goals.away} ${away.name} (fixture ${fid})\n`);

  // 2) Compositions (le XI)
  let lineups = [];
  try {
    const j = await api(`/fixtures/lineups?fixture=${fid}`);
    lineups = j.response || [];
    say(lineups.length ? `✅ Compos : ${lineups.length} équipes, XI récupéré.`
                       : "❌ Compos vides (endpoint non couvert par le plan).");
  } catch (err) { say(`❌ /fixtures/lineups : ${err.message}`); }

  // 3) Notes joueurs du match
  let ratings = {};
  try {
    const j = await api(`/fixtures/players?fixture=${fid}`);
    for (const t of j.response || []) {
      for (const p of t.players || []) {
        const rt = p.statistics && p.statistics[0] && p.statistics[0].games
          ? p.statistics[0].games.rating : null;
        if (rt != null) ratings[p.player.id] = parseFloat(rt);
      }
    }
    const n = Object.keys(ratings).length;
    say(n ? `✅ Notes joueurs : ${n} joueurs notés sur ce match.`
          : "❌ Aucune note joueur (endpoint fixtures/players non couvert).");
  } catch (err) { say(`❌ /fixtures/players : ${err.message}`); }

  // 4) NOTE D'ÉQUIPE = moyenne des notes du XI de départ
  say("\n## Note d'équipe (moyenne du XI de départ)");
  for (const lu of lineups) {
    const xi = (lu.startXI || []).map((e) => e.player);
    const rts = xi.map((p) => ratings[p.id]).filter((x) => x != null);
    const avg = rts.length ? (rts.reduce((s, x) => s + x, 0) / rts.length) : null;
    say(`- ${lu.team.name} : XI=${xi.length}, notés=${rts.length}` +
        (avg != null ? ` → **note d'équipe ${avg.toFixed(2)}**` : " → (pas de notes)"));
  }

  // 5) Notes SAISON (qualité pré-match, notre vrai besoin)
  say("\n## Notes SAISON par joueur (qualité pré-match)");
  try {
    const j = await api(`/players?team=${home.id}&season=${season}&page=1`);
    const arr = j.response || [];
    const withR = arr.filter((p) => p.statistics && p.statistics.some((s) => s.games && s.games.rating));
    say(`- ${home.name} : ${arr.length} joueurs, ${withR.length} avec note saison.` +
        (withR[0] ? ` Ex. ${withR[0].player.name} = ${withR[0].statistics.find((s)=>s.games&&s.games.rating).games.rating}` : ""));
  } catch (err) { say(`- /players saison : ${err.message}`); }

  say("\n---\nVerdict : si compo + notes sont ✅, on peut bâtir la note d'équipe par compo.");
  return finish();
}

async function finish() {
  try { await writeFile("analyse-ligue1/SONDE-APIFOOTBALL.md", L.join("\n") + "\n"); } catch {}
}

main().catch((e) => { say("Erreur fatale : " + e.message); finish(); });
