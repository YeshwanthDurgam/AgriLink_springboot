# Advanced Role-Based System Architecture (Client Presentation)

```mermaid
flowchart TB
    %% ===== Roles =====
    subgraph ROLES[User Roles]
        GUEST[Guest Visitor]
        BUYER[Buyer / Customer]
        FARMER[Farmer]
        MANAGER[Manager]
        ADMIN[Admin]
    end

    %% ===== Experience Layer =====
    FE[React Frontend\nRole-aware UI + Route Guards\nPrivateRoute / FarmerRoute]

    %% ===== Core Backend =====
    subgraph CORE[Microservices Core]
        AUTH[auth-service :8081\nJWT, Login, Register, Password Reset]
        USER[user-service :8082\nProfiles, KYC, Farmer Approval, Admin User Actions]
        FARM[farm-service :8083\nFarm, Field, Crop Plan, Analytics]
        MKT[marketplace-service :8084\nListings, Search, Reviews, Wishlist, Demand Forecast]
        ORD[order-service :8085\nCart, Checkout, Orders, Payment, Fraud Cases]
        NOTI[notification-service :8087\nIn-app Notifications, Messaging, Email, WebSocket]
    end

    %% ===== Data Layer =====
    subgraph DATA[PostgreSQL Databases]
        DBA[(agrilink_auth)]
        DBU[(agrilink_user)]
        DBF[(agrilink_farm)]
        DBM[(agrilink_marketplace)]
        DBO[(agrilink_order)]
        DBN[(agrilink_notification)]
    end

    %% ===== External =====
    subgraph EXT[External Integrations]
        RZ[Razorpay API]
        DG[Data.gov.in API]
        WM[Open-Meteo API]
        EP[Gmail SMTP / Brevo API]
        SP[Textbelt SMS API]
    end

    %% ===== Role -> Frontend =====
    GUEST --> FE
    BUYER --> FE
    FARMER --> FE
    MANAGER --> FE
    ADMIN --> FE

    %% ===== Frontend -> Services by Role =====
    FE --> AUTH
    FE --> USER
    FE --> MKT
    FE --> ORD
    FE --> NOTI
    FE --> FARM
    FE <-->|WebSocket /ws/notifications| NOTI

    %% ===== Role-specific business flows =====
    GUEST -->|Browse listings/categories| MKT

    BUYER -->|Follow farmers, profile| USER
    BUYER -->|Browse, wishlist, review| MKT
    BUYER -->|Cart, checkout, orders| ORD
    BUYER -->|Message farmer + notifications| NOTI

    FARMER -->|Farmer profile + KYC submit| USER
    FARMER -->|Farm/field/crop operations| FARM
    FARMER -->|Create/update listings| MKT
    FARMER -->|Manage incoming orders| ORD
    FARMER -->|Buyer/manager/admin messaging| NOTI

    MANAGER -->|Review/approve farmer KYC| USER
    MANAGER -->|Message farmers| NOTI

    ADMIN -->|User lifecycle actions (suspend/activate/disable)| USER
    ADMIN -->|Admin account-state operations| AUTH
    ADMIN -->|Price update approvals| MKT
    ADMIN -->|Fraud case triage + order tracking| ORD
    ADMIN -->|Broadcast/support notifications| NOTI

    %% ===== Inter-service interactions =====
    USER -->|Admin state sync| AUTH
    AUTH -->|Welcome/reset/verification email requests| NOTI
    MKT -->|Public profile + follower count lookup| USER
    MKT -->|Listing event notifications| NOTI
    ORD -->|Order/payment notifications| NOTI
    NOTI -->|User role/name lookup for messaging policy| USER

    %% ===== Service -> DB =====
    AUTH --> DBA
    USER --> DBU
    FARM --> DBF
    MKT --> DBM
    ORD --> DBO
    NOTI --> DBN

    %% ===== Service -> External =====
    ORD --> RZ
    MKT --> DG
    FARM --> WM
    NOTI --> EP
    NOTI --> SP

    %% ===== Visual classes =====
    classDef role fill:#eef7ff,stroke:#1f6feb,stroke-width:1px,color:#0b1f3b;
    classDef fe fill:#ecfdf3,stroke:#15803d,stroke-width:1px,color:#052e16;
    classDef svc fill:#fff7ed,stroke:#c2410c,stroke-width:1px,color:#431407;
    classDef db fill:#f5f3ff,stroke:#6d28d9,stroke-width:1px,color:#2e1065;
    classDef ext fill:#fef2f2,stroke:#b91c1c,stroke-width:1px,color:#450a0a;

    class GUEST,BUYER,FARMER,MANAGER,ADMIN role;
    class FE fe;
    class AUTH,USER,FARM,MKT,ORD,NOTI svc;
    class DBA,DBU,DBF,DBM,DBO,DBN db;
    class RZ,DG,WM,EP,SP ext;
```

## Access Policy Snapshot

- `Guest`: public read only (marketplace listings/categories).
- `Buyer/Customer`: marketplace + cart/checkout/orders + follow farmers + messaging.
- `Farmer`: buyer capabilities + farm management + listing management + seller order operations.
- `Manager`: farmer KYC approval workflows + messaging with farmers.
- `Admin`: cross-service control (user lifecycle, listing price approvals, fraud/admin order controls).

