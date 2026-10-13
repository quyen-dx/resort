# ==============================================================================
# SCRIPT KHÔI PHỤC CƠ SỞ DỮ LIỆU TỪ BẢN SAO LƯU (REL-02)
# ==============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupFile)) {
    Write-Host "Lỗi: Không tìm thấy file backup tại: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️ CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu trong resort_db!" -ForegroundColor Yellow
if (-not $Force) {
    $Confirm = Read-Host "Bạn có chắc chắn muốn khôi phục không? (Nhập 'YES' để xác nhận)"
    if ($Confirm -ne "YES") {
        Write-Host "Đã hủy thao tác khôi phục." -ForegroundColor Gray
        exit 0
    }
}

Write-Host "--- Bắt đầu phục hồi cơ sở dữ liệu từ $BackupFile (REL-02) ---" -ForegroundColor Cyan

try {
    $DockerRunning = docker ps --filter "name=resort_postgres" --format "{{.Names}}" 2>$null
    if ($DockerRunning -eq "resort_postgres") {
        Write-Host "Thực hiện khôi phục qua Docker container resort_postgres..." -ForegroundColor Yellow
        Get-Content $BackupFile | docker exec -i resort_postgres psql -U postgres -d resort_db
    } else {
        Write-Host "Thực hiện khôi phục qua psql..." -ForegroundColor Yellow
        psql $env:DATABASE_URL -f $BackupFile
    }

    Write-Host "✓ Phục hồi dữ liệu thành công!" -ForegroundColor Green
}
catch {
    Write-Host "Lỗi phục hồi dữ liệu: $_" -ForegroundColor Red
    exit 1
}
