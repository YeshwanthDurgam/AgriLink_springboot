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

function Invoke-Psql {
    param(
        [string]$Password,
        [string]$Connection,
        [string]$Sql,
        [switch]$Raw,
        [switch]$IgnoreExitCode
    )

    $out = docker run --rm -e PGPASSWORD=$Password postgres:17-alpine psql $Connection -t -A -c $Sql
    if (-not $IgnoreExitCode -and $LASTEXITCODE -ne 0) {
        throw "psql failed for SQL: $Sql"
    }

    if ($Raw) {
        return $out
    }

    return ((@($out) -join "`n").Trim())
}

$envPath = Join-Path (Get-Location) '.env'
$envMap = Get-EnvMap -Path $envPath

$neonHost = $envMap['NEON_HOST']
$neonUser = $envMap['NEON_USERNAME']
$neonPass = $envMap['NEON_PASSWORD']

if ([string]::IsNullOrWhiteSpace($neonHost) -or [string]::IsNullOrWhiteSpace($neonUser) -or [string]::IsNullOrWhiteSpace($neonPass)) {
    throw 'Missing NEON_HOST/NEON_USERNAME/NEON_PASSWORD in .env'
}

$pairs = @(
    @{ svc = 'auth'; schema = 'auth_schema'; db = 'agrilink_auth' },
    @{ svc = 'user'; schema = 'user_schema'; db = 'agrilink_user' },
    @{ svc = 'farm'; schema = 'farm_schema'; db = 'agrilink_farm' },
    @{ svc = 'marketplace'; schema = 'marketplace_schema'; db = 'agrilink_marketplace' },
    @{ svc = 'order'; schema = 'order_schema'; db = 'agrilink_order' }
)

$serviceCopyScript = 'set -e; pg_dump "$SRC" --data-only --no-owner --no-privileges ${TABLE_ARGS} > /tmp/data.sql; psql "$DST" -v ON_ERROR_STOP=1 -f /tmp/data.sql >/dev/null; echo copied'
$columnSafeCopyScript = 'set -e; printf "COPY (SELECT %s FROM %s.\"%s\") TO STDOUT WITH CSV;\n" "$COLS" "$SCHEMA" "$TABLE" > /tmp/export.sql; printf "COPY %s.\"%s\" (%s) FROM STDIN WITH CSV;\n" "$SCHEMA" "$TABLE" "$COLS" > /tmp/import.sql; psql "$SRC" -v ON_ERROR_STOP=1 -f /tmp/export.sql | psql "$DST" -v ON_ERROR_STOP=1 -f /tmp/import.sql; echo copied-safe'
$mismatches = @()

foreach ($p in $pairs) {
    $schema = $p.schema
    $srcConn = "postgresql://$neonUser@$neonHost/neondb?sslmode=require&channel_binding=require"
    $dstConn = "postgresql://$neonUser@$neonHost/$($p.db)?sslmode=require&channel_binding=require"

    Write-Output "=== sync:$($p.svc) ==="

    $sourceTablesRaw = Invoke-Psql -Password $neonPass -Connection $srcConn -Sql "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;" -Raw
    $targetTablesRaw = Invoke-Psql -Password $neonPass -Connection $dstConn -Sql "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;" -Raw

    $sourceTables = ((@($sourceTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    $targetTables = ((@($targetTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })

    $commonTables = @($targetTables | Where-Object { $sourceTables -contains $_ })
    $sourceOnlyTables = @($sourceTables | Where-Object { $targetTables -notcontains $_ })

    if ($sourceOnlyTables.Count -gt 0) {
        Write-Output "source-only tables for $($p.svc): $($sourceOnlyTables -join ', ')"
    }

    if ($targetTables.Count -gt 0) {
        $refs = @()
        foreach ($t in $targetTables) {
            $refs += "$schema.`"$t`""
        }

        $truncateSql = 'TRUNCATE TABLE ' + ($refs -join ', ') + ' CASCADE;'
        Invoke-Psql -Password $neonPass -Connection $dstConn -Sql $truncateSql | Out-Null
    }

    $tablesForDump = @()
    $fallbackTableColumns = @{}

    foreach ($t in $commonTables) {
        $srcColsText = Invoke-Psql -Password $neonPass -Connection $srcConn -Sql "SELECT column_name FROM information_schema.columns WHERE table_schema='$schema' AND table_name='$t' ORDER BY ordinal_position;"
        $dstColsText = Invoke-Psql -Password $neonPass -Connection $dstConn -Sql "SELECT column_name FROM information_schema.columns WHERE table_schema='$schema' AND table_name='$t' ORDER BY ordinal_position;"

        $srcCols = @(($srcColsText -split "`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
        $dstCols = @(($dstColsText -split "`n") | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })

        $srcSig = ($srcCols -join '|')
        $dstSig = ($dstCols -join '|')

        if ($srcSig -eq $dstSig) {
            $tablesForDump += $t
        } else {
            $commonCols = @($dstCols | Where-Object { $srcCols -contains $_ })
            if ($commonCols.Count -eq 0) {
                throw "No common columns for fallback copy: $($p.svc).$t"
            }

            $fallbackTableColumns[$t] = ($commonCols -join ',')
        }
    }

    if ($tablesForDump.Count -gt 0) {
        $tableArgs = ($tablesForDump | ForEach-Object { "--table=$schema.$_" }) -join ' '
        docker run --rm -e PGPASSWORD=$neonPass -e SRC=$srcConn -e DST=$dstConn -e TABLE_ARGS=$tableArgs postgres:17-alpine sh -lc $serviceCopyScript | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Service-level copy failed for $($p.svc)"
        }
    }

    foreach ($entry in $fallbackTableColumns.GetEnumerator()) {
        $tableName = [string]$entry.Key
        $colSql = [string]$entry.Value

        docker run --rm -e PGPASSWORD=$neonPass -e SRC=$srcConn -e DST=$dstConn -e SCHEMA=$schema -e TABLE=$tableName -e COLS=$colSql postgres:17-alpine sh -lc $columnSafeCopyScript | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Column-safe fallback copy failed for $($p.svc).$tableName"
        }
    }

    foreach ($t in $commonTables) {
        $srcCount = Invoke-Psql -Password $neonPass -Connection $srcConn -Sql "SELECT count(*) FROM $schema.`"$t`";"
        $dstCount = Invoke-Psql -Password $neonPass -Connection $dstConn -Sql "SELECT count(*) FROM $schema.`"$t`";"
        if ($srcCount -ne $dstCount) {
            $mismatches += "$($p.svc):$t source=$srcCount target=$dstCount"
        }
    }
}

if ($mismatches.Count -gt 0) {
    Write-Output '=== mismatch report ==='
    $mismatches | ForEach-Object { Write-Output $_ }
    throw 'Row count mismatches found after sync.'
}

Write-Output 'SYNC_OK'