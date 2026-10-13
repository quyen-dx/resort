# ==============================================================================
# SCRIPT SAO LƯU CƠ SỞ DỮ LIỆU TỰ ĐỘNG (REL-01)
# Hệ sinh thái: Resort Management & Operations Ecosystem
# ==============================================================================

param(
    [string]$BackupDir = "backups",
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"

if (-not $DatabaseUrl) {
    $DatabaseUrl = "postgresql://postgres:postgres@localhost:5432/resort_db"
}

# Tạo thư mục lưu backup nếu chưa tồn tại
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFileName = "resort_backup_$Timestamp.sql"
$BackupFilePath = Join-Path -Path $BackupDir -ChildPath $BackupFileName

Write-Host "--- Bắt đầu quy trình sao lưu cơ sở dữ liệu (REL-01) ---" -ForegroundColor Cyan
Write-Host "Thời gian: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "File đích: $BackupFilePath"

# Thực hiện lệnh pg_dump (nếu có pg_dump cục bộ hoặc docker container)
try {
    # Kiểm tra Docker container postgres đang chạy
    $DockerRunning = docker ps --filter "name=resort_postgres" --format "{{.Names}}" 2>$null
    if ($DockerRunning -eq "resort_postgres") {
        Write-Host "Phát hiện Docker container resort_postgres đang chạy. Thực hiện dump từ container..." -ForegroundColor Yellow
        docker exec -t resort_postgres pg_dump -U postgres -d resort_db > $BackupFilePath
    } else {
        Write-Host "Thực hiện pg_dump trực tiếp..." -ForegroundColor Yellow
        pg_dump $DatabaseUrl -f $BackupFilePath
    }

    $FileSize = (Get-Item $BackupFilePath).Length
    $FileHash = (Get-FileHash -Path $BackupFilePath -Algorithm SHA256).Hash

    Write-Host "✓ Sao lưu thành công!" -ForegroundColor Green
    Write-Host "Dung lượng file: $FileSize bytes"
    Write-Host "SHA256 Checksum: $FileHash"
    
    # Ghi lại metadata vào file log
    $MetaContent = "Timestamp: $Timestamp`nFile: $BackupFileName`nSize: $FileSize`nSHA256: $FileHash"
    Set-Content -Path (Join-Path -Path $BackupDir -ChildPath "latest_backup_meta.txt") -Value $MetaContent
}
catch {
    Write-Host "⚠️ Lỗi trong quá trình sao lưu: $_" -ForegroundColor Red
    exit 1
}
