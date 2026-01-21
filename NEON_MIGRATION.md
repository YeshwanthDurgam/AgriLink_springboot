# 🚀 AgriLink - Neon Database Migration Guide

This guide will help you migrate AgriLink from local PostgreSQL to **Neon** (serverless PostgreSQL).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Neon Setup](#neon-setup)
3. [Database Configuration](#database-configuration)
4. [Running Locally with Neon](#running-locally-with-neon)
5. [Running with Docker](#running-with-docker)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

- Neon Account (https://neon.tech)
- Java 17+ installed
- Maven installed
- Docker (optional, for containerized deployment)

---

## 🔧 Neon Setup

### Step 1: Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Click **"New Project"**
3. Name your project: `agrilink`
4. Select your region (choose closest to your users)
5. Click **"Create Project"**

### Step 2: Create Databases

Since Neon uses branches, you have two options:

#### Option A: Single Database with Schemas (Recommended for Development)

1. In Neon Console, go to **SQL Editor**
2. Run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for each microservice
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS farm;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS iot;
CREATE SCHEMA IF NOT EXISTS notification;
```

#### Option B: Separate Databases (Recommended for Production)

1. In Neon Console, go to **Databases**
2. Create the following databases:
   - `agrilink_auth`
   - `agrilink_user`
   - `agrilink_farm`
   - `agrilink_marketplace`
   - `agrilink_order`
   - `agrilink_iot`
   - `agrilink_notification`

### Step 3: Get Connection Details

1. In Neon Console, click **"Connection Details"**
2. Copy the following:
   - **Host**: `ep-xxxxx-xxxxx.us-east-2.aws.neon.tech`
   - **Database**: `neondb` (or your database name)
   - **User**: Your username
   - **Password**: Your password

---

## ⚙️ Database Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.neon.example .env
```

### Step 2: Update `.env` with Your Neon Credentials

```env
# Your Neon endpoint
NEON_HOST=ep-cool-darkness-123456.us-east-2.aws.neon.tech

# Your Neon credentials
NEON_USERNAME=your-username
NEON_PASSWORD=your-password

# Database URLs (if using separate databases)
AUTH_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_auth?sslmode=require
USER_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_user?sslmode=require
FARM_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_farm?sslmode=require
MARKETPLACE_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_marketplace?sslmode=require
ORDER_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_order?sslmode=require
IOT_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_iot?sslmode=require
NOTIFICATION_DB_URL=jdbc:postgresql://ep-cool-darkness-123456.us-east-2.aws.neon.tech/agrilink_notification?sslmode=require
```

---

## 🖥️ Running Locally with Neon

### Method 1: Using Environment Variables

```bash
# Set environment variables
export SPRING_PROFILES_ACTIVE=neon
export NEON_DATASOURCE_URL="jdbc:postgresql://your-endpoint.neon.tech/agrilink_auth?sslmode=require"
export NEON_DATASOURCE_USERNAME="your-username"
export NEON_DATASOURCE_PASSWORD="your-password"

# Run the service
cd auth-service
mvn spring-boot:run
```

### Method 2: Using IntelliJ/VS Code

1. Open Run Configuration
2. Add Environment Variables:
   ```
   SPRING_PROFILES_ACTIVE=neon
   NEON_DATASOURCE_URL=jdbc:postgresql://your-endpoint.neon.tech/agrilink_auth?sslmode=require
   NEON_DATASOURCE_USERNAME=your-username
   NEON_DATASOURCE_PASSWORD=your-password
   ```
3. Run the application

### Method 3: Using application-neon.yml directly

Edit each service's `application-neon.yml` file and replace the placeholders:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-actual-endpoint.neon.tech/agrilink_auth?sslmode=require
    username: your-actual-username
    password: your-actual-password
```

Then run with:

```bash
mvn spring-boot:run -Dspring.profiles.active=neon
```

---

## 🐳 Running with Docker

### Step 1: Load Environment Variables

```bash
# Load environment from .env file
source .env

# Or on Windows PowerShell:
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}
```

### Step 2: Build and Run

```bash
# Build all services
docker-compose -f docker-compose.neon.yml build

# Run all services
docker-compose -f docker-compose.neon.yml up -d

# View logs
docker-compose -f docker-compose.neon.yml logs -f
```

### Step 3: Stop Services

```bash
docker-compose -f docker-compose.neon.yml down
```

---

## 🗄️ Database Schema Management

The application uses **Flyway** for database migrations. When you first run the services with Neon:

1. Flyway will automatically create tables
2. `hibernate.ddl-auto: update` will sync any entity changes
3. Existing data will be preserved

### Running Migrations Manually

```bash
# Run Flyway migrations for a specific service
cd auth-service
mvn flyway:migrate -Dflyway.url="jdbc:postgresql://your-endpoint.neon.tech/agrilink_auth?sslmode=require" \
    -Dflyway.user="your-username" \
    -Dflyway.password="your-password"
```

---

## 🔍 Troubleshooting

### Connection Issues

1. **SSL Error**: Make sure `?sslmode=require` is in the URL
2. **Timeout**: Check if your IP is whitelisted in Neon
3. **Authentication Failed**: Verify username/password in Neon Console

### Common Errors

#### "Connection refused"

```
Caused by: org.postgresql.util.PSQLException: Connection refused
```

**Solution**: Check that the Neon endpoint is correct and the database exists.

#### "SSL connection required"

```
Caused by: org.postgresql.util.PSQLException: SSL connection required
```

**Solution**: Add `?sslmode=require` to your JDBC URL.

#### "Role does not exist"

```
Caused by: org.postgresql.util.PSQLException: role "xxx" does not exist
```

**Solution**: Use the correct username from Neon Console.

### Checking Database Connection

```bash
# Test connection using psql
psql "postgresql://username:password@your-endpoint.neon.tech/neondb?sslmode=require"

# Or test using Java
java -cp postgresql-42.5.0.jar \
  -Djdbc.url="jdbc:postgresql://your-endpoint.neon.tech/neondb?sslmode=require" \
  -Djdbc.user="username" \
  -Djdbc.password="password" \
  TestConnection
```

---

## 📊 Service Ports

| Service              | Port | Database              |
| -------------------- | ---- | --------------------- |
| Auth Service         | 8081 | agrilink_auth         |
| User Service         | 8082 | agrilink_user         |
| Farm Service         | 8083 | agrilink_farm         |
| Marketplace Service  | 8084 | agrilink_marketplace  |
| Order Service        | 8085 | agrilink_order        |
| IoT Service          | 8086 | agrilink_iot          |
| Notification Service | 8087 | agrilink_notification |

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Add `.env` to `.gitignore`
2. **Use environment variables** for sensitive data in production
3. **Rotate passwords** regularly in Neon Console
4. **Enable IP whitelisting** for production deployments
5. **Use Neon's branching** for dev/staging environments

---

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon + Spring Boot Guide](https://neon.tech/docs/guides/spring-boot)
- [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/)
- [HikariCP Configuration](https://github.com/brettwooldridge/HikariCP)

---

## 🆘 Need Help?

- Check [Neon Status Page](https://neonstatus.com/)
- Visit [Neon Community](https://community.neon.tech/)
- Review [AgriLink Documentation](./README.md)
