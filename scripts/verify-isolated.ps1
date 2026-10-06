param(
    [string]$DshCommand = 'dsh',
    [string]$PluginPath,
    [switch]$WithWebProfile
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$installTarget = if ([string]::IsNullOrWhiteSpace($PluginPath)) { $projectRoot } else { [System.IO.Path]::GetFullPath($PluginPath) }
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('dsh-task-sound-' + [guid]::NewGuid().ToString('N'))
$previousDshHome = [Environment]::GetEnvironmentVariable('DSH_HOME', 'Process')
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
    $env:DSH_HOME = $tempRoot
    if ($WithWebProfile) {
        $dshVersion = (& $DshCommand --version | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($dshVersion)) { throw 'Unable to determine the installed DSH version' }
        & $DshCommand plugin --profile web add "@deepseek-ai/dsh-web-app@$dshVersion" --allow-build=koffi
        if ($LASTEXITCODE -ne 0) { throw "DSH Web profile initialization failed with exit code $LASTEXITCODE" }
    }
    & $DshCommand plugin --profile web add $installTarget
    if ($LASTEXITCODE -ne 0) { throw "Plugin installation failed with exit code $LASTEXITCODE" }
    $dump = & $DshCommand --profile web --dump-config 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "Config dump failed with exit code $LASTEXITCODE`n$dump" }
    if ($dump -notmatch 'id:\s*task-sound') { throw 'task-sound row was not found in composed config' }
    & $DshCommand plugin --profile web remove dsh-task-sound
    if ($LASTEXITCODE -ne 0) { throw "Plugin removal failed with exit code $LASTEXITCODE" }
    $afterRemoval = & $DshCommand --profile web --dump-config 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "Config dump after removal failed with exit code $LASTEXITCODE`n$afterRemoval" }
    if ($afterRemoval -match 'id:\s*task-sound') { throw 'task-sound row remained after plugin removal' }
    Write-Output "Isolated install and uninstall verification passed for: $installTarget"
}
finally {
    if ($null -eq $previousDshHome) {
        Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
    }
    else {
        $env:DSH_HOME = $previousDshHome
    }
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
