# Auth System - Complete Guide

> A simple guide to understand our enterprise-level authentication implementation. Read this before your interview!

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Folder Structure](#folder-structure)
3. [How Authentication Works](#how-authentication-works)
4. [Pro-Level Features We Added](#pro-level-features-we-added)
5. [Security Features](#security-features)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [Interview Questions & Answers](#interview-questions--answers)

---

## Quick Overview

**What is this?**

- An authentication microservice that handles user login/signup
- Supports both email/password and Google OAuth login
- Issues JWT tokens (access + refresh) for secure API access
- Handles password reset via email

**Tech Stack Used:**

- Backend: Node.js + Express + TypeScript
- Database: MongoDB (to store users & tokens)
- Auth: JWT with RS256 (RSA encryption)
- OAuth: Google OAuth 2.0 via Passport.js
- Password Hashing: bcrypt
- API Gateway: Nginx (rate limiting + token validation)
- Email: Nodemailer

---

## Folder Structure

```
apps/auth/
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts     # All auth logic (login, register, etc.)
│   ├── lib/
│   │   ├── auth.config.ts         # Google OAuth setup
│   │   ├── jwt.ts                 # Token generation & cookies
│   │   └── resetPasswordEmail.ts  # Email sending
│   ├── routes/
│   │   └── auth.route.ts          # API endpoints
│   └── index.ts                   # Server starts here
├── Dockerfile.dev                 # For development
├── Dockerfile.prod                # For production
└── package.json                   # Dependencies
```

**Simple Explanation:**

- `controller` = where the actual work happens (brain)
- `routes` = which URL does what (map)
- `lib` = helper functions and external service setup (tools)

---

## How Authentication Works

### The Complete Auth Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REGISTRATION & LOGIN FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────┐
                          │    User Browser     │
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
     │  Email/Pass    │    │  Google OAuth  │    │  Forgot Pass   │
     │    Login       │    │     Login      │    │                │
     └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
             │                     │                     │
             ▼                     ▼                     ▼
     ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
     │ 1. Check email │    │ 1. Redirect to │    │ 1. Generate    │
     │ 2. Verify pass │    │    Google      │    │    reset token │
     │    (bcrypt)    │    │ 2. Get profile │    │ 2. Hash & save │
     │ 3. Generate    │    │ 3. Create/find │    │ 3. Send email  │
     │    tokens      │    │    user        │    │                │
     └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
             │                     │                     │
             └──────────┬──────────┘                     │
                        ▼                                │
              ┌─────────────────┐                        │
              │ Set HTTP-only   │                        │
              │ Cookies:        │                        │
              │ - accessToken   │                        │
              │ - refreshToken  │                        │
              └────────┬────────┘                        │
                       │                                 │
                       ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐
              │ User is now     │              │ User clicks     │
              │ authenticated!  │              │ email link      │
              └─────────────────┘              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Set new password│
                                              │ & clear token   │
                                              └─────────────────┘
```

### Token Refresh Flow (Super Important!)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOKEN REFRESH FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

USER                      FRONTEND                   NGINX                 AUTH SERVICE
 │                           │                         │                        │
 │  1. Makes API request     │                         │                        │
 │ ─────────────────────────>│                         │                        │
 │                           │  2. Request with        │                        │
 │                           │     accessToken cookie  │                        │
 │                           │ ───────────────────────>│                        │
 │                           │                         │  3. Validate token     │
 │                           │                         │ ──────────────────────>│
 │                           │                         │                        │
 │                           │                         │  4. Token EXPIRED!     │
 │                           │                         │     Return 401         │
 │                           │                         │ <──────────────────────│
 │                           │  5. 401 Unauthorized    │                        │
 │                           │ <───────────────────────│                        │
 │                           │                         │                        │
 │                           │  6. Axios interceptor   │                        │
 │                           │     catches 401         │                        │
 │                           │                         │                        │
 │                           │  7. POST /auth/refresh  │                        │
 │                           │     (with refreshToken) │                        │
 │                           │ ───────────────────────────────────────────────>│
 │                           │                         │                        │
 │                           │                         │  8. Verify refresh     │
 │                           │                         │     token              │
 │                           │                         │  9. Check DB (not      │
 │                           │                         │     revoked?)          │
 │                           │                         │ 10. Issue NEW          │
 │                           │                         │     accessToken        │
 │                           │                         │                        │
 │                           │ 11. New accessToken     │                        │
 │                           │     cookie + user data  │                        │
 │                           │ <───────────────────────────────────────────────│
 │                           │                         │                        │
 │                           │ 12. RETRY original      │                        │
 │                           │     request with new    │                        │
 │                           │     accessToken         │                        │
 │                           │ ───────────────────────>│                        │
 │                           │                         │                        │
 │  13. Success!             │                         │                        │
 │ <─────────────────────────│                         │                        │
 │                           │                         │                        │
└─────────────────────────────────────────────────────────────────────────────┘

This happens automatically! User doesn't even notice.
```

### In Simple Words:

1. User logs in (email/password OR Google)
2. Server gives 2 tokens as cookies:
   - **Access Token** - short-lived (15 mins) - used for API calls
   - **Refresh Token** - long-lived (7 days) - used to get new access tokens
3. When access token expires, frontend automatically refreshes it
4. User stays logged in for 7 days without re-entering password!

---

## Pro-Level Features We Added

### 1. RS256 JWT (Asymmetric Encryption)

**What is it?**

Most tutorials use HS256 (symmetric) where the same secret signs AND verifies tokens. We use RS256 (asymmetric) with a **private key** to sign and a **public key** to verify.

```typescript
// We use RSA key pair (industry standard)
const JWT_PRIVATE_KEY = Buffer.from(
  process.env.JWT_PRIVATE_KEY_BASE64!,
  "base64"
).toString("utf8");

export const JWT_PUBLIC_KEY = Buffer.from(
  process.env.JWT_PUBLIC_KEY_BASE64!,
  "base64"
).toString("utf8");

// Sign with private key
jwt.sign(payload, JWT_PRIVATE_KEY, { algorithm: "RS256" });

// Verify with public key (can be shared!)
jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ["RS256"] });
```

**Why?**

- Public key can be shared with other services (they can verify but NOT create tokens)
- Private key stays only in auth service
- More secure for microservices architecture
- Used by Google, Facebook, Auth0

---

### 2. Dual Token System (Access + Refresh)

**The Problem:** If access token has long expiry → security risk (if stolen, attacker has access for long)
If access token has short expiry → bad UX (user has to login frequently)

**Our Solution:**

| Token         | Expiry    | Storage         | Purpose             |
| ------------- | --------- | --------------- | ------------------- |
| Access Token  | 15 mins   | httpOnly cookie | Used for API calls  |
| Refresh Token | 7 days    | httpOnly cookie | Get new access token |
|               |           | + MongoDB       | (for revocation)    |

```typescript
// Access token - short lived
export const signAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role, type: "access" }, JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "15m", // Only 15 minutes!
    issuer: "joblensai-auth",
    audience: "joblensai",
  });
};

// Refresh token - long lived but stored in DB for revocation
export const signRefreshToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role, type: "refresh" }, JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "7d", // 7 days
    issuer: "joblensai-auth",
    audience: "joblensai",
  });
};
```

**Why?**

- If access token is stolen, attacker only has 15 mins
- Refresh tokens are stored in DB, so we can revoke them (logout from all devices)
- Best of both worlds: security + good UX

---

### 3. Token Revocation (Logout from All Devices)

**Problem:** JWTs are stateless. Once issued, they're valid until expiry. How to logout?

**Solution:** Store refresh tokens in database. On logout, delete from DB.

```typescript
// When user logs in - store refresh token
await RefreshToken.create({
  token: refreshToken,
  userId,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

// When refreshing - check if token exists in DB
const storedToken = await RefreshToken.findOne({ token: refreshToken });
if (!storedToken) {
  return res.status(401).json({ message: "Token revoked or expired" });
}

// When user logs out - delete from DB
await RefreshToken.deleteOne({ token: refreshToken });
```

**Why?**

- Can logout from all devices (delete all user's tokens)
- Can revoke compromised tokens
- Industry standard for enterprise apps

---

### 4. Automatic Token Cleanup (TTL Index)

**Problem:** Expired tokens pile up in database, wasting storage.

**Solution:** MongoDB TTL (Time-To-Live) index automatically deletes expired documents!

```typescript
// This tells MongoDB: "Delete this document when expiresAt passes"
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Why?**

- Zero maintenance - MongoDB handles cleanup automatically
- No cron jobs needed
- Database stays clean

---

### 5. Secure Cookie Configuration

```typescript
export const setAccessTokenCookie = (accessToken: string, res: Response) => {
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true, // JavaScript can't access (XSS protection)
    sameSite: "strict", // Only sent to same site (CSRF protection)
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  });
};
```

**Why each flag matters:**

| Flag       | What it does                    | Attack it prevents |
| ---------- | ------------------------------- | ------------------ |
| httpOnly   | JS can't read the cookie        | XSS attacks        |
| sameSite   | Cookie only sent to same origin | CSRF attacks       |
| secure     | Only sent over HTTPS            | Man-in-the-middle  |

---

### 6. Password Hashing with bcrypt

**NEVER store plain passwords!** We hash them with bcrypt.

```typescript
// Registration - hash password before saving
const salt = await bcrypt.genSalt(10); // 10 rounds of hashing
const hashedPassword = await bcrypt.hash(password, salt);

// Login - compare password with hash
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**Why bcrypt?**

- Includes salt automatically (prevents rainbow table attacks)
- Adjustable work factor (can increase as computers get faster)
- Industry standard for password hashing

---

### 7. Secure Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PASSWORD RESET SECURITY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. User requests reset
   └─> Generate random token (32 bytes)
   └─> Hash the token (SHA256) before storing in DB
   └─> Send UNHASHED token to user's email

2. User clicks email link
   └─> We receive the unhashed token
   └─> Hash it and compare with DB
   └─> If match + not expired → allow password change

Why hash the token?
- If database is compromised, attacker can't use stored hashed tokens
- They need the original token from the email
```

```typescript
// Generate and hash reset token
const resetToken = crypto.randomBytes(32).toString("hex");
const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

// Store HASHED token in DB
user.resetToken = hashedToken;
user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

// Send UNHASHED token to email
await sendPasswordResetEmail(email, resetToken);
```

**Why?**

- Even if DB is leaked, attacker can't reset passwords
- Token expires in 15 minutes
- One-time use (cleared after reset)

---

### 8. Google OAuth 2.0 Integration

```typescript
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/callback/google",
      scope: ["profile", "email"],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          profilePicture: profile.photos[0].value,
          role: req.query.state, // jobseeker or recruiter
        });
      }

      return done(null, user);
    }
  )
);
```

**Why?**

- Users don't need to remember another password
- We get verified email from Google
- Profile picture comes free
- More secure (Google handles password security)

---

### 9. Rate Limiting at Nginx Level

```nginx
# Limit to 5 requests per second per IP
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

