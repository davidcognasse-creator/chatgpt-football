# (Re)crée les tâches planifiées LotoFoot AM/PM avec un déclenchement FIABLE.
# À lancer UNE FOIS sur ta machine (rejoue-le si tu changes les horaires) :
#   powershell -ExecutionPolicy Bypass -File automation\setup-tasks.ps1
#
# Réglages appliqués :
#   - StartWhenAvailable        : rattrape un run manqué dès que le PC est dispo
#                                 (rallumé / réveillé) — le cœur de la fiabilisation.
#   - AllowStartIfOnBatteries    : autorise le démarrage même sur batterie (portable).
#   - DontStopIfGoingOnBatteries : ne coupe pas le run si tu débranches.
#   - WakeToRun                  : réveille le PC s'il est en VEILLE (pas depuis un
#                                  arrêt complet — un PC éteint ne peut pas se réveiller seul).
#   - MultipleInstances Ignore   : si un run tourne encore, on n'en relance pas un 2e.
#
# La tâche tourne "quand l'utilisateur est connecté" (session ouverte) — nécessaire
# pour Playwright/Chromium.

$ErrorActionPreference = "Stop"

$Script  = Join-Path $HOME "Documents\chatgpt-football\automation\loto-auto.ps1"
if (-not (Test-Path $Script)) { throw "Introuvable : $Script (le repo est-il cloné au bon endroit ?)" }

$argStr   = "-NonInteractive -ExecutionPolicy Bypass -File `"$Script`""
$action   = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argStr
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -WakeToRun `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

function Set-LotoTask($name, $time) {
  $trigger = New-ScheduledTaskTrigger -Daily -At $time
  Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger `
    -Settings $settings -Description "Mise à jour Loto Foot (chatgpt.football)" -Force | Out-Null
  Write-Host "OK : $name a $time (rattrapage + batterie + reveil actives)"
}

Set-LotoTask "LotoFoot AM" "07:00"
Set-LotoTask "LotoFoot PM" "17:00"

Write-Host ""
Write-Host "Termine. Verification :"
Get-ScheduledTask -TaskName "LotoFoot AM","LotoFoot PM" |
  Select-Object TaskName, State,
    @{n="Rattrapage";e={$_.Settings.StartWhenAvailable}},
    @{n="SurBatterie";e={-not $_.Settings.DisallowStartIfOnBatteries}} |
  Format-Table -AutoSize
