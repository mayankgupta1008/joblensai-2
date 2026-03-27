# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobLens AI is a "Tinder for Jobs" platform - a swipe-based job matching system where recruiters and job seekers can match, powered by AI-generated personalized outreach.

## Development Commands

### Local Development (Docker)

```bash
pnpm dev:up        # Start all services with Docker Compose
pnpm dev:down      # Stop services
pnpm dev:nuke      # Stop and remove volumes
pnpm dev:rebuild   # Rebuild without cache
```

### Testing

```bash
pnpm test          # Run tests in watch mode
pnpm test:run      # Run tests once
pnpm test:coverage # Run with coverage
pnpm test:ui       # Vitest UI
```

### Linting & Formatting

```bash
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint issues
pnpm format        # Format with Prettier
pnpm format:check  # Check formatting
```

### Build

```bash
pnpm --filter @joblensai/shared build  # Build shared package first
pnpm --filter <app-name> build         # Build specific app
```

### Run Individual Services

```bash
pnpm --filter backend dev       # Backend on :5001
pnpm --filter auth dev          # Auth on :5003
pnpm --filter web dev           # Web on :5173
pnpm --filter agent-service dev # Agent on :5002
pnpm --filter payment dev       # Payment on :5004
pnpm --filter notification dev  # Notification on :5005
```

## Architecture

### Monorepo Structure (pnpm workspaces)

**Apps** (`apps/`):

- `web` - React/Vite frontend with Redux, TailwindCSS, shadcn/ui
- `backend` - Core API (Express) - profiles, jobs, file service
- `auth` - Authentication service (JWT, Passport, Google OAuth)
- `agent-service` - AI email generation (LangChain/LangGraph)
- `payment` - Razorpay integration, subscriptions
- `notification` - Socket.io for real-time, email via Nodemailer

**Packages** (`packages/`):

- `@joblensai/shared` - Shared models (Mongoose), Kafka config, Redis, S3, Zod schemas, metrics
- `@joblensai/eslint-config` - Shared ESLint configs for Node.js and React

### Data Flow

1. Web/Mobile → Nginx (port 80) → routes to appropriate service
2. Services communicate via Kafka events (match.created, email.send, etc.)
3. Agent service consumes match events → generates AI email → sends via Resend/SES

### Infrastructure

- MongoDB (primary database)
- Redis (caching, rate limiting, Socket.io adapter)
- Kafka (event streaming, KRaft mode)
- MinIO (S3-compatible file storage)
- Prometheus metrics exposed at `/api/<service>/metrics`

## Code Conventions

### TypeScript

- ES Modules (`"type": "module"`)
- Path aliases: `@/*` maps to `./src/*` in backend services
- Strict mode enabled

### Import Pattern for Shared Package

```typescript
// From within apps - use full path with .js extension
import { connectDB } from "@joblensai/shared/src/utils/db.config.js";
```

### API Routes

- Health check: `GET /api/<service>/health`
- Metrics: `GET /api/<service>/metrics`

### Testing

- Vitest with `mongodb-memory-server` for integration tests
- Test files: `*.test.ts` or in `src/tests/` directory
- Setup file at `src/tests/setup.ts`

## Environment Setup

- Node.js 24.13.0 (see `.nvmrc`)
- pnpm 10.28.2
- Copy `.env.example` to `.env`
- Each app has its own `.env` file in its directory

## Pre-commit Hooks

Husky runs `lint-staged` on commit:

- TypeScript files: ESLint fix + Prettier
- JSON/MD/CSS: Prettier only
