#!/usr/bin/env python3
"""
Suivi comparatif des grilles Loto Foot jouées vs résultats réels.

Traite TOUS les fichiers suivi-*.json du dossier (N°51, N°87, …). Chaque fichier
décrit les matchs et une ou plusieurs grilles (les clés dont la valeur est une
liste d'issues, ex. "toi"/"moi" ou "ref"). Le script récupère le résultat réel
de chaque match (API-Football, issue réglée sur 90 min) et compte, pour chaque
grille, le nombre de matchs corrects (issue ∈ pronostics). Écrit un SUIVI-*.md
par grille.

Réutilise les helpers de moteur-cotes.py. Secret APIFOOTBALL_KEY → GitHub Actions.
"""
import glob
import importlib.util
import json
import os

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location("mc", os.path.join(HERE, "moteur-cotes.py"))
mc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mc)

FINISHED = {"FT", "AET", "PEN"}
NON_GRID = {"i", "dom", "ext"}   # clés qui ne sont pas des grilles


def _scan(tid, other, tid_is_dom):
    """Cherche dans les 30 derniers matchs de `tid` celui contre `other` ;
    renvoie (issue 1N2 côté grille, score) ou None. tid_is_dom = tid est le
    'dom' de la grille."""
    ot = set(mc.norm(other))
    try:
        fixtures = mc.af(f"/fixtures?team={tid}&last=30")
    except Exception:
        return None
    for f in fixtures:
        if f["fixture"]["status"]["short"] not in FINISHED:
            continue
        h, a = f["teams"]["home"], f["teams"]["away"]
        opp = a if h["id"] == tid else h
        if mc.side_match(list(ot), set(mc.norm(opp["name"]))) <= 0:
            continue
        ft = f.get("score", {}).get("fulltime", {}) or {}
        gh, ga = ft.get("home"), ft.get("away")
        if gh is None or ga is None:
            gh, ga = f["goals"]["home"], f["goals"]["away"]
        if gh is None or ga is None:
            continue
        tid_goals = gh if h["id"] == tid else ga
        opp_goals = ga if h["id"] == tid else gh
        dg, eg = (tid_goals, opp_goals) if tid_is_dom else (opp_goals, tid_goals)
        res = "1" if dg > eg else "2" if dg < eg else "N"
        short = f["fixture"]["status"]["short"]
        tag = " ⏱" if short == "AET" else " 🥅" if short == "PEN" else ""
        return res, f"{dg}-{eg}{tag}"
    return None


def result_90(dom, ext):
    """Issue 1N2 (90 min) du match dom–ext + score. Essaie via l'équipe à
    domicile puis, à défaut, via l'extérieur. None si pas encore joué/introuvable."""
    hid, _ = mc.team_id(dom)
    if hid:
        r = _scan(hid, ext, tid_is_dom=True)
        if r:
            return r
    aid, _ = mc.team_id(ext)
    if aid:
        r = _scan(aid, dom, tid_is_dom=False)
        if r:
            return r
    return None


def grid_names(matchs):
    return [k for k, v in matchs[0].items() if k not in NON_GRID and isinstance(v, list)]


def process(path):
    d = json.load(open(path, encoding="utf-8"))
    L = []
    say = lambda s: L.append(s)
    grids = grid_names(d["matchs"])
    say(f"# Suivi {d['nom']} — grille(s) vs réel ({d.get('budget','?')} €)\n")
    if not mc.KEY:
        say("❌ APIFOOTBALL_KEY manquant.")
    else:
        head = "| # | Match | Résultat 90′ | " + " | ".join(f"{g} | ✓" for g in grids) + " |"
        say(head)
        say("|---|---|---|" + "---|:-:|" * len(grids))
        ok = {g: 0 for g in grids}
        joues = 0
        for m in d["matchs"]:
            r = result_90(m["dom"], m["ext"])
            cells = ""
            if not r:
                for g in grids:
                    cells += f" {'/'.join(m[g])} | · |"
                say(f"| {m['i']} | {m['dom']}–{m['ext']} | _à venir_ |{cells}")
                continue
            res, score = r
            joues += 1
            for g in grids:
                hit = res in m[g]
                ok[g] += hit
                cells += f" {'/'.join(m[g])} | {'✅' if hit else '❌'} |"
            say(f"| {m['i']} | {m['dom']}–{m['ext']} | **{res}** ({score}) |{cells}")
        n = len(d["matchs"])
        say(f"\n**Matchs joués : {joues}/{n}**")
        for g in grids:
            tot = f" ({ok[g]}/{n} au total)" if joues == n else ""
            say(f"- **{g}** : {ok[g]}/{joues} corrects{tot}")
        if joues == n:
            rank = n - 2
            for g in grids:
                say(f"  - {g} : {'🏆 grille parfaite !' if ok[g]==n else ('🎯 rang gagnant (≥%d) !' % rank) if ok[g]>=rank else 'hors rang'}")

    name = os.path.basename(path).replace("suivi-", "SUIVI-").replace(".json", ".md")
    open(os.path.join(HERE, name), "w", encoding="utf-8").write("\n".join(L) + "\n")
    return name


def main():
    files = sorted(glob.glob(os.path.join(HERE, "suivi-*.json")))
    for p in files:
        out = process(p)
        print(f"écrit {out}")


if __name__ == "__main__":
    main()
