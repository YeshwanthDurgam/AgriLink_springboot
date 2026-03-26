# AgriLink Backend Microservices Structure

## 1. SERVICES OVERVIEW

All 6 microservices exist as expected:
- ✅ **auth-service** - User authentication and authorization
- ✅ **user-service** - User profiles, KYC, verification
- ✅ **farm-service** - Farm management
- ✅ **marketplace-service** - Product listings
- ✅ **order-service** - Orders, cart, payments
- ✅ **notification-service** - Notifications and messaging

---

## 2. DETAILED SERVICE STRUCTURE

### **AUTH-SERVICE** (Authentication & JWT)

**Purpose:** User registration, login, JWT token generation, password reset

**Main Components:**
- **Controller:** [auth-service/src/main/java/com/agrilink/auth/controller/AuthController.java](auth-service/src/main/java/com/agrilink/auth/controller/AuthController.java)
  - `POST /api/v1/auth/register` - User registration
  - `POST /api/v1/auth/login` - Login with JWT token
  - `GET /api/v1/auth/me` - Current user details
  - `GET /api/v1/auth/farmers` - Public list of farmers
  - `POST /api/v1/auth/forgot-password` - Password reset request

- **Entities:**
  - [User.java](auth-service/src/main/java/com/agrilink/auth/entity/User.java) - Core user entity
  - [Role.java](auth-service/src/main/java/com/agrilink/auth/entity/Role.java) - Role assignments
  - [PasswordResetToken.java](auth-service/src/main/java/com/agrilink/auth/entity/PasswordResetToken.java) - Password reset flow

---

### **USER-SERVICE** (Profiles, KYC, Verification)

**Purpose:** User profile management, KYC document submission, farmer verification

**Main Components:**
- **Controller:** [user-service/src/main/java/com/agrilink/user/controller/UserProfileController.java](user-service/src/main/java/com/agrilink/user/controller/UserProfileController.java)
  - `GET /api/v1/users/profile` - Get user profile
  - `PUT /api/v1/users/profile` - Update profile
  - `GET /api/v1/users/{userId}/profile` - Admin: get other profiles

- **KYC/Verification:**
  - **Controller:** [KycController.java](user-service/src/main/java/com/agrilink/user/controller/KycController.java)
    - `POST /api/v1/kyc/submit` - Submit KYC documents
  - **Service:** [KycService.java](user-service/src/main/java/com/agrilink/user/service/KycService.java)

- **Entities:**
  - [UserProfile.java](user-service/src/main/java/com/agrilink/user/entity/UserProfile.java) - Base user profile
  - [FarmerProfile.java](user-service/src/main/java/com/agrilink/user/entity/FarmerProfile.java) - Farmer-specific profile
    - Fields: `verificationDocument`, `documentUploadedAt`, `documentType`
    - **FRAUD PREVENTION:** When verification document is re-uploaded, status automatically resets to `PENDING`
  - [CustomerProfile.java](user-service/src/main/java/com/agrilink/user/entity/CustomerProfile.java) - Customer profile
  - [ManagerProfile.java](user-service/src/main/java/com/agrilink/user/entity/ManagerProfile.java) - Manager profile
  - [KycDocument.java](user-service/src/main/java/com/agrilink/user/entity/KycDocument.java) - KYC submissions
  - [ProfileStatus.java](user-service/src/main/java/com/agrilink/user/entity/ProfileStatus.java) - Enum: `PENDING`, `APPROVED`, `REJECTED`
  - [Address.java](user-service/src/main/java/com/agrilink/user/entity/Address.java) - User addresses
  - [FollowedFarmer.java](user-service/src/main/java/com/agrilink/user/entity/FollowedFarmer.java) - Follow relationships

---

### **FARM-SERVICE** (Farm Management)

**Purpose:** Farm registration, crop planning, field management

**Main Components:**
- **Controller:** [farm-service/src/main/java/com/agrilink/farm/controller/FarmController.java](farm-service/src/main/java/com/agrilink/farm/controller/FarmController.java)
  - `POST /api/v1/farms` - Create farm
  - `GET /api/v1/farms` - Get farms for current user
  - `GET /api/v1/farms/{farmId}` - Get specific farm
  - `PUT /api/v1/farms/{farmId}` - Update farm

