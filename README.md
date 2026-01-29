# JobLens AI

> Tinder for Jobs - A swipe-based job matching platform where recruiters and job seekers can match, powered by AI-generated personalized outreach.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│    ┌──────────────────┐                           ┌──────────────────┐              │
│    │    Web App       │                           │   Mobile App     │              │
│    │   (React/Vite)   │                           │ (React Native)   │              │
│    │   Port: 5173     │                           │                  │              │
│    └────────┬─────────┘                           └────────┬─────────┘              │
│             │                                              │                         │
└─────────────┼──────────────────────────────────────────────┼─────────────────────────┘
              │              HTTP/REST + JWT                 │
              └──────────────────────┬───────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVICES                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                        Core API (Backend)                                    │    │
│  │                           Port: 5001                                         │    │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │    │
│  │  │                                                                      │    │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │    │
│  │  │  │ Better Auth  │  │   Jobs API   │  │  Swipe API   │              │    │    │
│  │  │  │              │  │              │  │              │              │    │    │
│  │  │  │ • Sign Up    │  │ • CRUD Jobs  │  │ • Record     │              │    │    │
│  │  │  │ • Sign In    │  │ • Search     │  │   Swipes     │              │    │    │
│  │  │  │ • Session    │  │ • Filters    │  │ • Detect     │              │    │    │
│  │  │  │ • OAuth      │  │              │  │   Matches    │              │    │    │
│  │  │  └──────────────┘  └──────────────┘  └──────┬───────┘              │    │    │
│  │  │                                             │                       │    │    │
│  │  │  ┌──────────────┐  ┌──────────────┐        │                       │    │    │
│  │  │  │ Profile API  │  │ Matches API  │        │                       │    │    │
│  │  │  │              │  │              │        │ On Match              │    │    │
│  │  │  │ • Resume     │  │ • Get Matches│        │    │                  │    │    │
│  │  │  │ • Skills     │  │ • History    │        │    ▼                  │    │    │
│  │  │  │ • Prefs      │  │              │     ┌──────────────┐           │    │    │
│  │  │  └──────────────┘  └──────────────┘     │Kafka Producer│           │    │    │
│  │  │                                          └──────┬───────┘           │    │    │
│  │  └─────────────────────────────────────────────────┼───────────────────┘    │    │
│  └────────────────────────────────────────────────────┼────────────────────────┘    │
│                                                       │                              │
│                          ┌────────────────────────────┼────────────────────────┐    │
│                          │                            ▼                        │    │
│                          │  ┌──────────────────────────────────────────────┐  │    │
│                          │  │                  KAFKA                        │  │    │
│                          │  │              (KRaft Mode)                     │  │    │
│                          │  │               Port: 9092                      │  │    │
│                          │  │                                               │  │    │
│                          │  │  Topics:                                      │  │    │
│                          │  │  ├── match.created                            │  │    │
│                          │  │  ├── email.send                               │  │    │
│                          │  │  ├── notification.push                        │  │    │
│                          │  │  └── payment.processed                        │  │    │
│                          │  └───────────────┬───────────────────────────────┘  │    │
│                          │                  │                                   │    │
│                          └──────────────────┼───────────────────────────────────┘    │
│                                             │                                        │
│            ┌────────────────────────────────┼────────────────────────────┐          │
│            │                                │                            │          │
│            ▼                                ▼                            ▼          │
│  ┌──────────────────┐            ┌──────────────────┐         ┌──────────────────┐  │
│  │  Agent Service   │            │  Notification    │         │ Payment Service  │  │
│  │   Port: 5002     │            │    Service       │         │   (Future)       │  │
│  │                  │            │   (Future)       │         │                  │  │
│  │ ┌──────────────┐ │            │ ┌──────────────┐ │         │ ┌──────────────┐ │  │
│  │ │Kafka Consumer│ │            │ │Kafka Consumer│ │         │ │Kafka Consumer│ │  │
│  │ └──────┬───────┘ │            │ └──────────────┘ │         │ └──────────────┘ │  │
│  │        │         │            │                  │         │                  │  │
│  │        ▼         │            │ • In-App Notifs  │         │ • Stripe/Razorpay│  │
│  │ ┌──────────────┐ │            │ • Push Notifs    │         │ • Subscriptions  │  │
│  │ │   AI Agent   │ │            │ • SMS (optional) │         │ • Invoices       │  │
│  │ │  (LLM API)   │ │            │                  │         │                  │  │
│  │ └──────┬───────┘ │            └──────────────────┘         └──────────────────┘  │
│  │        │         │                                                               │
│  │        ▼         │                                                               │
│  │ ┌──────────────┐ │                                                               │
│  │ │Email Service │ │                                                               │
│  │ │(Resend/SES)  │ │                                                               │
│  │ │              │ │                                                               │
│  │ │• Personalized│ │                                                               │
│  │ │  Email       │ │                                                               │
│  │ │• Attach CV   │ │                                                               │
│  │ └──────────────┘ │                                                               │
│  └──────────────────┘                                                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐          │
│   │     MongoDB      │      │      Redis       │      │  Mongo Express   │          │
│   │   Port: 27017    │      │   Port: 6379     │      │   Port: 8081     │          │
│   │                  │      │                  │      │                  │          │
│   │ Collections:     │      │ Usage:           │      │ • DB Admin UI    │          │
│   │ ├── users        │      │ • Session cache  │      │ • Dev only       │          │
│   │ ├── jobs         │      │ • Rate limiting  │      │                  │          │
│   │ ├── swipes       │      │ • Job cache      │      │                  │          │
│   │ ├── matches      │      │ • Online status  │      │                  │          │
│   │ ├── resumes      │      │                  │      │                  │          │
│   │ └── payments     │      │                  │      │                  │          │
│   └──────────────────┘      └──────────────────┘      └──────────────────┘          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐          │
│   │   LLM Provider   │      │  Email Provider  │      │ Payment Gateway  │          │
│   │                  │      │                  │      │                  │          │
│   │ • OpenAI API     │      │ • Resend         │      │ • Stripe         │          │
│   │ • Anthropic API  │      │ • AWS SES        │      │ • Razorpay       │          │
│   │ • Gemini API     │      │ • SendGrid       │      │                  │          │
│   └──────────────────┘      └──────────────────┘      └──────────────────┘          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Match Flow Sequence

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│   Web   │      │ Backend │      │  Kafka  │      │  Agent  │      │  Email  │
│   App   │      │   API   │      │         │      │ Service │      │Provider │
└────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
     │                │                │                │                │
     │ POST /swipe    │                │                │                │
     │ {jobId, right} │                │                │                │
     ├───────────────►│                │                │                │
     │                │                │                │                │
     │                │ Save swipe     │                │                │
     │                │ Check match    │                │                │
     │                │────────┐       │                │                │
     │                │        │       │                │                │
     │                │◄───────┘       │                │                │
     │                │                │                │                │
     │                │ Publish:       │                │                │
     │                │ match.created  │                │                │
     │                ├───────────────►│                │                │
     │                │                │                │                │
     │  { matched }   │                │  Consume       │                │
     │◄───────────────┤                │  event         │                │
     │                │                ├───────────────►│                │
     │                │                │                │                │
     │                │                │                │ Generate email │
     │                │                │                │ via LLM        │
     │                │                │                │────────┐       │
     │                │                │                │        │       │
     │                │                │                │◄───────┘       │
     │                │                │                │                │
     │                │                │                │ Send email     │
     │                │                │                │ + attach CV    │
     │                │                │                ├───────────────►│
     │                │                │                │                │
     │                │                │                │    Delivered   │
     │                │                │                │◄───────────────┤
     ▼                ▼                ▼                ▼                ▼
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web | 5173 | React/Vite frontend |
| Backend | 5001 | Core API with Better Auth |
| Agent Service | 5002 | AI email generation & sending |
| Kafka | 9092 | Event streaming (KRaft mode) |
| Redis | 6379 | Caching & rate limiting |
| MongoDB | 27017 | Primary database |
| Mongo Express | 8081 | DB admin UI (dev only) |

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Backend**: Node.js, Hono/Express
- **Authentication**: Better Auth (JWT)
- **Database**: MongoDB
- **Cache**: Redis
- **Message Broker**: Apache Kafka (KRaft)
- **AI**: OpenAI/Anthropic API
- **Email**: Resend/AWS SES

## Getting Started

```bash
# Start all services
docker compose -f docker-compose.dev.yaml up -d

# View logs
docker compose -f docker-compose.dev.yaml logs -f
```
