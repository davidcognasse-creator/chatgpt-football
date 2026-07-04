#!/usr/bin/env python3
"""
Suivi comparatif Loto Foot N°51 : grille jouée (toi) vs grille optimale (moi).
Récupère le résultat réel de chaque match (API-Football, issue réglée sur 90 min)
et compte, pour chaque grille, le nombre de matchs corrects (issue ∈ pronostics).
Écrit SUIVI-N51.md.

Réutilise les helpers de moteur-cotes.py (norm/alias, team_id, af, side_match).
Secret APIFOOTBALL_KEY requis → GitHub Actions.
"""
import importlib.util
import json
import os

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location("mc", os.path.join(HERE, "moteur-cotes.py"))
mc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mc)

FINISHED = {"FT", "AET", "PEN"}
L = []
def say(s): L.append(s); print(s)


def result_90(dom, ext):
    """Issue 1N2 (90 min) du match dom–ext, ou None si pas encore joué/introuvable."""
    hid, _ = mc.team_id(dom)
    if not hid:
        return None
    et = set(mc.norm(ext))
    try:
        fixtures = mc.af(f"/fixtures?team={hid}&last=20")
    except Exception:
        return None
    for f in fixtures:
        if f["fixture"]["status"]["short"] not in FINISHED:
            continue
        h, a = f["teams"]["home"], f["teams"]["away"]
        opp = a if h["id"] == hid else h
        if mc.side_match(list(et), set(mc.norm(opp["name"]))) <= 0:
            continue
        ft = f.get("score", {}).get("fulltime", {}) or {}
        gh, ga = ft.get("home"), ft.get("away")
        if gh is None or ga is None:
            gh, ga = f["goals"]["home"], f["goals"]["away"]
        if gh is None or ga is None:
            continue
        if h["id"] != hid:          # remet dans l'ordre dom/ext de la grille
            gh, ga = ga, gh
        res = "1" if gh > ga else "2" if gh < ga else "N"
        tag = " (a.p.)" if f["fixture"]["status"]["short"] == "AET" else \
              " (t.a.b.)" if f["fixture"]["status"]["short"] == "PEN" else ""
        return res, f"{gh}-{ga}{tag}"
    return None


def main():
    d = json.load(open(os.path.join(HERE, "suivi-n51.json"), encoding="utf-8"))
    say(f"# Suivi {d['nom']} — ta grille vs la grille optimale ({d['budget']} €)\n")
    if not mc.KEY:
        say("❌ APIFOOTBALL_KEY manquant."); return finish()

    say("| # | Match | Résultat 90′ | Toi | ✓ | Moi | ✓ |")
    say("|---|---|---|---|:-:|---|:-:|")
    okU = okM = joues = 0
    for m in d["matchs"]:
        r = result_90(m["dom"], m["ext"])
        if not r:
            say(f"| {m['i']} | {m['dom']}–{m['ext']} | _à venir_ | {'/'.join(m['toi'])} | · | {'/'.join(m['moi'])} | · |")
            continue
        res, score = r
        joues += 1
        hu = res in m["toi"]; hm = res in m["moi"]
        okU += hu; okM += hm
        say(f"| {m['i']} | {m['dom']}–{m['ext']} | **{res}** ({score}) | {'/'.join(m['toi'])} | "
            f"{'✅' if hu else '❌'} | {'/'.join(m['moi'])} | {'✅' if hm else '❌'} |")

    say(f"\n**Matchs joués : {joues}/15**")
    say(f"- 🎫 Ta grille : **{okU}/{joues}** corrects" + (f" ({okU}/15 au total)" if joues == 15 else ""))
    say(f"- 🤖 Grille optimale : **{okM}/{joues}** corrects" + (f" ({okM}/15 au total)" if joues == 15 else ""))
    if joues == 15:
        rank = lambda k: "🏆 15/15 !" if k == 15 else "🥈 rang 14" if k == 14 else "🥉 rang 13" if k == 13 else "hors rang"
        say(f"- Ta grille : {rank(okU)} · Grille optimale : {rank(okM)}")
    return finish()


def finish():
    open(os.path.join(HERE, "SUIVI-N51.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
