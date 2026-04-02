# Multi-Database Migration Runbook

## Scope

This runbook migrates data from local PostgreSQL databases to dedicated target databases per service.

- auth-service -> dedicated Neon PostgreSQL
- user-service -> dedicated Neon PostgreSQL
- farm-service -> dedicated Neon PostgreSQL
- marketplace-service -> dedicated Neon PostgreSQL
- order-service -> dedicated Neon PostgreSQL
- notification-service -> target MongoDB

## 1. Env Format Template

Add these keys to `.env` (values intentionally redacted):

```dotenv
SPRING_PROFILES_ACTIVE=neon

# Auth DB
AUTH_DB_URL=jdbc:postgresql://AUTH_HOST/neondb?sslmode=require&channel_binding=require&currentSchema=auth_schema
AUTH_DB_USER=neondb_owner
AUTH_DB_PASSWORD=AUTH_DB_PASSWORD

# User DB
USER_DB_URL=jdbc:postgresql://USER_HOST/neondb?sslmode=require&channel_binding=require&currentSchema=user_schema
USER_DB_USER=neondb_owner
USER_DB_PASSWORD=USER_DB_PASSWORD

# Farm DB
FARM_DB_URL=jdbc:postgresql://FARM_HOST/neondb?sslmode=require&channel_binding=require&currentSchema=farm_schema
FARM_DB_USER=neondb_owner
FARM_DB_PASSWORD=FARM_DB_PASSWORD

# Marketplace DB
MARKETPLACE_DB_URL=jdbc:postgresql://MARKETPLACE_HOST/neondb?sslmode=require&channel_binding=require&currentSchema=marketplace_schema
MARKETPLACE_DB_USER=neondb_owner
MARKETPLACE_DB_PASSWORD=MARKETPLACE_DB_PASSWORD

# Order DB
ORDER_DB_URL=jdbc:postgresql://ORDER_HOST/neondb?sslmode=require&channel_binding=require&currentSchema=order_schema
ORDER_DB_USER=neondb_owner
ORDER_DB_PASSWORD=ORDER_DB_PASSWORD

# Notification target MongoDB
NOTIFICATION_MONGODB_URI=mongodb+srv://dbUser:dbUserPassword@cluster0.tr1obdu.mongodb.net/agrilink_notification?retryWrites=true&w=majority
NOTIFICATION_MONGODB_DATABASE=agrilink_notification
```

## 2. Source to Target Mapping

| Service | Source DB (local) | Target DB | Target Schema |
|---|---|---|---|
| auth-service | agrilink_auth | AUTH_DB_URL | auth_schema |
| user-service | agrilink_user | USER_DB_URL | user_schema |
| farm-service | agrilink_farm | FARM_DB_URL | farm_schema |
| marketplace-service | agrilink_marketplace | MARKETPLACE_DB_URL | marketplace_schema |
| order-service | agrilink_order | ORDER_DB_URL | order_schema |
| notification-service | agrilink_notification | NOTIFICATION_MONGODB_URI | n/a |

## 3. PostgreSQL Migration Steps (per service)

Repeat for each service DB.

1. Freeze writes for the service.
2. Export source DB.
3. Ensure target schema exists.
4. Import dump into target.
5. Validate row counts and key tables.

PowerShell template:

```powershell
# SOURCE
$SRC_HOST = "localhost"
$SRC_PORT = "5432"
$SRC_DB = "agrilink_auth"   # change per service
$SRC_USER = "agrilink"
$env:PGPASSWORD = "SOURCE_PASSWORD"

# TARGET
$TGT_HOST = "ep-your-neon-host"
$TGT_PORT = "5432"
$TGT_DB = "neondb"
$TGT_USER = "neondb_owner"
$env:PGPASSWORD = "TARGET_PASSWORD"

# 1) Dump source
pg_dump -h $SRC_HOST -p $SRC_PORT -U $SRC_USER -d $SRC_DB -Fc -f ".\backup-$SRC_DB.dump"

# 2) Create schema on target (example auth_schema)
psql "postgresql://$TGT_USER:$env:PGPASSWORD@$TGT_HOST/$TGT_DB?sslmode=require&channel_binding=require" -c "CREATE SCHEMA IF NOT EXISTS auth_schema;"

# 3) Restore
pg_restore -h $TGT_HOST -p $TGT_PORT -U $TGT_USER -d $TGT_DB --no-owner --no-privileges ".\backup-$SRC_DB.dump"
```

## 4. Validation Checklist

- Application starts with `SPRING_PROFILES_ACTIVE=neon`.
- Flyway history table exists in target schema.
- Row counts match for critical tables.
- Login, listing search, farm read, order create, notification send basic smoke tests pass.

### Notes from Execution

- During SQL replay you may see `ERROR: schema "public" already exists`. This is expected and non-blocking for migration.
- Marketplace trigram indexes require `pg_trgm` extension and `public.gin_trgm_ops` operator class.
	Run this before replaying marketplace SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
```

## 5. Notification-Service MongoDB Backfill

Notification-service code migration to MongoDB is complete. This section covers data backfill and runtime validation.

### 5.1 Backfill Script

Use the Phase 3 script:

`scripts/migrate-phase3-notification-postgres-to-mongo.ps1`

Default behavior:

- reads source data from local container `agrilink-postgres`, database `agrilink_notification`, schema `public`
- upserts into Mongo collections: `notifications`, `notification_templates`, `notification_preferences`, `conversations`, `messages`
- preserves IDs and converts UUID/date fields to Mongo-native values
- writes migration artifacts to `migration-backups/phase3-notification-<timestamp>`

### 5.2 Typical Commands

Dry run (no writes, count validation only):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migrate-phase3-notification-postgres-to-mongo.ps1 -DryRun
```

Upsert backfill to target Mongo:

```powershell
$env:NOTIFICATION_MONGODB_URI='mongodb+srv://<user>:<password>@<cluster>/agrilink_notification?retryWrites=true&w=majority'
$env:NOTIFICATION_MONGODB_DATABASE='agrilink_notification'
powershell -ExecutionPolicy Bypass -File .\scripts\migrate-phase3-notification-postgres-to-mongo.ps1
```

Clear target collections before reloading:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migrate-phase3-notification-postgres-to-mongo.ps1 -ClearTargetCollections
```

### 5.3 Post-Backfill Smoke Tests

1. Start stack with Neon profile and Mongo notification target.
2. Verify notification-service starts cleanly and connects to Mongo.
3. Validate API paths:
	- fetch user notifications
	- fetch/create conversation
	- send/read message
4. Confirm records appear in Mongo collections and unread counters update correctly.
