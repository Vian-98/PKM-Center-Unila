param (
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("export", "import")]
    [string]$Action,

    [Parameter(Mandatory=$true, Position=1)]
    [string]$TargetFile
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnginePath = Join-Path $ScriptDir "9router-db-engine.mjs"
$ContainerName = "pkm_9router"

# Check if Docker container is running
$dockerRunning = $false
try {
    $runningContainers = docker ps --format '{{.Names}}' 2>$null
    if ($runningContainers -match "^$ContainerName$") {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "[9router-db] Terdeteksi container Docker aktif: $ContainerName" -ForegroundColor Cyan
    if ($Action -eq "export") {
        Write-Host "[9router-db] Mengekspor database dari container..." -ForegroundColor Yellow
        Get-Content $EnginePath -Raw | docker exec -i $ContainerName node --input-type=module - export /root/.9router/db/data.sqlite /tmp/9r-export.json
        docker cp "${ContainerName}:/tmp/9r-export.json" $TargetFile
        Write-Host "[9router-db] Selesai! File backup tersimpan di: $TargetFile" -ForegroundColor Green
    } elseif ($Action -eq "import") {
        if (-not (Test-Path $TargetFile)) {
            Write-Error "[9router-db] File $TargetFile tidak ditemukan!"
            exit 1
        }
        Write-Host "[9router-db] Mengunggah $TargetFile ke container..." -ForegroundColor Yellow
        docker cp $TargetFile "${ContainerName}:/tmp/9r-import.json"
        Get-Content $EnginePath -Raw | docker exec -i $ContainerName node --input-type=module - import /root/.9router/db/data.sqlite /tmp/9r-import.json
        Write-Host "[9router-db] Me-restart container 9router untuk memuat data baru..." -ForegroundColor Yellow
        docker restart $ContainerName
        Write-Host "[9router-db] Selesai! Database 9router berhasil diimpor." -ForegroundColor Green
    }
} else {
    $dataDir = if ($env:DATA_DIR) { $env:DATA_DIR } else { Join-Path $env:USERPROFILE ".9router" }
    $dbPath = Join-Path $dataDir "db\data.sqlite"
    if (-not (Test-Path $dbPath)) {
        Write-Error "[9router-db] Error: Database SQLite tidak ditemukan di $dbPath dan container $ContainerName tidak berjalan."
        exit 1
    }
    node $EnginePath $Action $dbPath $TargetFile
}
