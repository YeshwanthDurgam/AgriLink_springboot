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
    @{ svc = 'auth'; schema = 'auth_schema'; db = 'agrilink_auth' },
    @{ svc = 'user'; schema = 'user_schema'; db = 'agrilink_user' },
    @{ svc = 'farm'; schema = 'farm_schema'; db = 'agrilink_farm' },
    @{ svc = 'marketplace'; schema = 'marketplace_schema'; db = 'agrilink_marketplace' },
    @{ svc = 'order'; schema = 'order_schema'; db = 'agrilink_order' }
)

$allOk = $true

foreach ($p in $pairs) {
    $schema = $p.schema
    $srcConn = "postgresql://$neonUser@$neonHost/neondb?sslmode=require&channel_binding=require"
    $dstConn = "postgresql://$neonUser@$neonHost/$($p.db)?sslmode=require&channel_binding=require"

    $srcTablesRaw = docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$srcConn" -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;"
    $dstTablesRaw = docker run --rm -e PGPASSWORD=$neonPass postgres:17-alpine psql "$dstConn" -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname='$schema' ORDER BY tablename;"

    $srcTables = ((@($srcTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })
    $dstTables = ((@($dstTablesRaw) -join "`n") -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' })

    if (($srcTables -join '|') -ne ($dstTables -join '|')) {
        Write-Output "TABLE_MISMATCH|$($p.svc)|src=$($srcTables.Count)|dst=$($dstTables.Count)"
        $allOk = $false
        continue
    }

    $svcRowsSource = 0
    $svcRowsTarget = 0

    foreach ($t in $srcTables) {
        $srcCount = [int64](Invoke-PsqlScalar -Password $neonPass -Connection $srcConn -Sql "SELECT count(*) FROM $schema.`"$t`";")
        $dstCount = [int64](Invoke-PsqlScalar -Password $neonPass -Connection $dstConn -Sql "SELECT count(*) FROM $schema.`"$t`";")

        $svcRowsSource += $srcCount
        $svcRowsTarget += $dstCount

        if ($srcCount -ne $dstCount) {
            Write-Output "ROW_MISMATCH|$($p.svc)|$t|src=$srcCount|dst=$dstCount"
            $allOk = $false
        }
    }

    Write-Output "PARITY|$($p.svc)|tables=$($srcTables.Count)|src_rows=$svcRowsSource|dst_rows=$svcRowsTarget"
}

if ($allOk) {
    Write-Output 'PARITY_ALL_OK'
} else {
    exit 1
}
