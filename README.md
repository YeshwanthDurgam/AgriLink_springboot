# AgriLink - Agricultural Marketplace Platform

A production-ready microservices-based agricultural marketplace platform built with Spring Boot 3.x.

## Architecture

AgriLink follows a microservices architecture with the following services:

| Service | Port | Description |
|---------|------|-------------|
| auth-service | 8081 | Authentication & Authorization (JWT) |
| user-service | 8082 | User Profile & KYC Management |
| farm-service | 8083 | Farm, Field & Crop Management |
| marketplace-service | 8084 | Produce Listings & Search |
| order-service | 8085 | Orders & Payments |
| iot-service | 8086 | IoT Telemetry Ingestion |
| notification-service | 8087 | Email/SMS Notifications |

## Tech Stack

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Security 6** with JWT Authentication
- **Spring Data JPA** (Hibernate)
- **PostgreSQL 15**
- **Flyway** for DB migrations
- **Docker & Docker Compose**
- **Maven** (Multi-module)
- **Lombok**
- **JUnit 5 + Mockito**

## Prerequisites

- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-org/agrilink.git
cd agrilink
```

### 2. Build the project
```bash
mvn clean install -DskipTests
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

### 4. Verify services are running
```bash
docker-compose ps
```

## Development Setup

### Running Individual Services

1. Start PostgreSQL:
```bash
docker-compose up -d postgres
```

2. Run a specific service:
```bash
cd auth-service
mvn spring-boot:run
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SPRING_DATASOURCE_URL | Database URL | jdbc:postgresql://localhost:5432/agrilink_auth |
| SPRING_DATASOURCE_USERNAME | DB Username | agrilink |
| SPRING_DATASOURCE_PASSWORD | DB Password | agrilink123 |
| JWT_SECRET | JWT signing key | (required) |
| JWT_EXPIRATION | Token expiration (ms) | 86400000 |

## API Documentation

### Auth Service (Port 8081)

#### Register
```bash
POST /api/v1/auth/register
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
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

### User Service (Port 8082)

#### Get Profile
```bash
GET /api/v1/users/profile
Authorization: Bearer <token>
```

#### Update Profile
```bash
PUT /api/v1/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Farmer",
  "address": "123 Farm Road"
}
```

### Farm Service (Port 8083)

#### Create Farm
```bash
POST /api/v1/farms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Green Valley Farm",
  "location": "California",
  "totalArea": 100.5
}
```

### Marketplace Service (Port 8084)

#### Create Listing (Farmer only)
```bash
POST /api/v1/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Fresh Organic Tomatoes",
  "description": "Freshly harvested organic tomatoes",
  "category": "VEGETABLES",
  "quantity": 500,
  "unit": "KG",
  "pricePerUnit": 2.50,
  "farmId": "uuid"
}
```

#### Search Listings
```bash
GET /api/v1/listings?category=VEGETABLES&minPrice=1&maxPrice=10&page=0&size=20
```

### Order Service (Port 8085)

#### Create Order
```bash
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "listingId": "uuid",
      "quantity": 10
    }
  ],
  "deliveryAddress": "456 Buyer Street"
}
```

## Testing

### Run all tests
```bash
mvn test
```

### Run tests for specific service
```bash
cd auth-service
mvn test
```

## Project Structure

```
agrilink/
├── common-lib/          # Shared DTOs, exceptions, utilities
├── auth-service/        # Authentication & Authorization
├── user-service/        # User Profile & KYC
├── farm-service/        # Farm Management
├── marketplace-service/ # Listings & Search
├── order-service/       # Orders & Payments
├── iot-service/         # IoT Telemetry
├── notification-service/# Notifications
├── docker-compose.yml
└── pom.xml
```

## License

MIT License - see LICENSE file for details.