- **Entities:**
  - [Farm.java](farm-service/src/main/java/com/agrilink/farm/entity/Farm.java) - Core farm entity
  - [Field.java](farm-service/src/main/java/com/agrilink/farm/entity/Field.java) - Individual fields
  - [CropPlan.java](farm-service/src/main/java/com/agrilink/farm/entity/CropPlan.java) - Crop planning

---

### **MARKETPLACE-SERVICE** (Listings & Sales)

**Purpose:** Product listings, pricing, reviews, seller ratings

**Main Components:**
- **Controller:** [marketplace-service/src/main/java/com/agrilink/marketplace/controller/ListingController.java](marketplace-service/src/main/java/com/agrilink/marketplace/controller/ListingController.java)
  - `POST /api/v1/listings` - Create listing
  - `GET /api/v1/listings/{listingId}` - Get listing
  - `GET /api/v1/listings/search` - Search with filters
  - Price update approval endpoints

- **Entities:**
  - [Listing.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/Listing.java) - Product listings
    - Fields: `sellerId`, `farmId`, `cropType`, `quantity`, `pricePerUnit`, `harvestDate`, `expiryDate`
    - Status: `DRAFT`, `ACTIVE`, `INACTIVE`, `SOLD`
  - [Category.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/Category.java) - Product categories
  - [ListingImage.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/ListingImage.java) - Listing images
  - [Review.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/Review.java) - Product reviews
  - [SellerRating.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/SellerRating.java) - Seller ratings
  - [ListingPriceUpdateProposal.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/ListingPriceUpdateProposal.java) - Price changes
  - [SavedListing.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/SavedListing.java) - Wishlist items
  - [Wishlist.java](marketplace-service/src/main/java/com/agrilink/marketplace/entity/Wishlist.java) - Wishlist management

---

### **ORDER-SERVICE** (Orders, Cart, Payments, Fraud Prevention)

**Purpose:** Order management, shopping cart, payment processing with Razorpay

**Main Components:**

#### Controllers:
- **OrderController:** [order-service/src/main/java/com/agrilink/order/controller/OrderController.java](order-service/src/main/java/com/agrilink/order/controller/OrderController.java)
  - `POST /api/v1/orders` - Create order
  - `GET /api/v1/orders/{orderId}` - Get order
  - `GET /api/v1/orders/number/{orderNumber}` - Get by order number
  - `GET /api/v1/orders/my/purchases` - Buyer orders

- **CheckoutController:** [order-service/src/main/java/com/agrilink/order/controller/CheckoutController.java](order-service/src/main/java/com/agrilink/order/controller/CheckoutController.java)
  - `POST /api/v1/checkout/initialize` - Start checkout
  - `POST /api/v1/checkout/verify-payment` - Verify payment ⚠️ **FRAUD POINT**

- **CartController:** [order-service/src/main/java/com/agrilink/order/controller/CartController.java](order-service/src/main/java/com/agrilink/order/controller/CartController.java)
  - `GET /api/v1/cart` - Get cart
  - `POST /api/v1/cart/items` - Add item
  - `DELETE /api/v1/cart/items/{itemId}` - Remove item

