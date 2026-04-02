$ErrorActionPreference = 'Stop'

function Get-EnvMap {
    param([string]$Path)

    $result = @{}
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
            $result[$matches[1].Trim()] = $matches[2].Trim()
        }
    }

    return $result
}

function Invoke-PsqlScalar {
    param(
        [string]$Connection,
        [string]$Sql
    )

    $out = docker run --rm -e PGPASSWORD=$script:neonPass postgres:17-alpine psql "$Connection" -t -A -c $Sql
    if ($LASTEXITCODE -ne 0) {
        throw "psql failed: $Sql"
    }

    return ((@($out) -join "`n").Trim())
}

$envMap = Get-EnvMap -Path '.env'
$neonHost = $envMap['NEON_HOST']
$neonUser = $envMap['NEON_USERNAME']
$neonPass = $envMap['NEON_PASSWORD']

if ([string]::IsNullOrWhiteSpace($neonHost) -or [string]::IsNullOrWhiteSpace($neonUser) -or [string]::IsNullOrWhiteSpace($neonPass)) {
    throw 'Missing NEON_HOST/NEON_USERNAME/NEON_PASSWORD in .env'
}

$schemas = @('auth_schema', 'user_schema', 'farm_schema', 'marketplace_schema', 'order_schema')
$schemaListSql = ($schemas | ForEach-Object { "'$_'" }) -join ','
$neonConn = "postgresql://$neonUser@$neonHost/neondb?sslmode=require&channel_binding=require"

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path (Get-Location) "migration-backups/pre-clean-neondb-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$resolvedBackupDir = (Resolve-Path $backupDir).Path

Write-Output "BACKUP_DIR=$resolvedBackupDir"

Write-Output '=== precheck: table counts in neondb ==='
foreach ($schema in $schemas) {
    $count = Invoke-PsqlScalar -Connection $neonConn -Sql "SELECT count(*) FROM pg_tables WHERE schemaname='$schema';"
    Write-Output "$schema|tables=$count"
}

Write-Output '=== backup: exporting schemas from neondb ==='
foreach ($schema in $schemas) {
    $outFile = Join-Path $resolvedBackupDir "$schema.sql"
    $linuxPath = '/work/' + [IO.Path]::GetFileName($outFile)

    docker run --rm -e PGPASSWORD=$neonPass -v "${resolvedBackupDir}:/work" postgres:17-alpine sh -lc "pg_dump '$neonConn' --schema='$schema' --no-owner --no-privileges > '$linuxPath'"
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed for schema $schema"
    }

    $fileInfo = Get-Item $outFile
    if ($fileInfo.Length -le 0) {
        throw "Backup file is empty for schema $schema"
    }

    Write-Output "$schema|backup_bytes=$($fileInfo.Length)"
}

Write-Output '=== cleanup: dropping legacy schemas from neondb ==='
foreach ($schema in $schemas) {
    docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$neonConn" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS $schema CASCADE;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to drop schema $schema"
    }
    Write-Output "$schema|dropped"
}

Write-Output '=== postcheck: remaining schemas in neondb ==='
$remaining = Invoke-PsqlScalar -Connection $neonConn -Sql "SELECT count(*) FROM information_schema.schemata WHERE schema_name IN ($schemaListSql);"
Write-Output "remaining_service_schemas=$remaining"
if ($remaining -ne '0') {
    throw 'Schema cleanup incomplete in neondb.'
}

Write-Output 'CLEANUP_OK'
