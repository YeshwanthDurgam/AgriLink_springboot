param(
    [string]$SourceContainer = 'agrilink-postgres',
    [string]$SourceDatabase = 'agrilink_notification',
    [string]$SourceSchema = 'public',
    [string]$SourceUser = 'agrilink',
    [string]$TargetMongoUri = $env:NOTIFICATION_MONGODB_URI,
    [string]$TargetMongoDatabase = $env:NOTIFICATION_MONGODB_DATABASE,
    [switch]$DryRun,
    [switch]$ClearTargetCollections,
    [string]$OutputDir
)

  $ErrorActionPreference = 'Stop'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

if ([string]::IsNullOrWhiteSpace($TargetMongoUri)) {
    $TargetMongoUri = 'mongodb://localhost:27017/agrilink_notification'
}

if ([string]::IsNullOrWhiteSpace($TargetMongoDatabase)) {
    $TargetMongoDatabase = 'agrilink_notification'
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutputDir = Join-Path 'migration-backups' "phase3-notification-$timestamp"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$resolvedOutputDir = (Resolve-Path $OutputDir).Path

function Invoke-PostgresQuery {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Query
    )

    $result = & docker exec $SourceContainer psql -U $SourceUser -d $SourceDatabase -t -A -c $Query
    if ($LASTEXITCODE -ne 0) {
        throw "Failed PostgreSQL query against '$SourceDatabase'."
    }

    return $result
}

function Get-SourceCount {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TableName
    )

    $countText = Invoke-PostgresQuery -Query "SELECT COUNT(*) FROM $SourceSchema.$TableName;"
    return [int]($countText.Trim())
}

function Export-JsonLines {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Query,
        [Parameter(Mandatory = $true)]
        [string]$FilePath
    )

    $rows = Invoke-PostgresQuery -Query $Query

    if ($rows -is [string]) {
        if ([string]::IsNullOrWhiteSpace($rows)) {
          [System.IO.File]::WriteAllText($FilePath, '', $utf8NoBom)
            return 0
        }

        $rows = @($rows)
    }

    if ($null -eq $rows -or $rows.Count -eq 0) {
      [System.IO.File]::WriteAllText($FilePath, '', $utf8NoBom)
        return 0
    }

    [System.IO.File]::WriteAllLines($FilePath, $rows, $utf8NoBom)
    return $rows.Count
}

$tables = @(
    @{
        Table = 'notifications';
        Collection = 'notifications';
        UuidFields = @('userId');
        DateFields = @('readAt', 'sentAt', 'failedAt', 'createdAt', 'updatedAt');
        Query = @"
SELECT row_to_json(t)::text
FROM (
    SELECT
        id::text AS id,
        user_id::text AS "userId",
        notification_type AS "notificationType",
        channel AS channel,
        title AS title,
        message AS message,
        recipient_email AS "recipientEmail",
        recipient_phone AS "recipientPhone",
        data AS data,
        status AS status,
        read AS read,
        read_at AS "readAt",
        sent_at AS "sentAt",
        failed_at AS "failedAt",
        failure_reason AS "failureReason",
        retry_count AS "retryCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    FROM $SourceSchema.notifications
    ORDER BY created_at, id
) t;
"@
    },
    @{
        Table = 'notification_templates';
        Collection = 'notification_templates';
        UuidFields = @();
        DateFields = @('createdAt', 'updatedAt');
        Query = @"
SELECT row_to_json(t)::text
FROM (
    SELECT
        id::text AS id,
        template_code AS "templateCode",
        notification_type AS "notificationType",
        channel AS channel,
        title_template AS "titleTemplate",
        body_template AS "bodyTemplate",
        description AS description,
        active AS active,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    FROM $SourceSchema.notification_templates
    ORDER BY created_at, id
) t;
"@
    },
    @{
        Table = 'notification_preferences';
        Collection = 'notification_preferences';
        UuidFields = @('userId');
        DateFields = @('createdAt', 'updatedAt');
        Query = @"
SELECT row_to_json(t)::text
FROM (
    SELECT
        id::text AS id,
        user_id::text AS "userId",
        email_enabled AS "emailEnabled",
        sms_enabled AS "smsEnabled",
        push_enabled AS "pushEnabled",
        order_updates AS "orderUpdates",
        listing_updates AS "listingUpdates",
        price_alerts AS "priceAlerts",
        weather_alerts AS "weatherAlerts",
        iot_alerts AS "iotAlerts",
        marketing AS marketing,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    FROM $SourceSchema.notification_preferences
    ORDER BY created_at, id
) t;
"@
    },
    @{
        Table = 'conversations';
        Collection = 'conversations';
        UuidFields = @('participant1Id', 'participant2Id', 'listingId');
        DateFields = @('lastMessageAt', 'createdAt', 'updatedAt');
        Query = @"
SELECT row_to_json(t)::text
FROM (
    SELECT
        id::text AS id,
        participant1_id::text AS "participant1Id",
        participant2_id::text AS "participant2Id",
        listing_id::text AS "listingId",
        listing_title AS "listingTitle",
        last_message_at AS "lastMessageAt",
        last_message_preview AS "lastMessagePreview",
        participant1_unread_count AS "participant1UnreadCount",
        participant2_unread_count AS "participant2UnreadCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    FROM $SourceSchema.conversations
    ORDER BY created_at, id
) t;
"@
    },
    @{
        Table = 'messages';
        Collection = 'messages';
        UuidFields = @('conversationId', 'senderId', 'recipientId');
        DateFields = @('readAt', 'createdAt');
        Query = @"
SELECT row_to_json(t)::text
FROM (
    SELECT
        id::text AS id,
        conversation_id::text AS "conversationId",
        sender_id::text AS "senderId",
        recipient_id::text AS "recipientId",
        content AS content,
        message_type AS "messageType",
        is_read AS "isRead",
        read_at AS "readAt",
        created_at AS "createdAt"
    FROM $SourceSchema.messages
    ORDER BY created_at, id
) t;
"@
    }
)