#### Entities:
- **Order.java** - Core order entity
  - Fields: `orderNumber`, `buyerId`, `sellerId`, `listingId`, `status`, `totalAmount`
  - Status enum: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REFUNDED`
  - Has: `Payment[]`, `OrderItem[]`, `OrderStatusHistory[]`

- **Payment.java** - Payment transactions with Razorpay integration
  - **CRITICAL FRAUD PREVENTION FIELDS:**
    - `razorpayOrderId` - Razorpay order reference
    - `razorpayPaymentId` - Payment ID from gateway
    - `razorpaySignature` - HMAC signature for verification ✅
    - `paymentStatus` enum: `PENDING`, `PROCESSING`, `CREATED`, `AUTHORIZED`, `CAPTURED`, `COMPLETED`, `FAILED`, `REFUNDED`, `CANCELLED`
  - Refund tracking: `refundId`, `refundAmount`, `refundedAt`

- **OrderItem.java** - Individual items in an order
- **Cart.java** - Shopping cart
- **CartItem.java** - Items in cart
- **OrderStatusHistory.java** - Status change tracking
- **OrderTracking.java** - Delivery tracking

#### Services:
- **RazorpayService.java** - Payment gateway integration
  - **FRAUD PREVENTION METHODS:**
    - `verifyPaymentSignature()` - Validates HMAC signature using Razorpay key secret
    - `verifyAndCompletePayment()` - Comprehensive verification:
      1. Checks payment exists for Razorpay order ID
      2. Verifies order ID matches
      3. Validates HMAC signature ✅
      4. Only marks payment as COMPLETED if signature valid
    - `handleWebhookEvent()` - Webhook signature verification
      - Verifies payload is actually from Razorpay

- **CheckoutService.java** - Checkout flow
  - Auto-calculates: shipping charges, taxes
  - Creates orders from cart
  - Initiates Razorpay payment

- **OrderService.java** - Overall order operations

---

### **NOTIFICATION-SERVICE** (Notifications & Messaging)

**Purpose:** User notifications, messaging between users

**Main Components:**
- **Controller:** [notification-service/src/main/java/com/agrilink/notification/controller/NotificationController.java](notification-service/src/main/java/com/agrilink/notification/controller/NotificationController.java)
  - `POST /api/v1/notifications/send` - Send notification
  - `GET /api/v1/notifications` - Get user notifications
  - `GET /api/v1/notifications/unread` - Get unread
  - `GET /api/v1/notifications/count` - Unread count

- **Messaging Endpoints:**
  - `POST /api/v1/messaging/send` - Send message
  - `GET /api/v1/messaging/conversations` - List conversations

- **Entities:**
  - [Notification.java](notification-service/src/main/java/com/agrilink/notification/entity/Notification.java) - Notifications
  - [Message.java](notification-service/src/main/java/com/agrilink/notification/entity/Message.java) - Messages
  - [Conversation.java](notification-service/src/main/java/com/agrilink/notification/entity/Conversation.java) - Messaging threads
  - [NotificationTemplate.java](notification-service/src/main/java/com/agrilink/notification/entity/NotificationTemplate.java) - Templates
  - [NotificationPreferences.java](notification-service/src/main/java/com/agrilink/notification/entity/NotificationPreferences.java) - User preferences

- **MessagingService.java** - Message operations
  - **FRAUD PREVENTION:** `validateMessagingPermission()` restricts who can message whom:
    - CUSTOMER/BUYER → Can only message FARMER
    - FARMER → Can message CUSTOMER/BUYER/MANAGER/ADMIN
    - MANAGER → Can only message FARMER
    - ADMIN → Can message FARMER/MANAGER

---

## 3. FRAUD MANAGEMENT RECOMMENDATION

### **Best Choice: ORDER-SERVICE** ✅

**Why Order-Service is ideal for fraud management:**

1. **Payment Processing Authority**: Handles Razorpay integration and payment verification
2. **Transaction History**: Complete order lifecycle tracking
3. **Critical Data Points**:
   - Buyer/Seller IDs: Track user patterns
   - Order amounts and frequency
   - Payment signatures: Prevent tampering
   - Shipping details: Detection of unusual patterns
4. **Existing Security**: Already implements signature verification
5. **Central Hub**: All critical transactions flow through here

### **Secondary Choice: USER-SERVICE** (Partial)

Can complement with:
- Fraud scoring based on verification status
- Account age and activity patterns
- KYC verification tiers

---

## 4. EXISTING FRAUD-RELATED IMPLEMENTATIONS

### ✅ **Payment Fraud Prevention (Order-Service)**
```
RazorpayService.verifyPaymentSignature()
- Validates HMAC signature using key secret
- Prevents payment tampering/unauthorized orders

RazorpayService.verifyAndCompletePayment()
- Order ID cross-verification
- Signature validation before marking COMPLETED
- Failure reason tracking

CheckoutService
- Validates cart not empty
- Calculates taxes/shipping correctly
- Amount consistency checks
```

### ✅ **Identity Verification (User-Service)**
```
FarmerProfileService
- Document re-upload resets verification to PENDING
- Prevents fraudulent document updates
- Tracks document_uploaded_at timestamp

KycService
- KYC document submission workflow
- Document status: PENDING/APPROVED/REJECTED
- Links to UserProfile

