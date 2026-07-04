#!/usr/bin/env python3
"""
Sonde absences : interroge la presse (GNews) par équipe de la grille avec des
mots-clés blessure/suspension/forfait et PROPOSE des candidats absents.

⚠️ Ne modifie JAMAIS absences.json automatiquement : la détection de noms de
joueurs dans des titres est bruitée (surtout sur les équipes exotiques). Le
rapport ABSENCES-CANDIDATS.md liste les candidats + la phrase source pour que
tu VALIDES à la main, puis colle le bloc JSON (poids à remplir) dans absences.json.

Secret NEWS_API_KEY requis → GitHub Actions.
"""
import json
import os
import re
import time
import unicodedata
import urllib.parse
import urllib.request

KEY = os.environ.get("NEWS_API_KEY", "")
HERE = os.path.dirname(__file__)
UA = "lotofoot-absences/1.0"

# EN + FR : la requête cible les articles parlant d'indisponibilités.
KW_QUERY = ("injured OR injury OR suspended OR \"ruled out\" OR doubt OR "
            "blessé OR blessure OR suspendu OR forfait OR absent")
# mots-clés reconnus dans le texte pour étiqueter la raison
REASONS = {
    "injur": "blessé", "blessé": "blessé", "blessure": "blessé",
    "suspen": "suspendu", "suspendu": "suspendu", "banned": "suspendu",
    "ruled out": "forfait", "forfait": "forfait", "out for": "forfait",
    "doubt": "incertain", "incertain": "incertain", "absent": "absent",
}
# mots capitalisés à ne PAS prendre pour des joueurs
NOISE = {"the", "fc", "cf", "sc", "league", "cup", "premier", "serie", "liga",
         "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
         "sunday", "january", "february", "march", "april", "may", "june",
         "july", "august", "september", "october", "november", "december",
         "world", "match", "coach", "manager", "vs", "united", "city",
         "report", "news", "video", "live", "preview", "star", "boss"}

L = []
def say(s): L.append(s); print(s)


def strip(s):
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def gnews(team):
    q = urllib.parse.quote(f'"{team}" ({KW_QUERY})')
    url = (f"https://gnews.io/api/v4/search?q={q}&lang=en&max=10"
           f"&sortby=publishedAt&apikey={urllib.parse.quote(KEY)}")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8", "replace")).get("articles", [])


def reason_of(text):
    t = text.lower()
    for k, v in REASONS.items():
        if k in t:
            return v, k
    return None, None


def candidate_names(text, team):
    """Suites de mots capitalisés (prénom+nom) — heuristique, à valider."""
    teamtok = {w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ]+", strip(team))}
    names = []
    for m in re.finditer(r"\b([A-ZÀ-Þ][a-zà-ÿ]+(?:\s+[A-ZÀ-Þ][a-zà-ÿ]+){1,2})\b",
                         strip(text)):
        name = m.group(1)
        toks = name.lower().split()
        if any(t in NOISE or t in teamtok for t in toks):
            continue
        names.append(name)
    # dédoublonne en gardant l'ordre
    seen, uniq = set(), []
    for n in names:
        if n.lower() not in seen:
            seen.add(n.lower()); uniq.append(n)
    return uniq[:3]


def main():
    say("# Sonde absences — candidats à VALIDER (presse GNews)\n")
    grid = json.load(open(os.path.join(HERE, "grille.json"), encoding="utf-8"))
    if not KEY:
        say("❌ NEWS_API_KEY manquant."); return finish()

    teams = []
    for m in grid["matchs"]:
        for t in (m["dom"], m["ext"]):
            if t not in teams:
                teams.append(t)
    say(f"Grille : **{grid.get('nom','?')}** · {len(teams)} équipes interrogées.\n")

    draft = {}
    for t in teams:
        try:
            arts = gnews(t)
        except Exception as e:
            say(f"- ⚠️ {t} : {e}")
            time.sleep(1.5)
            continue
        hits = []
        for a in arts:
            text = f"{a.get('title','')} — {a.get('description','')}"
            reason, kw = reason_of(text)
            if not reason:
                continue
            for nm in candidate_names(text, t):
                hits.append((nm, reason, a.get("title", ""),
                             (a.get("source") or {}).get("name", ""), text))
        if hits:
            say(f"## {t}")
            picked = {}
            for nm, reason, title, src, text in hits:
                key = nm.lower()
                if key not in picked:
                    picked[key] = (nm, reason)
                    say(f"- **{nm}** — _{reason}_ · « {title.strip()} » ({src})")
            draft[t] = [{"joueur": nm, "raison": reason}
                        for nm, reason in picked.values()]
            say("")
        time.sleep(1.5)   # respecte la limite GNews

    say("---\n")
    if draft:
        say("## 📋 Absents détectés → `absences-auto.json` (lu automatiquement par le moteur)\n")
        say("Le poids de chaque joueur est **calculé depuis sa note** (valeur "
            "Transfermarkt) par le moteur cotes ; un joueur sans note ⇒ 0 impact. "
            "Pour corriger/forcer, édite `absences.json` (prioritaire).\n")
        say("```json")
        say(json.dumps({"equipes": draft}, ensure_ascii=False, indent=2))
        say("```")
    else:
        say("_Aucun absent détecté dans la presse — aucune correction appliquée._")
    return finish(draft)


def finish(draft=None):
    open(os.path.join(HERE, "ABSENCES-CANDIDATS.md"), "w", encoding="utf-8").write(
        "\n".join(L) + "\n")
    # fichier machine lu automatiquement par moteur-cotes.py
    json.dump({"note": "généré par sonde-absences.py (presse). Édite absences.json pour corriger.",
               "equipes": draft or {}},
              open(os.path.join(HERE, "absences-auto.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