$sourceCountSummary = @()

foreach ($table in $tables) {
    $sourceCount = Get-SourceCount -TableName $table.Table
    $jsonPath = Join-Path $resolvedOutputDir "$($table.Table).jsonl"
    $exportedRows = Export-JsonLines -Query $table.Query -FilePath $jsonPath

    $sourceCountSummary += [pscustomobject]@{
        table = $table.Table
        sourceCount = $sourceCount
        exportedRows = $exportedRows
    }

    Write-Host "exported $($table.Table): source=$sourceCount exported=$exportedRows"
}

$mappingsForImporter = $tables | ForEach-Object {
    [ordered]@{
        collection = $_.Collection
        file = "$($_.Table).jsonl"
        uuidFields = $_.UuidFields
        dateFields = $_.DateFields
    }
}

$mappingsJson = $mappingsForImporter | ConvertTo-Json -Depth 6
$importMode = if ($DryRun) { 'dry-run' } elseif ($ClearTargetCollections) { 'clear-upsert' } else { 'upsert' }
$dockerMongoUri = $TargetMongoUri -replace 'localhost', 'host.docker.internal' -replace '127\.0\.0\.1', 'host.docker.internal'

$importScriptPath = Join-Path $resolvedOutputDir 'import-notification.js'
$importScript = @"
const fs = require('fs');
const path = require('path');

const targetDbName = process.env.TARGET_DB || 'agrilink_notification';
const mode = process.env.IMPORT_MODE || 'upsert';
const mappings = $mappingsJson;

function parseDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const normalized = String(value).replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toUuid(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  try {
    return UUID(String(value));
  } catch (error) {
    return String(value);
  }
}

function chunk(array, size) {
  const parts = [];
  for (let index = 0; index < array.length; index += size) {
    parts.push(array.slice(index, index + size));
  }
  return parts;
}

const dbHandle = db.getSiblingDB(targetDbName);
const summary = [];

for (const mapping of mappings) {
  const collection = dbHandle.getCollection(mapping.collection);
  const filePath = path.join('/work', mapping.file);
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const documents = lines.map((line) => JSON.parse(line));

  for (const doc of documents) {
    if (Object.prototype.hasOwnProperty.call(doc, 'id')) {
      doc._id = toUuid(doc.id);
      delete doc.id;
    }

    for (const field of mapping.uuidFields) {
      doc[field] = toUuid(doc[field]);
    }

    for (const field of mapping.dateFields) {
      doc[field] = parseDate(doc[field]);
    }
  }

  if (mode === 'clear-upsert') {
    collection.deleteMany({});
  }

  if (mode !== 'dry-run' && documents.length > 0) {
    const batches = chunk(documents, 500);
    for (const batch of batches) {
      const operations = batch.map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));

      collection.bulkWrite(operations, { ordered: false });
    }
  }

  summary.push({
    collection: mapping.collection,
    sourceCount: documents.length,
    targetCount: collection.countDocuments({}),
    mode
  });
}

print(JSON.stringify(summary, null, 2));
"@

[System.IO.File]::WriteAllText($importScriptPath, $importScript, $utf8NoBom)

$dockerArgs = @(
    'run',
    '--rm',
  '-v', "${resolvedOutputDir}:/work",
    '-e', "TARGET_DB=$TargetMongoDatabase",
    '-e', "IMPORT_MODE=$importMode",
    'mongo:7',
    'mongosh',
    $dockerMongoUri,
    '/work/import-notification.js',
    '--quiet'
)

$mongoSummary = & docker @dockerArgs
if ($LASTEXITCODE -ne 0) {
    throw 'MongoDB import/validation failed.'
}

Write-Host "\n=== Source Export Summary ==="
$sourceCountSummary | Format-Table -AutoSize

Write-Host "\n=== Mongo Import Summary ==="
$mongoSummary | ForEach-Object { Write-Host $_ }

Write-Host "\nArtifacts written to: $resolvedOutputDir"
Write-Host "Mode: $importMode"