ProfileStatus Enum
- PENDING, APPROVED, REJECTED states
- Baseline for verification-based fraud detection
```

### ✅ **Access Control (Notification-Service)**
```
MessagingService.validateMessagingPermission()
- Prevents spam/fraud messaging
- Role-based restrictions on who can message whom
- Blocks conversations between invalid role pairs
```

### ✅ **Database Migration**
```
V8__add_verification_document_to_farmers.sql
- verification_document: Document storage (Base64 or URL)
- document_uploaded_at: Timestamp tracking
- document_type: Enum (Aadhaar/Gov ID/Land proof)
```

---

## 5. RECOMMENDED FRAUD MODULE LOCATION

### **Create in: `order-service/src/main/java/com/agrilink/order/service/FraudDetectionService.java`**

**Why:**
1. Centralized transaction monitoring
2. Access to Order, Payment, Cart data
3. Can integrate with User-Service client for verification status
4. Real-time order analysis possible

**Recommended Features:**
1. **High-Value Order Detection** (Amount threshold)
2. **Frequency Analysis** (Multiple orders from same buyer/seller in short time)
3. **Payment Method Anomalies** (Mismatches in user patterns)
4. **Buyer/Seller Verification Check** (Block unverified sellers selling high-value items)
5. **Shipping Address Anomalies** (Multiple countries, rapid changes)
6. **Refund Pattern Analysis** (Unusual refund requests)

---

## 6. FILE PATHS SUMMARY

| Service | Controller | Main Entities | Service Layer |
|---------|-----------|---------------|---------------|
| **auth-service** | `controller/AuthController.java` | `entity/User.java`<br/>`entity/Role.java`<br/>`entity/PasswordResetToken.java` | AuthService<br/>PasswordResetService |
| **user-service** | `controller/UserProfileController.java`<br/>`controller/KycController.java` | `entity/UserProfile.java`<br/>`entity/FarmerProfile.java`<br/>`entity/KycDocument.java`<br/>`entity/ProfileStatus.java` | UserProfileService<br/>KycService<br/>FarmerProfileService |
| **farm-service** | `controller/FarmController.java` | `entity/Farm.java`<br/>`entity/Field.java`<br/>`entity/CropPlan.java` | FarmService |
| **marketplace-service** | `controller/ListingController.java` | `entity/Listing.java`<br/>`entity/Category.java`<br/>`entity/Review.java`<br/>`entity/SellerRating.java` | ListingService<br/>PriceUpdateApprovalService |
| **order-service** | `controller/OrderController.java`<br/>`controller/CheckoutController.java` | `entity/Order.java`<br/>`entity/Payment.java`<br/>`entity/Cart.java`<br/>`entity/OrderItem.java` | OrderService<br/>CheckoutService<br/>RazorpayService⚠️ |
| **notification-service** | `controller/NotificationController.java` | `entity/Notification.java`<br/>`entity/Message.java`<br/>`entity/Conversation.java` | NotificationService<br/>MessagingService |

---

## 7. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway / Frontend               │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
     ┌─────v─────┐  ┌────v─────┐  ┌────v──────┐
     │ Auth Svc  │  │ User Svc  │  │ Farm Svc  │
     │ (login)   │  │ (KYC)     │  │ (mgmt)    │
     └───────────┘  └──────────┘  └───────────┘
           │              │              │
     ┌─────v──────────────v──────────────v──────┐
     │   Marketplace Service (Listings)         │
     │   - Seller verification integrated       │
     └────────────────┬─────────────────────────┘
                      │
              ┌───────v────────────────┐
              │   ORDER SERVICE ⭐     │  ← FRAUD MANAGEMENT HERE
              │  - Payment Verify ✅   │
              │  - Order Tracking      │
              │  - Cart Management     │
              └───────┬────────────────┘
                      │
              ┌───────v──────────────┐
              │ Notification Service │
              │ - Messaging Control  │
              └──────────────────────┘
                      │
              ┌───────v──────────────┐
              │  Razorpay Gateway    │
              │  (Signature Verify)  │
              └──────────────────────┘
```

---

## 8. KEY SECURITY OBSERVATIONS

| Area | Current | Gap |
|------|---------|-----|
| Payment | ✅ Razorpay signature verification | ⚠️ No pre-payment fraud checks |
| Identity | ✅ KYC document verification | ⚠️ Auto-resetting doesn't block sales |
| Access | ✅ Messaging role restrictions | ⚠️ No rate limiting |
| Orders | ✅ Amount tracking | ⚠️ No anomaly detection |
| Refunds | ✅ Tracking fields | ⚠️ No abuse detection |

