#!/usr/bin/env bash
# ==============================================================================
# AUTOMATED DATABASE BACKUP SCRIPT (REL-01)
# Resort Management & Operations Ecosystem
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-backups}"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/resort_db}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/resort_backup_${TIMESTAMP}.sql.gz"

echo "--- Bắt đầu quy trình sao lưu cơ sở dữ liệu (REL-01) ---"
echo "Thời gian: $(date)"
echo "File đích: $BACKUP_FILE"

# Dump and compress via gzip
if docker ps --format '{{.Names}}' | grep -q "resort_postgres"; then
    echo "Phát hiện Docker container resort_postgres đang chạy. Thực hiện dump từ container..."
    docker exec -t resort_postgres pg_dump -U postgres -d resort_db | gzip > "$BACKUP_FILE"
else
    echo "Thực hiện pg_dump trực tiếp..."
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
fi

FILE_SIZE=$(wc -c < "$BACKUP_FILE")
CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')

echo "✓ Sao lưu thành công!"
echo "Dung lượng: $FILE_SIZE bytes"
echo "SHA256 Checksum: $CHECKSUM"

# Lưu metadata file
cat <<EOF > "$BACKUP_DIR/latest_backup_meta.txt"
Timestamp: $TIMESTAMP
File: $(basename "$BACKUP_FILE")
Size: $FILE_SIZE
SHA256: $CHECKSUM
EOF
