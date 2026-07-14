# Automatisation Loto Foot (local + Playwright, 2×/jour)

Lance l'agent Loto Foot (Claude Code headless + Playwright) **deux fois par jour** sur
ta machine Windows : il récupère la grille ouverte et les résultats/rapports officiels
FDJ (via le MCP Playwright, un vrai Chromium qui passe les 403), met à jour les
fichiers du site, pousse sur la branche, et déclenche le workflow des cotes.

## Pourquoi en local (et pas GitHub Actions) ?
Playwright pilote un vrai Chromium **depuis une IP résidentielle** pour passer les
protections anti-bot (Cloudflare) de Pronosoft/FDJ. Les runners GitHub ont des IP
datacenter → re-bloquées. Les parties **sans** navigateur (cotes API-Football, scores,
calibration) sont, elles, déjà automatisées côté serveur par les crons du repo.

> Note : on utilisait `wick_fetch` à l'origine, mais wick-mcp ne s'installe pas sous
> Windows (macOS/Linux uniquement). Playwright MCP est le remplaçant natif Windows.

## Pré-requis (une fois)
```powershell
node --version ; git --version                 # doivent répondre
npm install -g @anthropic-ai/claude-code
npm install -g @playwright/mcp                  # serveur MCP Playwright
claude mcp add playwright -s user -- cmd /c playwright-mcp
npx playwright install chromium                 # télécharge le navigateur
claude mcp list                                 # doit montrer: playwright  Connected
```
Clone le repo si ce n'est pas fait :
```powershell
cd $HOME\Documents
git clone https://github.com/davidcognasse-creator/chatgpt-football.git
cd chatgpt-football
git checkout claude/world-cup-predictions-site-pjspe6
```
Teste une exécution manuelle (vérifie le log dans automation\logs\) :
```powershell
powershell -ExecutionPolicy Bypass -File automation\loto-auto.ps1
```

## Planifier 2×/jour (Planificateur de tâches Windows)
Le plus simple et fiable : lance le script fourni (crée/écrase les 2 tâches avec un
déclenchement robuste — rattrapage d'un run manqué, batterie, réveil) :
```powershell
powershell -ExecutionPolicy Bypass -File automation\setup-tasks.ps1
```
Il crée `LotoFoot AM` (07:00) et `LotoFoot PM` (17:00) avec :
- **StartWhenAvailable** : si le PC était éteint/en veille à l'heure prévue, le run se
  fait **dès que le PC redevient dispo** (rallumé/réveillé) — plus de run perdu.
- **Batterie autorisée** (portable) et **WakeToRun** (réveille depuis la veille).

Modifier les horaires : édite `setup-tasks.ps1` (lignes `Set-LotoTask`) et relance-le.
Vérifier / lancer / supprimer :
```powershell
Get-ScheduledTask -TaskName "LotoFoot AM","LotoFoot PM" | Select TaskName,State
schtasks /run   /tn "LotoFoot AM"
schtasks /delete /tn "LotoFoot AM" /f
```

## Notes
- Grâce à **StartWhenAvailable**, un run manqué (PC éteint) est **rattrapé au réveil**.
  Un PC totalement **éteint** ne peut pas se réveiller seul (WakeToRun ne marche que
  depuis la veille) — mais le rattrapage se déclenche dès que tu rallumes.
- Chaque exécution consomme des **crédits API** Claude.
- L'agent est **prudent** : s'il n'y a rien de neuf, il ne pousse rien ; en cas de
  doute (grille illisible/ambiguë), il ne modifie rien et le note dans le log.
- `--dangerously-skip-permissions` (dans le .ps1) est nécessaire en headless pour
  écrire/committer sans invite ; c'est scopé à TON dépôt. Retire-le pour repasser en
  mode validation manuelle.
