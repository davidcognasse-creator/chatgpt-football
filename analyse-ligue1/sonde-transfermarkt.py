#!/usr/bin/env python3
"""
Sonde Transfermarkt (valeur marchande = note par joueur).

Utilise le DATASET PUBLIC du mainteneur (Cloudflare R2), pas de scraping, pas de
violation de CGU. Vérifie qu'on peut, pour un club, sommer la valeur marchande
d'un XI → note d'équipe. Réseau ouvert requis (OK sur GitHub Actions).

Colonnes players.csv : name, current_club_name,
current_club_domestic_competition_id (FR1=Ligue 1), market_value_in_eur, position…
"""
import csv
import gzip
import io
import urllib.request
from collections import defaultdict

R2 = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

L = []
def say(s): L.append(s); print(s)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    return urllib.request.urlopen(req, timeout=120).read()


def load_players():
    # players.csv.gz sinon players.csv (selon la publication du mainteneur)
    last = None
    for name in ("players.csv.gz", "players.csv"):
        try:
            raw = fetch(f"{R2}/{name}")
            txt = gzip.decompress(raw).decode("utf-8", "replace") if name.endswith(".gz") \
                else raw.decode("utf-8", "replace")
            return list(csv.DictReader(io.StringIO(txt)))
        except Exception as e:
            last = e
    raise last


def main():
    say("# Sonde Transfermarkt — valeur marchande par joueur → note d'équipe\n")
    try:
        players = load_players()
    except Exception as e:
        say(f"❌ Téléchargement dataset impossible : {e}")
        say("(Blocage réseau ? Ce script est fait pour tourner sur GitHub Actions.)")
        return finish()

    say(f"✅ Dataset chargé : {len(players)} joueurs.\n")

    # Ligue 1 (FR1)
    fr1 = [p for p in players if p.get("current_club_domestic_competition_id") == "FR1"
           and p.get("market_value_in_eur")]
    clubs = defaultdict(list)
    for p in fr1:
        try:
            v = int(p["market_value_in_eur"])
        except (ValueError, TypeError):
            continue
        clubs[p.get("current_club_name", "?")].append((p.get("name", "?"), v, p.get("position", "")))
    say(f"## Ligue 1 (FR1) : {len(clubs)} clubs, {len(fr1)} joueurs valorisés")

    # Couverture multi-ligues (grilles Loto Foot = plusieurs pays)
    comps = defaultdict(int)
    for p in players:
        c = p.get("current_club_domestic_competition_id")
        if c and p.get("market_value_in_eur"):
            comps[c] += 1
    top = sorted(comps.items(), key=lambda x: -x[1])[:12]
    say("\n## Couverture par compétition (top 12) — utile pour les grilles multi-ligues")
    say("| Compétition | joueurs valorisés |")
    say("|---|---|")
    for c, n in top:
        say(f"| {c} | {n} |")

    # Exemple : note d'équipe = somme du top-11 par valeur (approx. du XI type)
    say("\n## Exemple de NOTE D'ÉQUIPE (somme du top-11 par valeur)")
    for name in list(clubs.keys()):
        if "paris" in name.lower() or "psg" in name.lower():
            squad = sorted(clubs[name], key=lambda x: -x[1])
            xi = squad[:11]
            total = sum(v for _, v, _ in xi)
            say(f"- **{name}** : note d'équipe (top-11) = **{total/1e6:.0f} M€**")
            for nm, v, pos in xi[:6]:
                say(f"    - {nm} ({pos}) : {v/1e6:.0f} M€")
            say(f"    - … Retirer la star (‑{xi[0][1]/1e6:.0f} M€) ferait chuter la note → c'est l'edge compo.")
            break

    say("\n---\nVerdict : si ✅, la valeur marchande sert de note par joueur ; on somme le XI annoncé (API-Football).")
    return finish()


def finish():
    try:
        open("SONDE-TRANSFERMARKT.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
