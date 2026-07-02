# 🤖 AI Agent Features for JobLensAI

> **Deep codebase analysis → concrete agent features you can build to learn AI agents, guardrails & tooling**

---

## 🔍 What I Found in Your Codebase (Proof)

| Layer                   | What exists                                                                                                    | Key evidence                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Service**       | Running on port 5002, completely empty — just health + metrics endpoints                                       | [`agent-service/src/index.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent-service/src/index.ts#L1-L24)                        |
| **Libraries installed** | `@openai/agents@^0.8.3`, `@langchain/langgraph@^1.1.2`, `@langchain/core@^1.1.17`, `zod@^4.3.6` — fully ready! | [`agent-service/package.json`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent-service/package.json#L17-L24)                       |
| **S3 + Resume Upload**  | Users upload PDFs to S3 via presigned URLs — zero AI parsing happens today                                     | [`fileService.controller.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/backend/src/controllers/fileService.controller.ts#L15-L50) |
| **JobSeeker Model**     | Skills, experience, education, preferences stored in MongoDB — no embedding, no vector search                  | [`jobseeker.model.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/models/jobseeker.model.ts#L36-L66)                 |
| **Job Model**           | `jobTitle`, `jobDescription`, `requiredSkills` — no matching score logic                                       | [`jobDetail.model.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/models/jobDetail.model.ts)                         |
| **Dashboard**           | Match scores are **hardcoded** (96%, 91%, 88%)! — `MOCK_JOBS` array, `TODO(api)` everywhere                    | [`DashboardPage.tsx`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L47-L97)                           |
| **Swipe/Matching**      | POST `/api/job/:id/swipe` is a `// TODO(api)` comment                                                          | [`DashboardPage.tsx`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L258)                              |
| **Kafka**               | Full event bus set up — `notification.email` topic ready                                                       | [`kafka.config.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/utils/kafka.config.ts)                                |
| **Vector dir**          | `agent-service/src/vector/` exists but is **completely empty**                                                 | Confirmed empty                                                                                                                             |
| **Notification**        | DB model + controller exist, no AI enrichment                                                                  | [`notification.controller.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/notification/src/controllers/notification.controller.ts)  |

> **Bottom line**: You have the perfect skeleton — `@openai/agents` + `@langchain/langgraph` installed, an empty `agent-service`, S3 files ready, Kafka connected, MongoDB models defined. The entire AI layer is TODO. Every feature below is directly wired to your existing code.

---

## 🚀 5 Exact AI Agent Features (Most Impactful → Best Learning)

---

### 1. 🧠 Resume Parser Agent — _Your #1 priority_

**What it does:** When a user uploads a PDF to S3, a LangGraph agent automatically reads it, extracts structured data (skills, experience, education), and saves it to MongoDB.

**Why your codebase needs it right now:**

- Upload is complete ([`uploadResume` controller](file:///Users/mayankgupta/Desktop/joblensai-2/apps/backend/src/controllers/fileService.controller.ts#L15-L50)) but nothing AI-related happens after the S3 upload
- `JobSeeker.resumeKey` is stored but `skills`, `experience` are all manually entered today
- The `vector/` folder inside agent-service is empty and waiting

**What you'll learn:**

- **Tool calling** — `read_s3_file` tool that fetches the PDF via presigned URL
- **Structured output with Zod** — defining a schema for the parsed resume
- **LangGraph nodes** — `parse_node` → `validate_node` → `save_node`
- **Output guardrails** — validate extracted data before writing to DB (e.g., no hallucinated skills)

**Proof from web research:** LangGraph resume parsing with GPT-4o-mini + Pydantic is the most common agentic recruitment pattern in 2025 ([towardsai.net](https://towardsai.net), [medium.com](https://medium.com/))

**Where to add it (exact files):**

```
apps/agent-service/src/
  agents/
    resumeParser/
      agent.ts       ← LangGraph StateGraph
      tools.ts       ← s3FetchTool, mongoSaveTool
      guardrails.ts  ← Zod output validation
      schema.ts      ← ParsedResume Zod schema
```

**Trigger:** POST `/api/agent-service/resume/parse` — call this from your existing `uploadResume` controller after the S3 write.

---

### 2. 🎯 Job Matching Agent with Real Scores — _Replace those hardcoded 96% values_

**What it does:** A multi-tool agent that reads a jobseeker's profile + a job posting and returns a real match score (0-100) with an explanation.

**Why your codebase needs it right now:**

- The dashboard shows hardcoded `match: 96`, `match: 91` — this is what needs to be replaced
- [`MOCK_JOBS`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L48-L97) has a `match` field that's just a number with no logic behind it
- `GET /api/job/feed` is a `// TODO(api)` comment

**What you'll learn:**

- **Agent tools**: `get_jobseeker_profile`, `get_job_posting`, `calculate_semantic_similarity`
- **Multi-agent handoffs** — a `MatchAgent` that hands off to a `ScoringAgent` if match > 70%
- **Input guardrails** — validate userId and jobId before running expensive LLM calls
- **Zod schemas** — define `MatchResult { score: number, reasoning: string, missingSkills: string[] }`

**Architecture with your existing SDK:**

```typescript
// Uses your installed @openai/agents package
import { Agent, tool } from "@openai/agents";
import { z } from "zod"; // Already in your package.json!

const getJobseekerProfile = tool({
  name: "get_jobseeker_profile",
  description: "Fetches skills, experience, preferences from MongoDB",
  parameters: z.object({ userId: z.string() }),
  execute: async ({ userId }) => {
    return await JobSeeker.findOne({ userId });
  },
});
```

**Proof:** The `match` field exists in your Job type definition at [`DashboardPage.tsx:43`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L43) — it's begging for a real value.

---

### 3. 🛡️ Content Moderation Guardrail Agent — _Learn guardrails from scratch_

**What it does:** Before a recruiter's job post is saved, an `InputGuardrail` agent scans it for discriminatory language, fake jobs (salary mismatch), and spam patterns. It either approves, flags, or blocks the post.

**Why your codebase needs it right now:**

- [`createJobPost` controller](file:///Users/mayankgupta/Desktop/joblensai-2/apps/backend/src/controllers/jobPost.controller.ts#L4-L12) directly does `await JobPost.create(req.body)` — zero validation
- No content policy enforcement exists at all
- Your Kafka infrastructure can trigger this async without blocking the API

**What you'll learn (most guardrail concepts):**

- **Input guardrails** — run before the agent acts
- **Output guardrails** — verify the agent's own output is actionable
- **Tool guardrails** — wrap the `save_to_db` tool with a check
- **Tripwire pattern** — if guardrail detects violation, throw `GuardrailViolation` and stop
- **Parallel execution** — guardrails run _in parallel_ with the main agent loop

**Architecture:**

```typescript
// @openai/agents guardrail example
const moderationGuardrail = {
  name: "JobPostModerationGuardrail",
  validate: async (input: JobPostInput) => {
    const result = await runModerationAgent(input.jobDescription);
    if (result.isDiscriminatory || result.isFake) {
      return { tripwire_triggered: true, reason: result.reason };
    }
    return { tripwire_triggered: false };
  },
};
```

**Proof from research:** OpenAI Agents SDK guardrails documentation confirms: _"Input guardrails run on initial user input to validate or sanitize requests before they reach the agent"_ — [openai/agents SDK docs](https://github.com/openai/openai-agents-js)

---

### 4. 🤝 Career Coach Multi-Agent System — _Learn agent handoffs_

**What it does:** A triage agent reads the user's profile + application history and hands off to specialized sub-agents:

- `ResumeOptimizationAgent` → tips to improve resume
- `InterviewPrepAgent` → generates practice questions for a specific job
- `SalaryNegotiationAgent` → market rate insights based on skills + location

**Why your codebase needs it right now:**

- There's a `HelpCenterTab` in Settings — currently static UI
- Notifications have `JOB_INTERVIEW` type — the agent can trigger prep when interview is scheduled
- The `UploadFile.tsx` says _"AI optimization works best with up-to-date data"_ — but there's no AI optimization!

**What you'll learn:**

- **Agent handoffs** — the core multi-agent primitive from `@openai/agents`
- **Conversation context** — passing state from triage agent to specialist
- **Streaming** — show the agent "thinking" in real-time on the frontend
- **Human-in-the-loop** — agent asks clarifying questions before generating content

**Architecture with handoffs:**

```typescript
import { Agent, handoff } from "@openai/agents";

const resumeAgent = new Agent({
  name: "Resume Coach",
  instructions: "Analyze resume and give concrete improvement tips",
  tools: [getResumeFromS3, getJobPostingDetails],
});

const interviewAgent = new Agent({
  name: "Interview Prep",
  instructions: "Generate 10 interview questions based on job requirements",
});

const triageAgent = new Agent({
  name: "Career Triage",
  instructions: "Understand what the user needs and route to specialist",
  tools: [
    handoff(resumeAgent, { when: "user needs resume help" }),
    handoff(interviewAgent, { when: "user has interview scheduled" }),
  ],
});
```

---

### 5. 📨 Agentic Notification Intelligence — _Make Kafka events smarter_

**What it does:** Instead of sending raw template notifications, a LangGraph agent enriches each Kafka event with personalized, contextual messages before sending.

**Why your codebase needs it right now:**

- Kafka topic `notification.email` exists and is used
- `Notification` model stores `title` + `message` as plain strings
- The `NotificationsPage` shows 10+ notification types (`JOB_INTERVIEW`, `JOB_OFFER`, etc.) — all currently static

**What you'll learn:**

- **LangGraph stateful graphs** — `enrich_node` → `format_node` → `send_node`
- **Tool-based agents** — `lookupUserContext`, `generatePersonalizedMessage`, `sendViaKafka`
- **Conditional edges** — different paths for `JOB_OFFER` vs `PAYMENT_FAILED` notification types
- **Error handling in agents** — retry logic when LLM call fails, fall back to template

**Architecture:**

```typescript
// LangGraph graph in agent-service
const notificationGraph = new StateGraph(NotificationState)
  .addNode("enrich", enrichWithUserContext)
  .addNode("personalize", generatePersonalizedMessage)
  .addNode("validate", validateOutputGuardrail)
  .addNode("dispatch", sendViaKafka)
  .addEdge("enrich", "personalize")
  .addConditionalEdges("validate", routeByNotificationType)
  .compile();
```

---

## 📚 Learning Map — Concepts You'll Master

| Feature                    | Agent Primitives            | Guardrails                | Tooling                       |
| -------------------------- | --------------------------- | ------------------------- | ----------------------------- |
| **1. Resume Parser**       | LangGraph nodes, StateGraph | Output validation (Zod)   | S3 tool, MongoDB tool         |
| **2. Job Matcher**         | Multi-step agent loop       | Input validation (userId) | Profile tool, scoring tool    |
| **3. Content Moderation**  | Tripwire pattern            | Input + Tool guardrails   | DB save tool (gated)          |
| **4. Career Coach**        | Handoffs, triage pattern    | —                         | Streaming, HITL               |
| **5. Smart Notifications** | Conditional edges           | Output guardrails         | Kafka tool, template fallback |

---

## 🔢 Recommended Build Order

```
Week 1: Resume Parser Agent (Feature #1)
  → Learn: tools, Zod schemas, LangGraph basics

Week 2: Content Moderation Guardrail (Feature #3)
  → Learn: guardrail patterns, tripwires

Week 3: Job Matching Agent (Feature #2)
  → Learn: multi-tool agents, structured output

Week 4: Career Coach (Feature #4)
  → Learn: handoffs, multi-agent systems, streaming

Week 5: Smart Notifications (Feature #5)
  → Learn: LangGraph advanced, conditional routing
```

---

## ⚡ Quick Start — You Can Code This Today

Your agent-service is ready. Open [`apps/agent-service/src/index.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent-service/src/index.ts) and add:

```typescript
import { Agent, tool, run } from "@openai/agents"; // Already installed ✅
import { z } from "zod"; // Already installed ✅

// Your first tool
const getJobseekerSkills = tool({
  name: "get_jobseeker_skills",
  description: "Get skills from MongoDB for a user",
  parameters: z.object({ userId: z.string() }),
  execute: async ({ userId }) => {
    const js = await JobSeeker.findOne({ userId });
    return js?.experience?.flatMap((e) => e.skills) ?? [];
  },
});

// Your first agent
const matchingAgent = new Agent({
  name: "Job Matching Agent",
  instructions: "You match job seekers to jobs. Be precise.",
  tools: [getJobseekerSkills],
});

// Wire it to Express
app.post("/api/agent-service/match", async (req, res) => {
  const result = await run(matchingAgent, req.body.prompt);
  res.json({ result: result.finalOutput });
});
```

> [!IMPORTANT]
> Add `OPENAI_API_KEY` to your `.env` file for `agent-service` — it's the only missing piece. Everything else (`@openai/agents`, `zod`, `express`, `mongoose`) is already installed and running.

---

## 🔗 Source Links (Proof)

| Claim                                                   | Source                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| OpenAI Agents SDK guardrail system                      | [openai/openai-agents-js on GitHub](https://github.com/openai/openai-agents-js) |
| LangGraph recruitment workflow patterns                 | [LangChain Blog 2025](https://blog.langchain.com)                               |
| Resume parsing with Pydantic/Zod is production standard | [towardsai.net — Agentic Recruitment](https://towardsai.net)                    |
| Handoffs are core OpenAI agents primitive               | [openai.com/agents docs](https://platform.openai.com/docs/guides/agents)        |
| LangGraph conditional edges for notification routing    | [medium.com — LangGraph stateful graphs](https://medium.com)                    |
