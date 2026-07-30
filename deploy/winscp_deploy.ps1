#Requires -Version 5.1
<#
  Deploy ARAY → https://intocables13.com/aray/
  1) npm run build
  2) Empaqueta dist + PHP (api, includes, database, .htaccess, scripts útiles)
  3) Genera database.local.php de producción (no lo sube desde Git)
  4) Backup remoto si /aray tiene contenido + upload FTPES
#>
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$DeployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $DeployDir
Set-Location $ProjectRoot

$LogsDir = Join-Path $DeployDir 'logs'
$BackupRoot = Join-Path $DeployDir 'backups'
$StageRoot = Join-Path $DeployDir 'stage'
foreach ($d in @($LogsDir, $BackupRoot)) {
    if (-not (Test-Path -LiteralPath $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
}

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $LogsDir "deploy-$ts.log"
$WinScpLog = Join-Path $LogsDir "deploy-winscp-$ts.log"

function Write-Log {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Write-Host $line
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
}

Write-Log "=== Deploy ARAY -> intocables13.com/aray/ ==="

$cfgPath = Join-Path $DeployDir 'hostalia.publish.local.json'
if (-not (Test-Path -LiteralPath $cfgPath)) {
    # Reutilizar credenciales de PuntoySigo si existen (misma cuenta Hostalia)
    $fallback = 'W:\PuntoySigo\deploy\hostalia.publish.local.json'
    if (Test-Path -LiteralPath $fallback) {
        $cfg = Get-Content -LiteralPath $fallback -Raw -Encoding UTF8 | ConvertFrom-Json
        $cfg.HOSTALIA_REMOTE_PATH = '/aray'
        $cfg | ConvertTo-Json | Set-Content -LiteralPath $cfgPath -Encoding UTF8
        Write-Log "Creado $cfgPath desde PuntoySigo (REMOTE_PATH=/aray)."
    } else {
        Write-Log "ERROR: Falta $cfgPath"
        exit 1
    }
}

$config = Get-Content -LiteralPath $cfgPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($k in @('HOSTALIA_PROTOCOL', 'HOSTALIA_HOST', 'HOSTALIA_USER', 'HOSTALIA_PASSWORD', 'HOSTALIA_REMOTE_PATH')) {
    if (-not $config.PSObject.Properties.Name -contains $k -or [string]::IsNullOrWhiteSpace([string]$config.$k)) {
        Write-Log "ERROR: Campo obligatorio: $k"
        exit 1
    }
}

function Find-WinScpCom {
    param([string]$JsonExplicitPath)
    if (-not [string]::IsNullOrWhiteSpace($JsonExplicitPath) -and (Test-Path -LiteralPath $JsonExplicitPath)) {
        return $JsonExplicitPath
    }
    $candidates = @(
        'C:\Users\agl03\AppData\Local\Programs\WinSCP\WinSCP.com',
        "${env:ProgramFiles(x86)}\WinSCP\WinSCP.com",
        "$env:ProgramFiles\WinSCP\WinSCP.com"
    )
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) { return $c }
    }
    return $null
}

$winscp = Find-WinScpCom -JsonExplicitPath ([string]$config.HOSTALIA_WINSCP_PATH)
if (-not $winscp) {
    Write-Log 'ERROR: No se encontró WinSCP.com.'
    exit 1
}

if (-not $SkipBuild) {
    Write-Log 'npm run build...'
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: build fallo ($LASTEXITCODE)"
        exit $LASTEXITCODE
    }
}

$distDir = Join-Path $ProjectRoot 'dist'
if (-not (Test-Path -LiteralPath (Join-Path $distDir 'index.html'))) {
    Write-Log 'ERROR: falta dist/index.html'
    exit 1
}

