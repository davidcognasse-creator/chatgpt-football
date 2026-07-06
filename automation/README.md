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
Deux tâches (ex. 9h00 et 19h00). Dans PowerShell **en admin** :
```powershell
$ps  = "powershell -ExecutionPolicy Bypass -File `"$HOME\Documents\chatgpt-football\automation\loto-auto.ps1`""
schtasks /create /tn "LotoFoot AM" /tr $ps /sc daily /st 09:00 /f
schtasks /create /tn "LotoFoot PM" /tr $ps /sc daily /st 19:00 /f
```
Vérifier / lancer / supprimer :
```powershell
schtasks /query /tn "LotoFoot AM"
schtasks /run   /tn "LotoFoot AM"
schtasks /delete /tn "LotoFoot AM" /f
```

## Notes
- Le PC doit être **allumé et la session ouverte** aux heures planifiées (sinon la
  tâche est repoussée au prochain réveil selon tes réglages).
- Chaque exécution consomme des **crédits API** Claude.
- L'agent est **prudent** : s'il n'y a rien de neuf, il ne pousse rien ; en cas de
  doute (grille illisible/ambiguë), il ne modifie rien et le note dans le log.
- `--dangerously-skip-permissions` (dans le .ps1) est nécessaire en headless pour
  écrire/committer sans invite ; c'est scopé à TON dépôt. Retire-le pour repasser en
  mode validation manuelle.
