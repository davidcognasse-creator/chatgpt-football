#!/usr/bin/env python3
"""
Prédicteur de GRILLE Loto Foot — modèle vs FOULE.

Lit grille.json (matchs + répartition des mises de la foule), calcule pour
chaque match une proba 1·N·2 via la note d'équipe (valeur Transfermarkt), et la
COMPARE à la foule → surligne les DIVERGENCES (là où le modèle voit une value
que la foule néglige — l'edge d'un jeu de pool).

v1 : couvre les ligues-CLUBS présentes dans le dataset Transfermarkt.
Sélections nationales + ligues non couvertes = marquées « non couvert »
(on ajoutera une cascade cotes/API-Football ensuite).

Réseau ouvert requis (dataset R2) → GitHub Actions.
"""
import csv
import gzip
import io
import json
import os
import re
import unicodedata
import urllib.request
from collections import defaultdict

R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
GAMMA, HA, DRAW = 0.6, 1.35, 0.26

L = []
def say(s): L.append(s); print(s)

STOP = {"fc", "cf", "sc", "if", "sk", "ac", "as", "sd", "cd", "club", "de", "the",
        "football", "association", "calcio", "aik", "ff", "cska", "afc", "bk"}


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    toks = [t for t in s.split() if t and t not in STOP]
    return " ".join(toks)


def load_clubs():
    txt = gzip.decompress(urllib.request.urlopen(
        urllib.request.Request(f"{R2}/players.csv.gz", headers={"User-Agent": UA}), timeout=120
    ).read()).decode("utf-8", "replace")
    vals = defaultdict(list)
    comp = {}
    for p in csv.DictReader(io.StringIO(txt)):
        cn = p.get("current_club_name", "")
        try:
            v = int(p["market_value_in_eur"])
        except (ValueError, TypeError):
            continue
        vals[cn].append(v)
        comp[cn] = p.get("current_club_domestic_competition_id", "")
    clubs = {}
    for cn, vs in vals.items():
        clubs[cn] = {"n": norm(cn), "val": sum(sorted(vs, reverse=True)[:16]), "comp": comp.get(cn, "")}
    return clubs


def match_club(name, clubs):
    """Appariement STRICT : exige un token distinctif (≥5 lettres) partagé et la
    couverture des tokens significatifs de la requête. Sinon → None (non couvert),
    pour ne JAMAIS fabriquer un faux appariement (sélections, clubs exotiques…)."""
    q = norm(name)
    qtok = [t for t in q.split() if len(t) >= 4]
    if not qtok:
        return None
    best = None
    for cn, c in clubs.items():
        n = c["n"]
        if n == q:
            return (cn, c)
        ntok = set(n.split())
        shared = [t for t in qtok if t in ntok]
        if not shared or max(len(t) for t in shared) < 5:
            continue
        cover = len(shared) / len(qtok)      # part des mots significatifs retrouvés
        if cover < 0.6:
            continue
        score = cover + 0.001 * max(len(t) for t in shared)
        if not best or score > best[0]:
            best = (score, cn, c)
    return (best[1], best[2]) if best else None


def probs(vh, va):
    sh = (vh * HA) ** GAMMA
    sa = va ** GAMMA
    r = 1 - DRAW
    a, b = sh + 1e-9, sa + 1e-9
    return {"1": r * a / (a + b), "N": DRAW, "2": r * b / (a + b)}


def main():
    say("# Prédicteur de grille Loto Foot — modèle vs foule\n")
    path = os.path.join(os.path.dirname(__file__), "grille.json")
    grid = json.load(open(path, encoding="utf-8"))
    say(f"Grille : **{grid.get('nom','?')}** · {len(grid['matchs'])} matchs\n")
    try:
        clubs = load_clubs()
        say(f"Dataset Transfermarkt : {len(clubs)} clubs.\n")
    except Exception as e:
        say(f"❌ Dataset indisponible : {e}"); return finish()

    say("| # | Match | Modèle 1·N·2 | Foule 1·N·2 | Prono modèle | Foule | Écart |")
    say("|---|---|---|---|---|---|---|")
    divergences = []
    for i, m in enumerate(grid["matchs"], 1):
        f = m["foule"]; ft = f["1"] + f["N"] + f["2"] or 1
        foule = {k: f[k] / ft for k in ("1", "N", "2")}
        ch = match_club(m["dom"], clubs)
        ca = match_club(m["ext"], clubs)
        crowd_pick = max(("1", "N", "2"), key=lambda k: foule[k])
        if not ch or not ca:
            manque = m["dom"] if not ch else m["ext"]
            say(f"| {i} | {m['dom']}–{m['ext']} | — | {foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | "
                f"_non couvert_ ({manque}) | {crowd_pick} | — |")
            continue
        p = probs(ch[1]["val"], ca[1]["val"])
        model_pick = max(("1", "N", "2"), key=lambda k: p[k])
        edge = p[model_pick] - foule[model_pick]
        flag = ""
        if model_pick != crowd_pick:
            flag = f"**{p[model_pick]-foule[model_pick]:+.0%}**"
            divergences.append((i, m, model_pick, crowd_pick, p, foule))
        say(f"| {i} | {m['dom']}–{m['ext']} | {p['1']*100:.0f}/{p['N']*100:.0f}/{p['2']*100:.0f} | "
            f"{foule['1']*100:.0f}/{foule['N']*100:.0f}/{foule['2']*100:.0f} | **{model_pick}** | {crowd_pick} | {flag} |")

    say("\n## 🎯 Divergences modèle vs foule (value potentielle)")
    if divergences:
        for i, m, mp, cp, p, foule in divergences:
            say(f"- **Match {i} · {m['dom']}–{m['ext']}** : le modèle penche **{mp}** "
                f"({p[mp]*100:.0f}%) alors que la foule joue **{cp}** ({foule[cp]*100:.0f}%). "
                f"→ value si le modèle a raison.")
    else:
        say("_Aucune divergence sur les matchs couverts (le modèle suit la foule) — "
            "ou couverture insuffisante sur cette grille._")

    say("\n---\n_v1 : note d'équipe = valeur d'effectif (pas encore la compo ni les absents). "
        "Sélections nationales + ligues hors dataset = non couvertes → cascade cotes/API-Football à venir._")
    return finish()


def finish():
    try:
        open("GRILLE-PRONO.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
