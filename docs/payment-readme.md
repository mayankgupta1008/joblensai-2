# Payment System - Complete Guide

> A simple guide to understand our enterprise-level payment implementation. Read this before your interview!

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Folder Structure](#folder-structure)
3. [How Payment Flow Works](#how-payment-flow-works)
4. [Pro-Level Features We Added](#pro-level-features-we-added)
5. [Security Features](#security-features)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Interview Questions & Answers](#interview-questions--answers)

---

## Quick Overview

**What is this?**

- A payment microservice that handles Razorpay payments
- When a user pays, we create an order, verify the payment, and give them a subscription

**Tech Stack Used:**

- Backend: Node.js + Express + TypeScript
- Database: MongoDB (to store payment records)
- Cache: Redis (to prevent duplicate payments)
- Payment Gateway: Razorpay
- API Gateway: Nginx (routes traffic + auth)

---

## Folder Structure

```
apps/payment/
├── src/
│   ├── controllers/
│   │   └── payment.controller.ts    # Main logic - create order, verify payment
│   ├── lib/
│   │   └── razorpay.ts              # Razorpay SDK setup
│   ├── middlewares/
│   │   └── payment.middleware.ts    # Idempotency (duplicate prevention)
│   ├── routes/
│   │   └── payment.route.ts         # API routes definition
│   └── index.ts                     # Server starts here
├── Dockerfile.dev                   # For development
├── Dockerfile.prod                  # For production (optimized)
└── package.json                     # Dependencies
```

**Simple Explanation:**

- `controller` = where the actual work happens (brain)
- `routes` = which URL does what (map)
- `middleware` = security checks before processing (security guard)
- `lib` = external service setup (tools)

---

## How Payment Flow Works

### Step-by-Step Flow (Remember this for interviews!)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────┘

USER                    FRONTEND                  BACKEND                RAZORPAY
 │                         │                         │                      │
 │  1. Click "Pay"         │                         │                      │
 │ ──────────────────────> │                         │                      │
 │                         │                         │                      │
 │                         │  2. Generate unique     │                      │
 │                         │     idempotency key     │                      │
 │                         │                         │                      │
 │                         │  3. POST /create-order  │                      │
 │                         │ ──────────────────────> │                      │
 │                         │                         │                      │
 │                         │                         │  4. Create order     │
 │                         │                         │ ──────────────────>  │
 │                         │                         │                      │
 │                         │                         │  5. Return order_id  │
 │                         │                         │ <──────────────────  │
 │                         │                         │                      │
 │                         │  6. Save to DB (PENDING)│                      │
 │                         │                         │                      │
 │                         │  7. Return order details│                      │
 │                         │ <────────────────────── │                      │
 │                         │                         │                      │
 │  8. Razorpay popup      │                         │                      │
 │ <────────────────────── │                         │                      │
 │                         │                         │                      │
 │  9. User pays           │                         │                      │
 │ ──────────────────────────────────────────────────────────────────────>  │
 │                         │                         │                      │
 │  10. Payment response   │                         │                      │
 │ <──────────────────────────────────────────────────────────────────────  │
 │                         │                         │                      │
 │                         │  11. POST /verify-order │                      │
 │                         │      (with signature)   │                      │
 │                         │ ──────────────────────> │                      │
 │                         │                         │                      │
 │                         │                         │  12. Verify signature│
 │                         │                         │      using crypto    │
 │                         │                         │                      │
 │                         │                         │  13. If valid:       │
 │                         │                         │      - Update PENDING│
 │                         │                         │        to SUCCESS    │
 │                         │                         │      - Create        │
 │                         │                         │        subscription  │
 │                         │                         │                      │
 │                         │  14. Success response   │                      │
 │                         │ <────────────────────── │                      │
 │                         │                         │                      │
 │  15. Show success       │                         │                      │
 │ <────────────────────── │                         │                      │
 │                         │                         │                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### In Simple Words:

1. User clicks "Pay Now"
2. Frontend generates a unique key (idempotency key) - prevents double payment
3. Backend asks Razorpay to create an order
4. User pays through Razorpay popup
5. After payment, we verify it's legit using cryptographic signature
6. If verified, we give user a subscription

---

## Pro-Level Features We Added

### 1. Idempotency (Duplicate Payment Prevention)

**What is it?**
If a user accidentally clicks "Pay" twice or network glitches cause retries, they should NOT be charged twice.

**How we implemented it:**

```typescript
// Frontend generates ONE unique key per payment attempt
const idempotencyKey = useMemo(() => cuid(), []); // Only generated ONCE

// This key is sent with every request
headers: { 'X-Idempotency-Key': idempotencyKey }
```

**Backend checks (3-level protection):**

```
Level 1: Check if order already exists in database
         → If yes, return existing order (don't create new)

Level 2: Check Redis lock
         → If another request is processing same key, return 409 (Conflict)

Level 3: Create Redis lock before processing
         → Lock expires in 60 seconds (auto-cleanup)
```

**Why?**

- Database check = handles completed payments
- Redis lock = handles in-flight payments (network retries)
- 60-second expiry = auto-recovery if server crashes

---

### 2. Distributed Locking with Redis

**Problem:** What if two servers process the same payment?

**Solution:** Redis distributed lock

```typescript
// Try to acquire lock (only one server can get it)
const lockAcquired = await redis.set(
  `lock:idempotency:${key}`,
  "locked",
  "EX",
  60, // Expires in 60 seconds
  "NX", // Only set if NOT exists
);

if (!lockAcquired) {
  return res.status(409).json({ message: "Request already processing" });
}

// Process payment...

// Release lock when done
res.on("finish", async () => {
  await redis.del(`lock:idempotency:${key}`);
});
```

**Why?**

- Works across multiple servers (horizontal scaling)
- Auto-expires if server crashes (no deadlock)
- Industry standard pattern (Amazon, Stripe use this)

---

### 3. Cryptographic Signature Verification

**Problem:** How do we know the payment response is really from Razorpay? (What if someone sends a fake "payment successful"?)

**Solution:** HMAC-SHA256 signature verification

```typescript
// Razorpay sends: order_id, payment_id, signature

// We recreate the signature using our secret key
const expectedSignature = crypto
  .createHmac("sha256", RAZORPAY_SECRET)
  .update(order_id + "|" + payment_id)
  .digest("hex");

// Compare our signature with what Razorpay sent
if (expectedSignature !== razorpay_signature) {
  // FAKE REQUEST! Reject it
  return res.status(400).json({ message: "Invalid signature" });
}
```

**Why?**

- Impossible to fake without knowing our secret key
- Used by all major payment gateways (Stripe, PayPal, etc.)
- Protects against payment fraud

---

### 4. Microservice Architecture

**What we did:**

- Payment is a separate service (runs on port 5004)
- Has its own Docker container
- Can be scaled independently
- Communicates via Nginx API Gateway

**Why?**

- If payment service crashes, other services keep running
- Can deploy payment updates without touching other services
- Can scale just the payment service if it gets more traffic

---

### 5. API Gateway Authentication

**Problem:** Anyone can call our payment API!

**Solution:** Nginx validates every request before reaching payment service

```nginx
location /api/payment/ {
    # First, validate the user's token
    auth_request /_validate_token;

    # Extract user info from auth response
    auth_request_set $user_id $upstream_http_x_user_id;

    # Forward user info to payment service
    proxy_set_header X-User-Id $user_id;

    # Forward the request
    proxy_pass http://payment_service;
}
```

**Why?**

- Centralized auth (one place to change auth logic)
- Payment service doesn't need to handle auth (separation of concerns)
- Standard enterprise pattern

---

### 6. Production-Ready Docker Setup

**Multi-stage build (smaller, secure image):**

```dockerfile
# Stage 1: Build
FROM node:24-alpine AS build
# Install dependencies, compile TypeScript

# Stage 2: Production (ONLY what we need)
FROM node:24-alpine AS production
# Create non-root user (security)
RUN addgroup -g 1001 appgroup && adduser -u 1001 appuser
USER appuser  # Don't run as root!
# Copy only compiled code (no source code in production)
```

**Why?**

- Smaller image = faster deployment
- Non-root user = security best practice
- No source code in production = security

---

### 7. Proper Error Handling

**We handle errors at multiple levels:**

| Scenario                     | Status Code | Message                      |
| ---------------------------- | ----------- | ---------------------------- |
| Missing idempotency key      | 400         | "Idempotency key required"   |
| Duplicate request processing | 409         | "Request already processing" |
| Unauthorized                 | 401         | "User ID not found"          |
| Invalid signature            | 400         | "Invalid signature"          |
| Server error                 | 500         | "Internal Server Error"      |

**Why?**

- Proper HTTP status codes (industry standard)
- Generic error messages to users (don't leak internal info)
- Detailed logs for debugging

---

### 8. Health Checks

```typescript
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "payment" });
});
```

**Why?**

- Docker/Kubernetes can check if service is alive
- Load balancer can route traffic away from unhealthy instances
- Monitoring tools can alert when service is down

---

## Security Features

### Summary Table:

| Feature                | What it prevents            |
| ---------------------- | --------------------------- |
| Signature verification | Fake payment confirmations  |
| Idempotency keys       | Double charging             |
| Redis locks            | Race conditions             |
| Token auth via Nginx   | Unauthorized access         |
| Non-root Docker user   | Container escape attacks    |
| Environment variables  | Credential exposure in code |
| Unique DB constraints  | Duplicate records           |

---

## Database Models

### Payment Model

```typescript
{
  userId: ObjectId,           // Who made the payment
  amount: Number,             // Amount in rupees
  currency: String,           // "INR"
  paymentStatus: String,      // "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
  razorpayOrderId: String,    // Razorpay's order ID (UNIQUE)
  razorpayPaymentId: String,  // Razorpay's payment ID
  razorpaySignature: String,  // For verification
  idempotencyKey: String,     // Prevents duplicates (UNIQUE)
  paymentDate: Date           // When payment was made
}
```

### Subscription Model

```typescript
{
  userId: ObjectId,           // Who owns the subscription
  plan: String,               // Plan name
  startDate: Date,            // When it starts
  endDate: Date,              // When it expires (startDate + 30 days)
  status: String              // "ACTIVE"
}
```

---

## API Endpoints

| Endpoint                    | Method | Auth Required | Purpose                              |
| --------------------------- | ------ | ------------- | ------------------------------------ |
| `/api/payment/health`       | GET    | No            | Health check                         |
| `/api/payment/create-order` | POST   | Yes           | Create Razorpay order                |
| `/api/payment/verify-order` | POST   | Yes           | Verify payment & create subscription |

### Create Order Request:

```json
{
  "amount": 999,
  "currency": "INR"
}
```

### Create Order Response:

```json
{
  "orderId": "order_xyz123",
  "amount": 99900,
  "currency": "INR"
}
```

### Verify Order Request:

```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_here"
}
```

---

## Interview Questions & Answers

### Q1: "How do you prevent duplicate payments?"

**Answer:**
"We use a 3-level protection system:

1. First, we check the database if an order with the same idempotency key exists
2. Then, we use Redis distributed locks to prevent race conditions
3. The frontend generates the idempotency key once using `useMemo`, so even if the user clicks multiple times, same key is sent

This is the same pattern used by Stripe and Amazon."

---

### Q2: "How do you verify payments are legitimate?"

**Answer:**
"We use HMAC-SHA256 cryptographic verification. Razorpay sends us a signature which is created using their secret key. We recreate the same signature using our copy of the secret key. If they match, the payment is legitimate. If someone tries to send fake payment data, they can't create a valid signature without knowing our secret key."

---

### Q3: "Why did you use Redis for locking?"

**Answer:**
"Because we're running in a microservice architecture, we might have multiple instances of the payment service. If we used in-memory locks, each instance would have its own lock, and duplicate payments could still happen. Redis provides a distributed lock that works across all instances. We use the `SET key value EX 60 NX` command - `NX` means 'only set if not exists' and `EX 60` means 'expire after 60 seconds' to prevent deadlocks."

---

### Q4: "How is the payment service secured?"

**Answer:**
"Multiple layers:

1. Nginx API Gateway validates JWT tokens before forwarding requests
2. User ID is passed securely via headers (not from client)
3. We use environment variables for secrets
4. Docker runs with non-root user
5. Database has unique constraints
6. All payments are linked to authenticated users"

---

### Q5: "Explain the microservice architecture"

**Answer:**
"The payment service is completely independent:

- Runs on its own port (5004)
- Has its own Docker container
- Shares database models via a shared package
- Communicates through Nginx API Gateway
- Has its own health checks

Benefits: Can scale independently, deploy independently, and if it crashes, other services keep working."

---

### Q6: "What happens if the server crashes during payment?"

**Answer:**
"We handle this gracefully:

- Payment is saved as 'PENDING' before calling Razorpay
- Redis lock expires in 60 seconds (no deadlock)
- When user retries with same idempotency key, we detect it
- We can also set up webhooks to get notified by Razorpay"

---

### Q7: "Why HMAC-SHA256 and not just comparing IDs?"

**Answer:**
"Just comparing IDs would be insecure because anyone could guess or find order IDs. HMAC-SHA256 creates a unique fingerprint using our secret key. Only Razorpay and our server know this key, so the signature can't be forged. It's the industry standard for webhook verification."

---

## Quick Revision Points

Before interview, remember these keywords:

1. **Idempotency** - Same request = Same result (no duplicates)
2. **Distributed Lock** - Redis lock works across multiple servers
3. **HMAC-SHA256** - Cryptographic signature verification
4. **Microservice** - Independent service, own container, own deployment
5. **API Gateway** - Nginx handles auth before reaching payment service
6. **Multi-stage Docker build** - Smaller, secure production images
7. **Non-root user** - Security best practice for containers

---

## Files to Read Before Interview

1. `src/middlewares/payment.middleware.ts` - Idempotency implementation
2. `src/controllers/payment.controller.ts` - Core payment logic
3. `infra/nginx/nginx.conf` - API Gateway setup
4. `Dockerfile.prod` - Production Docker setup

---

**You've got this! The implementation follows industry best practices used by companies like Stripe, Amazon, and Razorpay themselves.**
