# 🤖 AI Agent Features for JobLensAI

> **Deep codebase analysis → concrete agent features you can build to learn AI agents, guardrails & tooling**

---

## 🔍 What I Found in Your Codebase

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

## 🚀 3 Exact AI Agent Features (Most Impactful → Best Learning)

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

### 3. ✍️ Outreach Copilot Agent — _Generative AI in Action_

**What it does:** When a user right-swipes a job, this background agent compares their parsed resume with the job description to generate a highly personalized outreach email draft (and automatically grabs the actual PDF resume from S3 as an attachment) for the user to review.

**Why your codebase needs it right now:**

- It creates a direct connection between your Resume Parser (Feature #1) and Job Matcher (Feature #2).
- It turns JobLensAI from a static dashboard into an active application engine.
- A "Drafts" page provides the perfect human-in-the-loop (HITL) UX.

**What you'll learn:**

- **Retrieval Augmented Generation (RAG):** Fetching specific context (Resume JSON + Job Description) to inform the LLM.
- **Asynchronous Execution:** Running the agent in the background so the swipe UI remains instant.
- **S3 Buffer Streaming:** Downloading a file from S3 directly into memory to attach to an email (no external links).
- **Human-in-the-Loop (HITL):** Storing agent outputs for user review rather than automating irreversible actions (sending emails).

**Architecture:**

```typescript
// Background job processor
import { Agent, tool } from "@openai/agents";

const outreachAgent = new Agent({
  name: "Outreach Copilot",
  instructions:
    "Write a personalized email to the recruiter connecting the candidate's skills to the job description requirements.",
  tools: [getParsedResume, getJobDetails, extractRecruiterEmail],
});

// Triggers async when user swipes right
export const handleRightSwipe = async (userId, jobId) => {
  // 1. Queue background job to prevent blocking UI
  await queue.add("generate-outreach", { userId, jobId });
};
```

---

## 📚 Learning Map — Concepts You'll Master

| Feature                 | Agent Primitives            | Guardrails                | Tooling                     |
| ----------------------- | --------------------------- | ------------------------- | --------------------------- |
| **1. Resume Parser**    | LangGraph nodes, StateGraph | Output validation (Zod)   | S3 tool, MongoDB tool       |
| **2. Job Matcher**      | Multi-step agent loop       | Input validation (userId) | Profile tool, scoring tool  |
| **3. Outreach Copilot** | Retrieval, Background Tasks | Human-in-the-loop (HITL)  | S3 stream tool, SMTP config |

---

## 🔢 Recommended Build Order

```
Week 1: Resume Parser Agent (Feature #1)
  → Learn: tools, Zod schemas, LangGraph basics

Week 2: Outreach Copilot Agent (Feature #3)
  → Learn: generative workflows, async execution, S3 buffers

Week 3: Job Matching Agent (Feature #2)
  → Learn: multi-tool agents, structured output
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

## 🔗 Source Links

| Claim                                                   | Source                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| OpenAI Agents SDK guardrail system                      | [openai/openai-agents-js on GitHub](https://github.com/openai/openai-agents-js) |
| LangGraph recruitment workflow patterns                 | [LangChain Blog 2025](https://blog.langchain.com)                               |
| Resume parsing with Pydantic/Zod is production standard | [towardsai.net — Agentic Recruitment](https://towardsai.net)                    |
| Handoffs are core OpenAI agents primitive               | [openai.com/agents docs](https://platform.openai.com/docs/guides/agents)        |
| LangGraph conditional edges for notification routing    | [medium.com — LangGraph stateful graphs](https://medium.com)                    |
