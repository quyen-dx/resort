#!/usr/bin/env bash
# ==============================================================================
# DATABASE RESTORE SCRIPT (REL-02)
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
FORCE="${2:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "Lỗi: Vui lòng truyền đường dẫn file backup hợp lệ. Ví dụ: ./scripts/restore-db.sh backups/resort_backup_xyz.sql.gz"
    exit 1
fi

echo "⚠️ CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại trong cơ sở dữ liệu resort_db!"

if [ "$FORCE" != "--force" ]; then
    read -p "Bạn có chắc chắn muốn khôi phục không? (Nhập 'YES' để xác nhận): " CONFIRM
    if [ "$CONFIRM" != "YES" ]; then
        echo "Đã hủy thao tác khôi phục."
        exit 0
    fi
fi

echo "--- Bắt đầu phục hồi dữ liệu từ $BACKUP_FILE ---"

if docker ps --format '{{.Names}}' | grep -q "resort_postgres"; then
    echo "Khôi phục qua Docker container..."
    gunzip -c "$BACKUP_FILE" | docker exec -i resort_postgres psql -U postgres -d resort_db
else
    echo "Khôi phục qua psql..."
    gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/resort_db}"
fi

echo "✓ Phục hồi dữ liệu thành công!"
