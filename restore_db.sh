#!/bin/bash

# Zeitdreher Database Restore Script
# This script restores a Supabase database from a backup file

# Display usage information
show_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -f, --file FILENAME    Specify backup file to restore (required unless using --latest)"
  echo "  -l, --latest          Automatically use the most recent backup file"
  echo "  -h, --help            Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --file backup_20240620_120000.sql    # Restore from specific backup"
  echo "  $0 --latest                            # Restore from most recent backup"
}

# Parse command line arguments
FILE=""
USE_LATEST=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--file)
      FILE="$2"
      shift 2
      ;;
    -l|--latest)
      USE_LATEST=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option $1"
      show_usage
      exit 1
      ;;
  esac
done

# Check if Supabase CLI is installed
if ! command -v npx supabase &> /dev/null; then
  echo "Error: Supabase CLI not found. Make sure it's installed."
  exit 1
fi

# If --latest flag is used, find the most recent backup file
if [ "$USE_LATEST" = true ]; then
  # Look for backup files with pattern backup_YYYYMMDD_HHMMSS.sql
  LATEST_BACKUP=$(ls -t backup_*.sql 2>/dev/null | head -n 1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo "Error: No backup files found matching pattern 'backup_*.sql'"
    exit 1
  fi
  
  FILE="$LATEST_BACKUP"
  echo "Using latest backup file: $FILE"
fi

# Check if file parameter is provided
if [ -z "$FILE" ]; then
  echo "Error: No backup file specified. Use --file option or --latest."
  show_usage
  exit 1
fi

# Check if the backup file exists
if [ ! -f "$FILE" ]; then
  echo "Error: Backup file '$FILE' not found."
  exit 1
fi

# Confirm before proceeding
echo "WARNING: This will overwrite your current database with the backup from '$FILE'."
echo "All current data will be lost and replaced with the data from the backup."
read -p "Are you sure you want to proceed? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

# Perform the restore
echo "Restoring database from '$FILE'..."
echo "This may take a while depending on the size of your backup."

# Execute the restore command
npx supabase db reset --db-url "${SUPABASE_URL}" --password "${SUPABASE_SERVICE_KEY}" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Error: Failed to reset the database. Check your credentials and try again."
  exit 1
fi

# Import the backup file
cat "$FILE" | npx supabase db execute --db-url "${SUPABASE_URL}" --password "${SUPABASE_SERVICE_KEY}"

if [ $? -ne 0 ]; then
  echo "Error: Failed to restore from backup. The database may be in an inconsistent state."
  exit 1
fi

echo "Database successfully restored from '$FILE'."
echo "Note: You may need to restart your application for changes to take effect."
