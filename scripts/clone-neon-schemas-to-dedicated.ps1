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
        [string]$Password,
        [string]$Connection,
        [string]$Sql
    )

    $out = docker run --rm -e PGPASSWORD=$Password postgres:17-alpine psql "$Connection" -t -A -c $Sql
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

$pairs = @(
    @{ svc = 'auth'; schema = 'auth_schema'; db = 'agrilink_auth'; needsTrgm = $false },
    @{ svc = 'user'; schema = 'user_schema'; db = 'agrilink_user'; needsTrgm = $false },
    @{ svc = 'farm'; schema = 'farm_schema'; db = 'agrilink_farm'; needsTrgm = $false },
    @{ svc = 'marketplace'; schema = 'marketplace_schema'; db = 'agrilink_marketplace'; needsTrgm = $true },
    @{ svc = 'order'; schema = 'order_schema'; db = 'agrilink_order'; needsTrgm = $false }
)

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$workDir = Join-Path (Get-Location) "migration-backups/live-clone-$timestamp"
New-Item -ItemType Directory -Force -Path $workDir | Out-Null
$resolvedWorkDir = (Resolve-Path $workDir).Path

foreach ($p in $pairs) {
    Write-Output "=== clone:$($p.svc) ==="

    $schema = $p.schema
    $srcConn = "postgresql://$neonUser@$neonHost/neondb?sslmode=require&channel_binding=require"
    $dstConn = "postgresql://$neonUser@$neonHost/$($p.db)?sslmode=require&channel_binding=require"

    # Ensure common extension functions/operator classes exist before restore.
    $extFile = Join-Path $resolvedWorkDir "$($p.svc)-extensions.sql"
    $extSql = @(
        'CREATE SCHEMA IF NOT EXISTS public;',
        'CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;',
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;'
    )
    if ($p.needsTrgm) {
        $extSql += 'CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;'
    }
    [System.IO.File]::WriteAllLines($extFile, $extSql)

    $linuxExtPath = '/work/' + [IO.Path]::GetFileName($extFile)
    docker run --rm -e PGPASSWORD=$neonPass -v "${resolvedWorkDir}:/work" postgres:17-alpine psql "$dstConn" -v ON_ERROR_STOP=1 -f $linuxExtPath | Out-Null

    # Replace target schema with exact clone from source schema.
    docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$dstConn" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS $schema CASCADE;" | Out-Null

    $sqlFile = Join-Path $resolvedWorkDir "$($p.svc)-$schema.sql"
    $linuxSqlPath = '/work/' + [IO.Path]::GetFileName($sqlFile)

    docker run --rm -e PGPASSWORD=$neonPass -v "${resolvedWorkDir}:/work" postgres:17-alpine sh -lc "pg_dump '$srcConn' --schema='$schema' --no-owner --no-privileges > '$linuxSqlPath'"
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed for $($p.svc)"
    }

    if ($p.needsTrgm) {
        $dumpText = [System.IO.File]::ReadAllText($sqlFile)
        $dumpText = $dumpText.Replace($schema + '.gin_trgm_ops', 'public.gin_trgm_ops')
        $dumpText = $dumpText.Replace($schema + '.gist_trgm_ops', 'public.gist_trgm_ops')
        [System.IO.File]::WriteAllText($sqlFile, $dumpText)
    }

    docker run --rm -e PGPASSWORD=$neonPass -v "${resolvedWorkDir}:/work" postgres:17-alpine psql "$dstConn" -v ON_ERROR_STOP=1 -f $linuxSqlPath | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "restore failed for $($p.svc)"
    }

    # Exact table parity check.
    $srcTablesRaw = docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$srcConn" -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;"
    $dstTablesRaw = docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$dstConn" -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;"
    if ($LASTEXITCODE -ne 0) {
        throw "table list check failed for $($p.svc)"
    }

    $srcTables = ((@($srcTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    $dstTables = ((@($dstTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })

    $srcJoined = $srcTables -join '|'
    $dstJoined = $dstTables -join '|'
    if ($srcJoined -ne $dstJoined) {
        throw "table parity mismatch for $($p.svc)"
    }

    foreach ($t in $srcTables) {
        $srcCount = Invoke-PsqlScalar -Password $neonPass -Connection $srcConn -Sql "SELECT count(*) FROM $schema.`"$t`";"
        $dstCount = Invoke-PsqlScalar -Password $neonPass -Connection $dstConn -Sql "SELECT count(*) FROM $schema.`"$t`";"
        if ($srcCount -ne $dstCount) {
            throw "row parity mismatch for $($p.svc).$t (src=$srcCount dst=$dstCount)"
        }
    }

    Write-Output "ok:$($p.svc) tables=$($srcTables.Count)"
}

Write-Output "CLONE_OK artifacts=$resolvedWorkDir"