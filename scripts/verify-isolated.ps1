param(
    [string]$DshCommand = 'dsh'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('dsh-task-sound-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
    $env:DSH_HOME = $tempRoot
    & $DshCommand plugin --profile web add $projectRoot
    if ($LASTEXITCODE -ne 0) { throw "Plugin installation failed with exit code $LASTEXITCODE" }
    $dump = & $DshCommand --profile web --dump-config 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) { throw "Config dump failed with exit code $LASTEXITCODE`n$dump" }
    if ($dump -notmatch 'id:\s*task-sound') { throw 'task-sound row was not found in composed config' }
    Write-Output "Isolated profile verification passed: $tempRoot"
}
finally {
    Remove-Item Env:DSH_HOME -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
