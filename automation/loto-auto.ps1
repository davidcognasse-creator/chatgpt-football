# Automatisation Loto Foot — lance Claude Code en headless avec Playwright, 2x/jour.
# Planifié via le Planificateur de tâches Windows (voir automation/README.md).
#
# Pré-requis : Node, Git, `npm i -g @anthropic-ai/claude-code`, `npm i -g @playwright/mcp`,
# `claude mcp add playwright -s user -- cmd /c playwright-mcp`, `npx playwright install
# chromium`. PC allumé + session ouverte.

# NB PowerShell 5.1 : ne PAS mettre "Stop" ici. git écrit sa progression sur stderr ;
# avec "Stop" + "2>&1" ces messages NORMAUX deviennent des erreurs BLOQUANTES et le
# script s'arrête au 1er git. "Continue" laisse le script se dérouler jusqu'au bout.
$ErrorActionPreference = "Continue"

# --- Chemin du dépôt (adapte si tu l'as cloné ailleurs) ---
$Repo   = Join-Path $HOME "Documents\chatgpt-football"
$Branch = "claude/world-cup-predictions-site-pjspe6"
$Prompt = Join-Path $Repo "automation\loto-agent-prompt.md"
$LogDir = Join-Path $Repo "automation\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log   = Join-Path $LogDir "run-$stamp.log"

Set-Location $Repo
# On passe par `cmd /c "... 2>&1"` : la redirection stderr est faite par cmd, donc
# PowerShell reçoit du texte simple (pas d'ErrorRecord rouge, pas d'arrêt) et on log.
cmd /c "git fetch origin $Branch 2>&1"         | Tee-Object -FilePath $log -Append
cmd /c "git checkout $Branch 2>&1"             | Tee-Object -FilePath $log -Append
cmd /c "git pull --rebase origin $Branch 2>&1" | Tee-Object -FilePath $log -Append
if ($LASTEXITCODE -ne 0) { "AVERTISSEMENT : git a renvoyé le code $LASTEXITCODE (on continue)" | Tee-Object -FilePath $log -Append }

$promptText = Get-Content $Prompt -Raw

# --dangerously-skip-permissions : requis en headless pour écrire/committer/pousser
# sans invite. Scopé à TON dépôt. Retire-le si tu veux valider chaque action.
claude -p $promptText `
  --dangerously-skip-permissions `
  2>&1 | Tee-Object -FilePath $log -Append

Write-Host "Terminé. Log : $log"
