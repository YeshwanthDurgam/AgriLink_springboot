# AgriLink - Agricultural Marketplace Platform

A production-ready microservices-based agricultural marketplace platform built with Spring Boot 3.x with a React frontend.

## Architecture

AgriLink follows a microservices architecture with the following services:

| Service              | Port | Description                          |
| -------------------- | ---- | ------------------------------------ |
| **Frontend**         | 3000 | React Web Application                |
| auth-service         | 8081 | Authentication & Authorization (JWT) |
| user-service         | 8082 | User Profile & KYC Management        |
| farm-service         | 8083 | Farm, Field & Crop Management        |
| marketplace-service  | 8084 | Produce Listings & Search            |
| order-service        | 8085 | Orders & Payments                    |
| iot-service          | 8086 | IoT Telemetry Ingestion              |
| notification-service | 8087 | Email/SMS Notifications              |
| PostgreSQL           | 5432 | Database                             |

## Tech Stack

### Backend

- **Java 17** (Required - Java 25 is not compatible with Lombok)
- **Spring Boot 3.2.1**
- **Spring Security 6** with JWT Authentication
- **Spring Data JPA** (Hibernate)
- **PostgreSQL 15**
- **Flyway** for DB migrations
- **Docker & Docker Compose**
- **Maven** (Multi-module)
- **Lombok 1.18.36**
- **JUnit 5 + Mockito**

### Frontend

- **React 18**
- **React Router DOM**
- **Axios** for API calls
- **React Toastify** for notifications
- **CSS3** for styling

## Prerequisites

Before running the application, ensure you have the following installed:

| Requirement        | Version       | Installation                                                                                    |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------- |
| **Java JDK**       | 17 (Required) | [Download JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) |
| **Maven**          | 3.8+          | [Download Maven](https://maven.apache.org/download.cgi)                                         |
| **Docker Desktop** | Latest        | [Download Docker](https://www.docker.com/products/docker-desktop/)                              |
| **Node.js**        | 18+           | [Download Node.js](https://nodejs.org/)                                                         |
| **npm**            | 9+            | Comes with Node.js                                                                              |

> ⚠️ **Important:** Java 17 is required. Java 25 or higher versions are NOT compatible with Lombok and will cause build failures.

### Verify Prerequisites

```bash
# Check Java version (must be 17)
java -version

# Check Maven
mvn -version

# Check Docker
docker --version
docker-compose --version

# Check Node.js and npm
node --version
npm --version
```

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/agrilink.git
cd AgriLink_springboot
```

### Step 2: Set Java 17 (If you have multiple Java versions)

**Windows (PowerShell):**

```powershell
# Find Java 17 path
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# Verify
java -version
```

**Windows (Command Prompt):**

```cmd
set JAVA_HOME=C:\Program Files\Java\jdk-17
set Path=%JAVA_HOME%\bin;%Path%
java -version
```

**Linux/Mac:**

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH
java -version
```

### Step 3: Build the Backend

```bash
# Build all microservices (skip tests for faster build)
mvn clean install -DskipTests
```

Expected output:

```
[INFO] AgriLink Parent .................................... SUCCESS
[INFO] common-lib ......................................... SUCCESS
[INFO] auth-service ....................................... SUCCESS
[INFO] user-service ....................................... SUCCESS
[INFO] farm-service ....................................... SUCCESS
[INFO] marketplace-service ................................ SUCCESS
[INFO] order-service ...................................... SUCCESS
[INFO] iot-service ........................................ SUCCESS
[INFO] notification-service ............................... SUCCESS
[INFO] BUILD SUCCESS
```

### Step 4: Start Backend Services with Docker

```bash
# Start all services (builds Docker images automatically)
docker-compose up -d --build
```

This will start:

- PostgreSQL database (with automatic database creation)
- All 7 microservices

### Step 5: Verify Backend Services

```bash
# Check all containers are running
docker-compose ps
```

All services should show "Up" status:

```
NAME                    STATUS
agrilink-postgres       Up
agrilink-auth           Up
agrilink-user           Up
agrilink-farm           Up
agrilink-marketplace    Up
agrilink-order          Up
agrilink-iot            Up
agrilink-notification   Up
```

**Test the API:**

```bash
curl http://localhost:8084/api/v1/listings
```

### Step 6: Seed Sample Data (Optional but Recommended)

To populate the marketplace with sample products:

```bash
# Connect to PostgreSQL and insert sample data
docker exec -it agrilink-postgres psql -U agrilink -d agrilink_marketplace -c "
INSERT INTO listings (id, seller_id, category_id, title, description, crop_type, quantity, quantity_unit, price_per_unit, currency, minimum_order, location, organic_certified, quality_grade, status, view_count, created_at, updated_at)
SELECT gen_random_uuid(), 'aaaa1111-aaaa-1111-aaaa-111111111111', id, 'Fresh Organic Tomatoes', 'Ripe, juicy organic tomatoes', 'Tomato', 500, 'KG', 45.00, 'INR', 5.00, 'Lucknow, UP', true, 'A', 'ACTIVE', 100, NOW(), NOW()
FROM categories WHERE name = 'Vegetables' LIMIT 1;
"
```

Or run the full seed file:

```bash
# The seed-data.sql file contains 100 sample products
# Note: This requires manual database switching which may need psql client
```

### Step 7: Start the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start at **http://localhost:3000**

### Step 8: Access the Application

| URL                                   | Description          |
| ------------------------------------- | -------------------- |
| http://localhost:3000                 | Frontend Application |
| http://localhost:3000/marketplace     | Marketplace Page     |
| http://localhost:3000/login           | Login Page           |
| http://localhost:8081/api/v1/auth     | Auth Service API     |
| http://localhost:8084/api/v1/listings | Marketplace API      |

---

## 📋 Complete Commands Reference

### Build Commands

```bash
# Build all services
mvn clean install -DskipTests

# Build with tests
mvn clean install

# Build specific service
cd auth-service && mvn clean install -DskipTests
```

### Docker Commands

```bash
# Start all services
docker-compose up -d --build

# Start specific service
docker-compose up -d postgres

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f marketplace-service

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart a specific service
docker-compose restart auth-service

# Check service status
docker-compose ps
```

### Database Commands

```bash
# Connect to PostgreSQL
docker exec -it agrilink-postgres psql -U agrilink -d agrilink_marketplace

# List databases
docker exec agrilink-postgres psql -U agrilink -c "\l"

# List tables in marketplace database
docker exec agrilink-postgres psql -U agrilink -d agrilink_marketplace -c "\dt"

# Query listings
docker exec agrilink-postgres psql -U agrilink -d agrilink_marketplace -c "SELECT id, title, status FROM listings;"
```

### Frontend Commands

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Build Fails with Lombok Errors

**Error:** `java: cannot find symbol` or annotation processing errors

**Solution:** Ensure you're using Java 17, not Java 25+

```bash
java -version  # Must show version 17.x.x
```

#### 2. Docker Containers Keep Restarting

**Check logs:**

```bash
docker-compose logs -f user-service
```

**Common causes:**

- Database not ready yet (wait 30 seconds)
- Missing database tables (Flyway migrations should handle this)

#### 3. Frontend Can't Connect to Backend

**Verify backend is running:**

```bash
curl http://localhost:8084/api/v1/listings
```

**Check CORS:** The backend services are configured to allow `localhost:3000`

#### 4. Port Already in Use

**Windows:**

```cmd
netstat -ano | findstr :8084
taskkill /PID <PID> /F
```

**Linux/Mac:**

```bash
lsof -i :8084
kill -9 <PID>
```

#### 5. Database Connection Issues

**Verify PostgreSQL is running:**

```bash
docker exec agrilink-postgres pg_isready -U agrilink
```

**Check database exists:**

```bash
docker exec agrilink-postgres psql -U agrilink -c "\l"
```

#### 6. No Products Showing in Marketplace

The database needs seed data. Insert sample products:

```bash
docker exec agrilink-postgres psql -U agrilink -d agrilink_marketplace -c "SELECT COUNT(*) FROM listings;"
```

If count is 0, run the seed data insertion (see Step 6).

---

## 📚 API Documentation

### Auth Service (Port 8081)

#### Register a New User

```bash
POST http://localhost:8081/api/v1/auth/register
Content-Type: application/json

{
  "email": "farmer@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "roles": ["FARMER"]
}
```

#### Login

```bash
POST http://localhost:8081/api/v1/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Returns JWT token for authentication

### User Service (Port 8082)

#### Get Profile

```bash
GET http://localhost:8082/api/v1/users/profile
Authorization: Bearer <token>
```

#### Update Profile

```bash
PUT http://localhost:8082/api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Farmer",
  "address": "123 Farm Road",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

### Farm Service (Port 8083)

#### Create Farm

```bash
POST http://localhost:8083/api/v1/farms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Green Valley Farm",
  "location": "California",
  "totalArea": 100.5,
  "areaUnit": "HECTARE"
}
```

#### Get My Farms

```bash
GET http://localhost:8083/api/v1/farms/my-farms
Authorization: Bearer <token>
```

### Marketplace Service (Port 8084)

#### Get All Listings

```bash
GET http://localhost:8084/api/v1/listings?page=0&size=12
```

#### Search Listings with Filters

```bash
GET http://localhost:8084/api/v1/listings?categoryId=<uuid>&minPrice=10&maxPrice=100&page=0&size=20
```

#### Get Categories

```bash
GET http://localhost:8084/api/v1/categories
```

#### Create Listing (Farmer only)

```bash
POST http://localhost:8084/api/v1/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Fresh Organic Tomatoes",
  "description": "Freshly harvested organic tomatoes",
  "categoryId": "<category-uuid>",
  "quantity": 500,
  "quantityUnit": "KG",
  "pricePerUnit": 45.00,
  "currency": "INR",
  "location": "Mumbai, Maharashtra",
  "organicCertified": true,
  "qualityGrade": "A"
}
```

### Order Service (Port 8085)

#### Create Order

```bash
POST http://localhost:8085/api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "listingId": "<listing-uuid>",
      "quantity": 10
    }
  ],
  "deliveryAddress": "456 Buyer Street, Mumbai"
}
```

#### Get My Orders

```bash
GET http://localhost:8085/api/v1/orders/my-orders
Authorization: Bearer <token>
```

---

## 🧪 Testing

### Run All Tests

```bash
mvn test
```

### Run Tests for Specific Service

```bash
cd auth-service
mvn test
```

### Run with Coverage Report

```bash
mvn test jacoco:report
```

---

## 📁 Project Structure

```
AgriLink_springboot/
├── common-lib/              # Shared DTOs, exceptions, utilities
├── auth-service/            # Authentication & Authorization (JWT)
├── user-service/            # User Profile & KYC Management
├── farm-service/            # Farm, Field & Crop Management
├── marketplace-service/     # Produce Listings & Search
├── order-service/           # Orders & Payments
├── iot-service/             # IoT Telemetry Ingestion
├── notification-service/    # Email/SMS Notifications
├── frontend/                # React Web Application
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   └── context/         # React context providers
│   └── package.json
├── docker-compose.yml       # Docker orchestration
├── init-db.sql              # Database initialization
├── seed-data.sql            # Sample data (100 products)
├── pom.xml                  # Parent Maven POM
└── README.md
```

---

## 🔐 Default Test Credentials

After seeding data, you can use these test accounts:

| Email                     | Password     | Role   |
| ------------------------- | ------------ | ------ |
| rajesh.kumar@agrilink.com | Password@123 | FARMER |
| priya.sharma@agrilink.com | Password@123 | FARMER |
| amit.patel@agrilink.com   | Password@123 | BUYER  |

---

## 🛠️ Development Tips

### Hot Reload for Backend

Run services individually with Maven for faster development:

```bash
cd marketplace-service
mvn spring-boot:run
```

### Hot Reload for Frontend

The React development server automatically reloads on file changes.

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f marketplace-service
```

### Database GUI

Use tools like **DBeaver** or **pgAdmin** to connect:

- Host: `localhost`
- Port: `5432`
- Username: `agrilink`
- Password: `agrilink123`
- Databases: `agrilink_auth`, `agrilink_user`, `agrilink_farm`, `agrilink_marketplace`, `agrilink_order`, `agrilink_iot`, `agrilink_notification`

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
