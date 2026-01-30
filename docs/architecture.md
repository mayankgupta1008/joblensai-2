# JobLens AI - Architecture

## Overview

JobLens AI is a "Tinder for Jobs" platform where job seekers and recruiters can swipe on each other. When there's a mutual match, an AI agent generates personalized emails and sends them to the respective parties.

---

## System Architecture

```
                    ┌─────────────────┐
                    │   Web / Mobile  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  API Gateway    │  (optional, or just backend directly)
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Backend    │   │    Agent      │   │   Payment     │
│    Service    │   │    Service    │   │   Service     │
│               │   │               │   │               │
│ • Better Auth │   │ • AI emails   │   │ • Stripe      │
│ • Swipe logic │   │ • Resume gen  │   │ • Subscriptions│
│ • Matching    │   │ • OpenAI/Claude│  │               │
│ • User CRUD   │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────▼───────┐
                    │     KAFKA     │
                    └───────────────┘
                            │
                    ┌───────▼───────┐
                    │   Database    │  (PostgreSQL / MongoDB)
                    │   + Redis     │  (caching, sessions)
                    │   + S3        │  (resume storage)
                    └───────────────┘
```

---

## Microservices

| Service         | Responsibility                                      | Tech Stack                |
| --------------- | --------------------------------------------------- | ------------------------- |
| Backend Service | Auth, user management, swipe logic, matching        | Node.js, Better Auth      |
| Agent Service   | AI-powered email generation, resume processing      | Node.js, OpenAI/Claude    |
| Payment Service | Subscriptions, billing, premium features            | Node.js, Stripe           |
| Web App         | Browser-based frontend                              | Next.js / React           |
| Mobile App      | iOS/Android application                             | React Native / Expo       |

---

## Kafka Topics

| Topic           | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `matches`       | When a match occurs (both parties swiped right)      |
| `notifications` | In-app notifications, push notifications             |
| `emails`        | Email sending queue (agent service → email worker)   |
| `swipes`        | Track all swipe events for analytics (optional)      |
| `payments`      | Payment events for premium features                  |

---

## Flow: Job Seeker Swipes Right on a Job Opening

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER SWIPES RIGHT ON JOB                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. WEB/MOBILE APP                                                          │
│     ─────────────────                                                       │
│     • User (job seeker) swipes right on job posting                         │
│     • POST /api/swipes { jobId: "xyz", direction: "right" }                 │
│     • JWT/session token attached (via Better Auth)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. BACKEND SERVICE                                                         │
│     ───────────────────                                                     │
│     • Validates auth token (Better Auth middleware)                         │
│     • Stores swipe: INSERT INTO swipes (user_id, job_id, direction, ...)    │
│     • Checks for MATCH: Did recruiter already swipe right on this user?     │
│                                                                             │
│     Query: SELECT * FROM swipes                                             │
│            WHERE job_id = 'xyz'                                             │
│            AND recruiter_id = job.recruiter_id                              │
│            AND target_user_id = current_user                                │
│            AND direction = 'right'                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              NO MATCH                         MATCH FOUND!
                    │                               │
                    ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────────┐
│  Return success              │  │  3. PUBLISH TO KAFKA                     │
│  { matched: false }          │  │     ────────────────────                 │
│                              │  │     Topic: "matches"                     │
│  (Swipe stored, waiting      │  │     Event: {                             │
│   for recruiter action)      │  │       type: "MATCH_CREATED",             │
└──────────────────────────────┘  │       jobSeekerId: "user123",            │
                                  │       recruiterId: "rec456",             │
                                  │       jobId: "xyz",                      │
                                  │       timestamp: "..."                   │
                                  │     }                                    │
                                  └──────────────────────────────────────────┘
                                                    │
                         ┌──────────────────────────┼──────────────────────────┐
                         │                          │                          │
                         ▼                          ▼                          ▼
┌─────────────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│  4. AGENT SERVICE               │ │  NOTIFICATION SERVICE   │ │  ANALYTICS SERVICE      │
│     ───────────────────         │ │  (could be in backend)  │ │  (optional)             │
│                                 │ │                         │ │                         │
│  • Consumes "matches" topic     │ │  • Consumes same topic  │ │  • Tracks match rates   │
│  • Fetches job seeker profile   │ │  • Sends push notif     │ │  • Stores metrics       │
│  • Fetches job details          │ │  • Updates in-app badge │ │                         │
│  • Generates personalized email │ │                         │ │                         │
│    using AI (OpenAI/Claude)     │ │                         │ │                         │
│  • Attaches resume from storage │ │                         │ │                         │
│  • Sends email to recruiter     │ │                         │ │                         │
└─────────────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. AGENT SERVICE - EMAIL GENERATION                                        │
│     ──────────────────────────────────                                      │
│                                                                             │
│     AI Prompt: "Generate a professional email introducing {candidate_name}  │
│                for the {job_title} position. Highlight relevant skills:     │
│                {skills}. Keep it concise and professional."                 │
│                                                                             │
│     Output: Personalized email + attached resume → Sent via SendGrid/SES    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flow: Recruiter Swipes Right on a Job Seeker

The flow is similar but in reverse:

1. **Recruiter swipes right** on a candidate's profile
2. **Backend checks** if the job seeker already swiped right on this job
3. **If match found** → Kafka event published
4. **Agent Service** generates personalized email to the job seeker
5. **Email sent** to job seeker notifying them of the match

---

## Database Schema (Simplified)

```sql
-- Users table (job seekers and recruiters)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('job_seeker', 'recruiter') NOT NULL,
    profile JSONB,
    resume_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    recruiter_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements JSONB,
    location VARCHAR(255),
    salary_range JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Swipes table
CREATE TABLE swipes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    target_type ENUM('job', 'user') NOT NULL,
    target_id UUID NOT NULL,
    direction ENUM('left', 'right') NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY,
    job_seeker_id UUID REFERENCES users(id),
    recruiter_id UUID REFERENCES users(id),
    job_id UUID REFERENCES jobs(id),
    status ENUM('pending', 'email_sent', 'responded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Key Design Decisions

1. **Better Auth for Authentication** - Handles auth flows, but business logic remains in backend service
2. **Kafka for Event-Driven Architecture** - Decouples services, enables async processing
3. **Match Check is Synchronous** - Happens in backend before publishing to Kafka
4. **Email Generation is Async** - Agent service handles this in background via Kafka consumers
5. **Idempotent Consumers** - Kafka consumers handle duplicate messages gracefully
