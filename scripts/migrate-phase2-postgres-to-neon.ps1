$ErrorActionPreference = 'Stop'

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path 'migration-backups' "phase2-$timestamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

$sourceContainer = 'agrilink-postgres'
$sourceUser = 'agrilink'

$migrations = @(
    @{ name = 'auth'; sourceDb = 'agrilink_auth'; targetHost = 'ep-gentle-king-antjmcii-pooler.c-6.us-east-1.aws.neon.tech'; targetPassword = 'REPLACE_ME'; targetSchema = 'auth_schema' },
    @{ name = 'user'; sourceDb = 'agrilink_user'; targetHost = 'ep-purple-pine-ami9rw61-pooler.c-5.us-east-1.aws.neon.tech'; targetPassword = 'REPLACE_ME'; targetSchema = 'user_schema' },
    @{ name = 'farm'; sourceDb = 'agrilink_farm'; targetHost = 'ep-still-queen-ann6mny8-pooler.c-6.us-east-1.aws.neon.tech'; targetPassword = 'REPLACE_ME'; targetSchema = 'farm_schema' },
    @{ name = 'marketplace'; sourceDb = 'agrilink_marketplace'; targetHost = 'ep-shiny-shape-an60flkr-pooler.c-6.us-east-1.aws.neon.tech'; targetPassword = 'REPLACE_ME'; targetSchema = 'marketplace_schema' },
    @{ name = 'order'; sourceDb = 'agrilink_order'; targetHost = 'ep-gentle-king-antjmcii-pooler.c-6.us-east-1.aws.neon.tech'; targetPassword = 'REPLACE_ME'; targetSchema = 'order_schema' }
)

foreach ($m in $migrations) {
    if ($m.targetPassword -eq 'REPLACE_ME') {
        throw "Set targetPassword for service '$($m.name)' before running this script."
    }
}

foreach ($m in $migrations) {
    Write-Host "=== Migrating $($m.name) ==="

    $rawPath = Join-Path $backupRoot "$($m.sourceDb)-raw.sql"
    $mappedPath = Join-Path $backupRoot "$($m.sourceDb)-$($m.targetSchema).sql"

    docker exec $sourceContainer pg_dump -U $sourceUser -d $($m.sourceDb) --no-owner --no-privileges --schema=public > $rawPath

    $raw = Get-Content -Raw $rawPath
    $mapped = "CREATE SCHEMA IF NOT EXISTS $($m.targetSchema);`n" + ($raw \
        -replace 'SET search_path = public, pg_catalog;', "SET search_path = $($m.targetSchema), pg_catalog;" \
        -replace '\bpublic\.', "$($m.targetSchema).")

    # Keep pg_trgm operator classes in public namespace (Neon extension namespace).
    $mapped = $mapped -replace "$($m.targetSchema)\.gin_trgm_ops", 'public.gin_trgm_ops'
    $mapped = $mapped -replace "$($m.targetSchema)\.gist_trgm_ops", 'public.gist_trgm_ops'

    Set-Content -Path $mappedPath -Value $mapped -NoNewline

    $conn = "postgresql://neondb_owner:$($m.targetPassword)@$($m.targetHost)/neondb?sslmode=require`&channel_binding=require"

    docker run --rm postgres:15-alpine psql "$conn" -c "CREATE SCHEMA IF NOT EXISTS $($m.targetSchema);" | Out-Null

    if ($m.name -eq 'marketplace') {
        docker run --rm postgres:15-alpine psql "$conn" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;" | Out-Null
    }

    Get-Content -Raw $mappedPath | docker run --rm -i postgres:15-alpine psql "$conn" | Out-Null

    $sourceRows = (docker exec $sourceContainer psql -U $sourceUser -d $($m.sourceDb) -t -A -c "SELECT COALESCE(SUM(n_live_tup),0) FROM pg_stat_user_tables;").Trim()
    $targetRows = (docker run --rm postgres:15-alpine psql "$conn" -t -A -c "SELECT COALESCE(SUM(n_live_tup),0) FROM pg_stat_user_tables WHERE schemaname='$($m.targetSchema)';").Trim()

    Write-Host "rows source=$sourceRows target=$targetRows"
}

Write-Host "Migration finished. SQL dumps are in $backupRoot"