# --- Staging ---
if (Test-Path -LiteralPath $StageRoot) {
    Remove-Item -LiteralPath $StageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $StageRoot -Force | Out-Null

Write-Log 'Empaquetando stage...'
Copy-Item -Path (Join-Path $distDir '*') -Destination $StageRoot -Recurse -Force
foreach ($name in @('api', 'includes', 'database', 'scripts')) {
    $src = Join-Path $ProjectRoot $name
    if (Test-Path -LiteralPath $src) {
        Copy-Item -Path $src -Destination (Join-Path $StageRoot $name) -Recurse -Force
    }
}
Copy-Item -Path (Join-Path $ProjectRoot '.htaccess') -Destination (Join-Path $StageRoot '.htaccess') -Force -ErrorAction SilentlyContinue

# Quitar configs locales / secretos del stage
Get-ChildItem -Path (Join-Path $StageRoot 'includes') -Filter '*.local.php' -ErrorAction SilentlyContinue |
    Remove-Item -Force

# Generar database.local.php de producción a partir del local (sin subir el de Git)
$localPhp = Join-Path $ProjectRoot 'includes\database.local.php'
if (-not (Test-Path -LiteralPath $localPhp)) {
    Write-Log 'ERROR: falta includes/database.local.php local para generar el de producción'
    exit 1
}

$prodPhp = Join-Path $StageRoot 'includes\database.local.php'
$raw = Get-Content -LiteralPath $localPhp -Raw -Encoding UTF8
$raw = [regex]::Replace($raw, "define\(\s*'ARAY_ENV'\s*,\s*'[^']*'\s*\)", "define('ARAY_ENV', 'production')")
$raw = [regex]::Replace($raw, "define\(\s*'ARAY_COOKIE_SECURE'\s*,\s*[^)]+\)", "define('ARAY_COOKIE_SECURE', true)")
$raw = [regex]::Replace($raw, "define\(\s*'ARAY_COOKIE_PATH'\s*,\s*'[^']*'\s*\)", "define('ARAY_COOKIE_PATH', '/aray')")
$raw = [regex]::Replace($raw, "define\(\s*'ARAY_CREATE_DATABASE'\s*,\s*[^)]+\)", "define('ARAY_CREATE_DATABASE', false)")
if ($raw -notmatch "ARAY_COOKIE_PATH") {
    $raw += "`r`ndefine('ARAY_COOKIE_PATH', '/aray');`r`n"
}
if ($raw -notmatch "ARAY_COOKIE_SECURE") {
    $raw += "`r`ndefine('ARAY_COOKIE_SECURE', true);`r`n"
}
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($prodPhp, $raw.TrimStart([char]0xFEFF) + "`r`n", $utf8NoBom)
Write-Log 'Generado includes/database.local.php de producción en stage (no versionado).'

$protocol = [string]$config.HOSTALIA_PROTOCOL.Trim().ToLowerInvariant()
$hostName = [string]$config.HOSTALIA_HOST.Trim()
$userName = [string]$config.HOSTALIA_USER.Trim()
$password = [string]$config.HOSTALIA_PASSWORD
$port = 21
if ($config.PSObject.Properties.Name -contains 'HOSTALIA_PORT' -and $null -ne $config.HOSTALIA_PORT) {
    $port = [int]$config.HOSTALIA_PORT
}
$remoteBase = ([string]$config.HOSTALIA_REMOTE_PATH).Trim().Replace('\', '/')
if (-not $remoteBase.StartsWith('/')) { $remoteBase = '/' + $remoteBase.TrimStart('/') }
if ($remoteBase.Length -gt 1 -and $remoteBase.EndsWith('/')) { $remoteBase = $remoteBase.TrimEnd('/') }

function Format-WinScpRemoteArg([string]$PathForScript) {
    # Rutas absolutas entre comillas (List.Add evita el bug de @() + coma).
    return '"' + ($PathForScript.Replace('\', '/') -replace '"', '""') + '"'
}
function Format-WinScpLocalArg([string]$WinPath) {
    # No terminar en \ antes de la comilla: \" escapa el cierre en el parser de WinSCP.
    $p = $WinPath.Trim().TrimEnd('\')
    return '"' + ($p -replace '"', '""') + '"'
}

$encUser = [Uri]::EscapeDataString($userName)
$encPass = [Uri]::EscapeDataString($password)
$ftpSecureOpt = ''
if ($config.PSObject.Properties.Name -contains 'HOSTALIA_FTP_SECURE') {
    $ftpSecureOpt = [string]$config.HOSTALIA_FTP_SECURE.Trim().ToLowerInvariant()
}
$scheme = if ($protocol -eq 'sftp') { 'sftp' }
         elseif ($protocol -eq 'ftpes' -or ($protocol -eq 'ftp' -and $ftpSecureOpt -in @('explicit', 'explicitssl', 'tls'))) { 'ftpes' }
         else { 'ftp' }

$openLine = 'open ' + "${scheme}://${encUser}:${encPass}@${hostName}:${port}/"
if ($scheme -eq 'ftpes') { $openLine += ' -certificate=*' }

function Invoke-WinScpScript([string[]]$ScriptLines, [string]$Label) {
    $scriptPath = Join-Path $env:TEMP ('winscp-aray-' + [Guid]::NewGuid().ToString('N') + '.txt')
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    try {
        [System.IO.File]::WriteAllText($scriptPath, (($ScriptLines -join "`r`n") + "`r`n"), $utf8NoBom)
        Write-Log "WinSCP ($Label)..."
        & $winscp '/ini=nul' ("/log=$WinScpLog") ("/script=$scriptPath")
        if ($LASTEXITCODE -ne 0) {
            Write-Log "ERROR: WinSCP ($Label) codigo $LASTEXITCODE. Revisa $WinScpLog"
            exit $LASTEXITCODE
        }
    }
    finally {
        if (Test-Path -LiteralPath $scriptPath) {
            Remove-Item -LiteralPath $scriptPath -Force -ErrorAction SilentlyContinue
        }
    }
}

# Backup remoto si hay contenido
$probeLocal = Join-Path $BackupRoot ("probe-$ts")
New-Item -ItemType Directory -Path $probeLocal -Force | Out-Null
$probeWin = $probeLocal

# Importante: usar List.Add — en @() la coma tiene más precedencia que + y parte
# 'mkdir ' + '"..."' en dos líneas de script (mkdir vacío + ruta suelta).
$probeLines = [System.Collections.Generic.List[string]]::new()
$probeLines.Add('option batch continue')
$probeLines.Add('option confirm off')
$probeLines.Add('option transfer binary')
$probeLines.Add($openLine)
$probeLines.Add('mkdir ' + (Format-WinScpRemoteArg $remoteBase))
$probeLines.Add('cd ' + (Format-WinScpRemoteArg $remoteBase))
$probeLines.Add('lcd ' + (Format-WinScpLocalArg $probeWin))
$probeLines.Add('get -filemask="*|*/" *')
$probeLines.Add('exit')
Write-Log "Inspeccionando remoto $remoteBase ..."
Invoke-WinScpScript -ScriptLines $probeLines.ToArray() -Label 'probe'

$existing = @(Get-ChildItem -LiteralPath $probeLocal -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne '.' -and $_.Name -ne '..' })
if ($existing.Count -gt 0) {
    $backupLocal = Join-Path $BackupRoot ("aray_backup_$ts")
    New-Item -ItemType Directory -Path $backupLocal -Force | Out-Null
    $backupLocalWin = $backupLocal
    $remoteBackup = "/aray_backup_$ts"
    Write-Log "Backup: $remoteBase → local + $remoteBackup"
    $bakLines = [System.Collections.Generic.List[string]]::new()
    $bakLines.Add('option batch abort')
    $bakLines.Add('option confirm off')
    $bakLines.Add('option transfer binary')
    $bakLines.Add($openLine)
    $bakLines.Add('cd ' + (Format-WinScpRemoteArg $remoteBase))
    $bakLines.Add('lcd ' + (Format-WinScpLocalArg $backupLocalWin))
    $bakLines.Add('synchronize local ' + (Format-WinScpLocalArg $backupLocalWin) + ' ' + (Format-WinScpRemoteArg $remoteBase))
    $bakLines.Add('mkdir ' + (Format-WinScpRemoteArg $remoteBackup))
    $bakLines.Add('synchronize remote ' + (Format-WinScpLocalArg $backupLocalWin) + ' ' + (Format-WinScpRemoteArg $remoteBackup))
    $bakLines.Add('exit')
    Invoke-WinScpScript -ScriptLines $bakLines.ToArray() -Label 'backup'
} else {
    Write-Log "Remoto vacío o nuevo: $remoteBase"
    Remove-Item -LiteralPath $probeLocal -Recurse -Force -ErrorAction SilentlyContinue
}

$stageWin = $StageRoot
$putLines = [System.Collections.Generic.List[string]]::new()
$putLines.Add('option batch abort')
$putLines.Add('option confirm off')
$putLines.Add('option transfer binary')
$putLines.Add($openLine)
$segments = $remoteBase.TrimStart('/').Split('/')
$acc = ''
foreach ($seg in $segments) {
    if ($seg -eq '') { continue }
    $acc = if ($acc -eq '') { '/' + $seg } else { $acc + '/' + $seg }
    $putLines.Add('mkdir ' + (Format-WinScpRemoteArg $acc))
}
$putLines.Add('cd ' + (Format-WinScpRemoteArg $remoteBase))
$putLines.Add('synchronize remote ' + (Format-WinScpLocalArg $stageWin) + ' ' + (Format-WinScpRemoteArg $remoteBase))
$putLines.Add('exit')

Write-Log "Subiendo stage a $remoteBase ..."
Invoke-WinScpScript -ScriptLines $putLines.ToArray() -Label 'upload'

Write-Log 'Deploy ARAY completado.'
Write-Log "Comprobar: https://intocables13.com/aray/  y  https://intocables13.com/aray/api/v1/health.php"
exit 0