location /api/auth/ {
    limit_req zone=auth_limit burst=10 nodelay;
    # ...
}
```

**Why?**

- Prevents brute force attacks (trying many passwords)
- Prevents account enumeration attacks
- Protects against DDoS
- Done at Nginx level (before hitting Node.js)

---

### 10. Nginx Auth Request Pattern

```nginx
# Protected routes use auth_request to validate tokens
location /api/backend/ {
    auth_request /_validate_token;  # First, validate token
    auth_request_set $user_id $upstream_http_x_user_id;
    auth_request_set $user_role $upstream_http_x_user_role;

    # Only if token is valid, forward to backend
    proxy_pass http://backend;
    proxy_set_header X-User-Id $user_id;      # Pass user info
    proxy_set_header X-User-Role $user_role;
}

location = /_validate_token {
    internal;  # Only nginx can call this
    proxy_pass http://auth/api/auth/validate;

    # Cache validation results for 5 minutes (performance!)
    proxy_cache auth_cache;
    proxy_cache_valid 200 5m;
}
```

**Why?**

- Centralized auth validation
- Each service doesn't need to validate tokens
- Caching reduces load on auth service
- User context passed via headers (services trust nginx)

---

### 11. Zod Validation

```typescript
export const RegisterSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["jobseeker", "recruiter"]),
    })
    .strict(), // No extra fields allowed!
});

