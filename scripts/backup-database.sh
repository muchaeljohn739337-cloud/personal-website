#!/bin/bash

# Database Backup Script
# Automates database backups for PostgreSQL/Supabase

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE_URL="${DATABASE_URL:-}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database

echo "🔄 Starting database backup..."

# Use pg_dump for PostgreSQL
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

if command -v pg_dump &> /dev/null; then
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "⚠️  pg_dump not found, using alternative method..."
  # Alternative: Use Prisma to export
  echo "Run: npx prisma db pull --print > $BACKUP_FILE"
fi

# Compress backup
if command -v gzip &> /dev/null; then
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"
  echo "✅ Backup compressed: $BACKUP_FILE"
fi

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.sql*" -mtime +30 -delete

echo "✅ Backup complete: $BACKUP_FILE"
echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

