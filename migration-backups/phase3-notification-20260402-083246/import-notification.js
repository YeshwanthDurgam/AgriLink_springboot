const fs = require('fs');
const path = require('path');

const targetDbName = process.env.TARGET_DB || 'agrilink_notification';
const mode = process.env.IMPORT_MODE || 'upsert';
const mappings = [
    {
        "collection":  "notifications",
        "file":  "notifications.jsonl",
        "uuidFields":  [
                           "userId"
                       ],
        "dateFields":  [
                           "readAt",
                           "sentAt",
                           "failedAt",
                           "createdAt",
                           "updatedAt"
                       ]
    },
    {
        "collection":  "notification_templates",
        "file":  "notification_templates.jsonl",
        "uuidFields":  [

                       ],
        "dateFields":  [
                           "createdAt",
                           "updatedAt"
                       ]
    },
    {
        "collection":  "notification_preferences",
        "file":  "notification_preferences.jsonl",
        "uuidFields":  [
                           "userId"
                       ],
        "dateFields":  [
                           "createdAt",
                           "updatedAt"
                       ]
    },
    {
        "collection":  "conversations",
        "file":  "conversations.jsonl",
        "uuidFields":  [
                           "participant1Id",
                           "participant2Id",
                           "listingId"
                       ],
        "dateFields":  [
                           "lastMessageAt",
                           "createdAt",
                           "updatedAt"
                       ]
    },
    {
        "collection":  "messages",
        "file":  "messages.jsonl",
        "uuidFields":  [
                           "conversationId",
                           "senderId",
                           "recipientId"
                       ],
        "dateFields":  [
                           "readAt",
                           "createdAt"
                       ]
    }
];

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