// Middleware that validates
export const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({ body: req.body });
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.issues,
    });
  }
};
```

**Why?**

- Type-safe validation
- Clear error messages
- `.strict()` prevents extra field injection attacks
- Validates before hitting controller (fail fast)

---

### 12. Cascade Delete (Clean User Deletion)

```typescript
// When user is deleted, automatically delete their related data
userSchema.pre("findOneAndDelete", async function () {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    // Delete role-specific profile
    if (user.role === "jobseeker") {
      await mongoose.model("JobSeekerProfile").deleteOne({ userId: user._id });
    } else if (user.role === "recruiter") {
      await mongoose.model("RecruiterProfile").deleteOne({ userId: user._id });
    }
    // Delete all refresh tokens
    await mongoose.model("RefreshToken").deleteMany({ userId: user._id });
  }
});
```

**Why?**

- No orphaned data in database
- GDPR compliant (user deletion removes all their data)
- Automatic cleanup

---

### 13. Auto Token Refresh in Frontend

```typescript
// Axios interceptor - catches 401 errors automatically
axiosWrapper.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const { data } = await axiosWrapper.post("/auth/refresh");
        store.dispatch(setCredentials({ user: data.user }));

        // Retry the original request!
        return axiosWrapper(originalRequest);
      } catch {
        // Refresh failed, logout user
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);
```

**Why?**

- User never sees "session expired" errors
- Seamless experience
- Automatic retry of failed requests

---

## Security Features

### Summary Table:

| Feature                | What it prevents              |
| ---------------------- | ----------------------------- |
| RS256 JWT              | Token forgery                 |
| httpOnly cookies       | XSS attacks                   |
| sameSite: strict       | CSRF attacks                  |
| bcrypt hashing         | Password theft                |
| Token revocation       | Session hijacking             |
| Rate limiting          | Brute force attacks           |
| Hashed reset tokens    | DB leak exploitation          |
| Token expiry           | Long-term token theft         |
| Zod validation         | Input injection attacks       |
| HTTPS (secure flag)    | Man-in-the-middle attacks     |

---

## Database Models

### User Model

```typescript
{
  fullName: String,              // "John Doe"
  email: String,                 // "john@example.com" (UNIQUE)
  password: String,              // Hashed (select: false - hidden by default)
  role: String,                  // "jobseeker" | "recruiter"
  googleId: String,              // For OAuth users
  profilePicture: String,        // URL
  emailVerified: Boolean,        // Email verification status
  isProfileComplete: Boolean,    // Onboarding status
  resetToken: String,            // Hashed reset token
  resetTokenExpiry: Date,        // Token expiry time
  subscriptionId: ObjectId,      // Reference to Subscription
  timestamps: true               // createdAt, updatedAt
}
```

### Refresh Token Model

```typescript
{
  token: String,                 // The JWT refresh token (UNIQUE)
  userId: ObjectId,              // Who owns this token
  expiresAt: Date,               // When it expires
  createdAt: Date                // When it was created
}
// TTL Index: Auto-deletes when expiresAt passes!
```

### JobSeeker Profile Model

```typescript
{
  userId: ObjectId,              // Reference to User
  currentLocation: String,
  currentTitle: String,
  experienceYears: Number,
  bio: String,
  skills: [String],
  education: [{
    degree: String,
    university: String,
    graduationYear: Number
  }],
  experience: [{
    company: String,
    title: String,
    duration: String,
    description: String
  }],
  expectedSalary: {
    min: Number,
    max: Number,
    currency: String
  },
  linkedinUrl: String,
  githubUrl: String,
  resumeUrl: String
}
```

---

## API Endpoints

| Endpoint                        | Method | Auth | Purpose                    |
| ------------------------------- | ------ | ---- | -------------------------- |
| `/api/auth/register`            | POST   | No   | Register new user          |
| `/api/auth/login`               | POST   | No   | Login with email/password  |
| `/api/auth/google`              | GET    | No   | Start Google OAuth         |
| `/api/auth/callback/google`     | GET    | No   | Google OAuth callback      |
| `/api/auth/refresh`             | POST   | No   | Get new access token       |
| `/api/auth/logout`              | POST   | No   | Logout (revoke tokens)     |
| `/api/auth/forgot-password`     | POST   | No   | Request password reset     |
| `/api/auth/reset-password/:token` | POST | No   | Reset password             |
| `/api/auth/validate`            | GET    | Yes  | Validate token (internal)  |
| `/api/auth/profile`             | GET    | Yes  | Get user profile           |
| `/api/auth/profile`             | PUT    | Yes  | Update user profile        |
| `/api/auth/profile`             | DELETE | Yes  | Delete user account        |

### Example Requests:

**Register:**

```json
POST /api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "jobseeker"
}

