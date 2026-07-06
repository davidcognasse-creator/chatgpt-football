# Automatisation Loto Foot — lance Claude Code en headless avec Wick, 2x/jour.
# Planifié via le Planificateur de tâches Windows (voir automation/README.md).
#
# Pré-requis : Node, Git, `npm i -g @anthropic-ai/claude-code`, `npm i -g wick-mcp`
# puis `wick setup` (branche Wick dans Claude Code). PC allumé + session ouverte.

$ErrorActionPreference = "Stop"

# --- Chemin du dépôt (adapte si tu l'as cloné ailleurs) ---
$Repo   = Join-Path $HOME "Documents\chatgpt-football"
$Branch = "claude/world-cup-predictions-site-pjspe6"
$Prompt = Join-Path $Repo "automation\loto-agent-prompt.md"
$LogDir = Join-Path $Repo "automation\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log   = Join-Path $LogDir "run-$stamp.log"

Set-Location $Repo
git fetch origin $Branch 2>&1 | Tee-Object -FilePath $log -Append
git checkout $Branch     2>&1 | Tee-Object -FilePath $log -Append
git pull --rebase origin $Branch 2>&1 | Tee-Object -FilePath $log -Append

$promptText = Get-Content $Prompt -Raw

# --dangerously-skip-permissions : requis en headless pour écrire/committer/pousser
# sans invite. Scopé à TON dépôt. Retire-le si tu veux valider chaque action.
claude -p $promptText `
  --dangerously-skip-permissions `
  2>&1 | Tee-Object -FilePath $log -Append

Write-Host "Terminé. Log : $log"