Response (201):
{
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "jobseeker"
  }
}
+ Sets accessToken & refreshToken cookies
```

**Login:**

```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}

Response (200):
{
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "jobseeker",
    "profilePicture": null
  }
}
+ Sets accessToken & refreshToken cookies
```

**Refresh Token:**

```json
POST /api/auth/refresh
Cookie: refreshToken=...

Response (200):
{
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "role": "...",
    "profilePicture": null
  }
}
+ Updates accessToken cookie
```

---

## Interview Questions & Answers

### Q1: "Why did you use RS256 instead of HS256 for JWT?"

**Answer:**
"HS256 uses a single secret key for both signing and verification. RS256 uses asymmetric encryption - a private key to sign and a public key to verify. In our microservices architecture, only the auth service has the private key and can create tokens. Other services only have the public key to verify tokens - they can't create fake tokens. This follows the principle of least privilege and is how companies like Google and Auth0 do it."

---

### Q2: "How do you handle token refresh?"

**Answer:**
"We use a dual-token system:

1. Access token expires in 15 minutes (short-lived for security)
2. Refresh token expires in 7 days (stored in MongoDB for revocation)

When access token expires, the frontend axios interceptor catches the 401 error, calls /auth/refresh with the refresh token cookie, gets a new access token, and retries the original request. User doesn't even notice - it's seamless."

---

### Q3: "How do you implement logout if JWTs are stateless?"

**Answer:**
"We store refresh tokens in MongoDB. On logout, we delete the refresh token from the database and clear the cookies. While the access token is still technically valid for up to 15 minutes, it can't be refreshed anymore. For immediate logout, the short access token expiry means the window is very small. We can also force logout from all devices by deleting all refresh tokens for that user."

---

### Q4: "How do you protect against XSS and CSRF attacks?"

**Answer:**
"For XSS, we use httpOnly cookies - JavaScript can't access them, so even if an attacker injects malicious scripts, they can't steal the tokens. For CSRF, we use sameSite: 'strict' which means cookies are only sent when the request originates from our domain. Combined, these make it very hard to steal or misuse our auth tokens."

---

### Q5: "How do you handle password reset securely?"

**Answer:**
"When a user requests a password reset:

1. We generate a random 32-byte token
2. We hash it with SHA256 before storing in the database
3. We send the unhashed token to the user's email
4. When they click the link, we hash what they sent and compare with DB

This way, even if our database is compromised, attackers can't use the stored hashed tokens to reset passwords. The token also expires in 15 minutes and is single-use."

---

### Q6: "Why use bcrypt for password hashing?"

**Answer:**
"bcrypt is specifically designed for password hashing. It automatically includes a salt (preventing rainbow table attacks), has an adjustable work factor (can be increased as computers get faster), and is slow by design (makes brute force attacks impractical). We use 10 rounds which takes about 100ms - negligible for real users but makes mass cracking attempts very slow."

---

### Q7: "How does the nginx auth_request pattern work?"

**Answer:**
"When a request comes to a protected endpoint, nginx first makes an internal request to our auth service's /validate endpoint. If auth service returns 200, nginx forwards the request to the backend and includes X-User-Id and X-User-Role headers. If auth returns 401, nginx rejects the request immediately. We also cache auth responses for 5 minutes to reduce load on the auth service."

---

### Q8: "How do you handle OAuth users who later want to use password login?"

**Answer:**
"OAuth users don't have a password initially. If they try to login with email/password, we detect they don't have a password and tell them to either continue with Google or use 'Forgot Password' to set a password. The forgot password flow works the same - it sets a new password for them, and then they can use either method."

---

### Q9: "How do you ensure data cleanup when a user is deleted?"

**Answer:**
"We use Mongoose pre-hooks on the User model. Before deleting a user, we automatically delete their role-specific profile (JobSeekerProfile or RecruiterProfile) and all their refresh tokens. This ensures no orphaned data remains in the database and makes us GDPR compliant."

---

### Q10: "Why rate limiting at nginx instead of Node.js?"

**Answer:**
"Rate limiting at nginx is more efficient because it blocks requests before they even reach Node.js. This protects our application from brute force attacks, account enumeration, and DDoS. Nginx can handle many more requests per second than Node.js, so it's the right place to filter out malicious traffic. We allow 5 requests per second per IP with a burst of 10."

---

## Quick Revision Points

Before interview, remember these keywords:

1. **RS256** - Asymmetric JWT (private key signs, public key verifies)
2. **Dual Token System** - Access (15min) + Refresh (7 days)
3. **httpOnly + sameSite** - Cookie security flags
4. **bcrypt** - Password hashing with salt
5. **TTL Index** - MongoDB auto-deletes expired documents
6. **auth_request** - Nginx module for token validation
7. **Token Revocation** - Store refresh tokens in DB, delete on logout
8. **Cascade Delete** - Clean up related data when user is deleted

---

## Files to Read Before Interview

1. `src/lib/jwt.ts` - Token generation & cookie setup
2. `src/controllers/auth.controller.ts` - All auth logic
3. `src/lib/auth.config.ts` - Google OAuth setup
4. `packages/shared/src/models/user.model.ts` - User schema with hooks
5. `infra/nginx/nginx.conf` - Rate limiting & auth_request pattern

---

**You've got this! This auth system follows industry best practices used by companies like Google, Auth0, and Okta.**
