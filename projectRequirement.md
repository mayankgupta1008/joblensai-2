# 🤖 AI Agent Features for JobLensAI

> **Deep codebase analysis → concrete agent features you can build to learn AI agents, guardrails & tooling**

---

## 🔍 What I Found in Your Codebase

| Layer                   | What exists                                                                                                  | Key evidence                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Service**       | Running on port 5002, completely empty — just health + metrics endpoints                                     | [`agent/src/index.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent/src/index.ts#L1-L24)                                        |
| **Libraries installed** | `@langchain/langgraph@^1.1.2`, `@langchain/core@^1.2.20`, `@langchain/google@^0.2.12` (Gemini), `zod@^4.3.6` | [`agent/package.json`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent/package.json#L15-L26)                                       |
| **S3 + Resume Upload**  | Users upload PDFs to S3 via presigned URLs — zero AI parsing happens today                                   | [`fileService.controller.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/backend/src/controllers/fileService.controller.ts#L15-L50) |
| **JobSeeker Model**     | Skills, experience, education, preferences stored in MongoDB — no embedding, no vector search                | [`jobseeker.model.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/models/jobseeker.model.ts#L36-L66)                 |
| **Job Model**           | `jobTitle`, `jobDescription`, `requiredSkills` — no matching score logic                                     | [`jobDetail.model.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/models/jobDetail.model.ts)                         |
| **Dashboard**           | Match scores are **hardcoded** (96%, 91%, 88%)! — `MOCK_JOBS` array, `TODO(api)` everywhere                  | [`DashboardPage.tsx`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L47-L97)                           |
| **Swipe/Matching**      | POST `/api/job/:id/swipe` is a `// TODO(api)` comment                                                        | [`DashboardPage.tsx`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/web/src/pages/DashboardPage.tsx#L258)                              |
| **Kafka**               | Full event bus set up — `notification.email` topic ready                                                     | [`kafka.config.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/packages/shared/src/utils/kafka.config.ts)                                |
| **Vector dir**          | `agent/src/vector/` exists but is **completely empty**                                                       | Confirmed empty                                                                                                                             |
| **Notification**        | DB model + controller exist, no AI enrichment                                                                | [`notification.controller.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/notification/src/controllers/notification.controller.ts)  |

> **Bottom line**: You have the perfect skeleton — LangGraph + Gemini (`@langchain/google`) installed, an empty `agent`, S3 files ready, Kafka connected, MongoDB models defined. The entire AI layer is TODO. Every feature below is directly wired to your existing code.

---

## 🧰 Stack Decision (updated 2026-10-22)

**One framework: LangGraph** (`@langchain/langgraph` + `@langchain/core`).

- `@openai/agents` was removed.
- The `langchain` meta-package is not installed, because LangGraph already covers every feature below:
  - `StateGraph` for fixed workflows.
  - `createReactAgent` for tool-using agents.
  - `interrupt()` + checkpointers for human approval.

**Model: Gemini**, through `@langchain/google` (`ChatGoogle`, which reads `GOOGLE_API_KEY`).

- Google recommends `gemini-3.8-flash` or `gemini-3.5-flash-lite` for new projects. Both have a free tier.

**Free-tier privacy:** Google's pricing page marks free-tier prompts as "Used to improve our products: Yes"; the paid tier says "No".

- Develop with test résumés only.
- Move to the paid tier, or another provider, before real users.

**Switching models later** is one package plus one import. For example, `@langchain/openrouter` (`ChatOpenRouter`) puts many providers behind one key.

**Verified:** samples #1, #2 and #4–#7 below were type-checked (`tsc`) against the installed versions: core 1.2.20, langgraph 1.2.6, google 0.2.12, zod 4.3.6. Sample #3 and the Quick Start use the same APIs.

---

## 🚀 3 Exact AI Agent Features (Most Impactful → Best Learning)

---

### 1. 🧠 Resume Parser Agent — _Your #1 priority_

**What it does:** When a user uploads a PDF to S3, a LangGraph agent automatically reads it, extracts structured data (skills, experience, education), and saves it to MongoDB.

**Why your codebase needs it right now:**

- Upload is complete ([`uploadResume` controller](file:///Users/mayankgupta/Desktop/joblensai-2/apps/backend/src/controllers/fileService.controller.ts#L15-L50)) but nothing AI-related happens after the S3 upload
- `JobSeeker.resumeKey` is stored but `skills`, `experience` are all manually entered today
- The `vector/` folder inside agent is empty and waiting

**What you'll learn:**

- **Tool calling** — `read_s3_file` tool that fetches the PDF via presigned URL
- **Structured output with Zod** — defining a schema for the parsed resume
- **LangGraph nodes** — `parse_node` → `validate_node` → `save_node`
- **Output guardrails** — validate extracted data before writing to DB (e.g., no hallucinated skills)

**Proof from web research:** LangGraph resume parsing with GPT-4o-mini + Pydantic is the most common agentic recruitment pattern in 2025 ([towardsai.net](https://towardsai.net), [medium.com](https://medium.com/))

**Where to add it (exact files):**

```
apps/agent/src/
  agents/
    resumeParser/
      agent.ts       ← LangGraph StateGraph
      tools.ts       ← s3FetchTool, mongoSaveTool
      guardrails.ts  ← Zod output validation
      schema.ts      ← ParsedResume Zod schema
```

**Architecture:** a fixed workflow, not an agent loop. The steps never change, so a graph with plain edges is the right tool (see Phase 2).

```typescript
import { z } from "zod";
import { ChatGoogle } from "@langchain/google";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const model = new ChatGoogle({ model: "gemini-3.8-flash" }); // reads GOOGLE_API_KEY

const ParsedResume = z.object({
  skills: z.array(z.string()),
  experience: z.array(z.object({ company: z.string(), role: z.string(), years: z.number() })),
  education: z.array(z.object({ degree: z.string(), institute: z.string() })),
});

const ResumeState = Annotation.Root({
  userId: Annotation<string>(),
  resumeText: Annotation<string>(),
  parsed: Annotation<z.infer<typeof ParsedResume> | undefined>(),
  errors: Annotation<string[]>(),
});

const parser = model.withStructuredOutput(ParsedResume);

export const resumeParserGraph = new StateGraph(ResumeState)
  .addNode("parse", async (s) => ({
    parsed: await parser.invoke(
      `Extract skills, experience and education from this résumé:\n${s.resumeText}`
    ),
  }))
  .addNode("validate", async (s) => ({
    // guardrail: every extracted skill must appear in the résumé text
    errors: (s.parsed?.skills ?? [])
      .filter((skill) => !s.resumeText.toLowerCase().includes(skill.toLowerCase()))
      .map((skill) => `"${skill}" is not in the résumé`),
  }))
  .addNode("save", async (s) => {
    await saveParsedResume(s.userId, s.parsed); // your Mongo write
    return {};
  })
  .addEdge(START, "parse")
  .addEdge("parse", "validate")
  .addConditionalEdges("validate", (s) => (s.errors.length > 0 ? END : "save"))
  .addEdge("save", END)
  .compile();
```

Before the graph runs, `pdf-parse` (already installed) turns the S3 PDF buffer into `resumeText`.

**Trigger:** POST `/api/agent/resume/parse` — call this from your existing `uploadResume` controller after the S3 write.

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

**Architecture (LangGraph agent + structured result):**

```typescript
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const getJobseekerProfile = tool(
  async ({ userId }) => JSON.stringify(await JobSeeker.findOne({ userId }).lean()),
  {
    name: "get_jobseeker_profile",
    description: "Fetches skills, experience, preferences from MongoDB",
    schema: z.object({ userId: z.string() }),
  }
);

const MatchResult = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  missingSkills: z.array(z.string()),
});

const matcher = createReactAgent({
  llm: model, // the ChatGoogle instance from Feature #1
  tools: [getJobseekerProfile, getJobPosting],
  responseFormat: MatchResult,
});

const { structuredResponse } = await matcher.invoke({
  messages: [{ role: "user", content: `Match user ${userId} to job ${jobId}` }],
});
// structuredResponse.score → replaces the hardcoded 96%
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
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const outreachAgent = createReactAgent({
  llm: model,
  tools: [getParsedResume, getJobDetails, extractRecruiterEmail],
  prompt:
    "Write a personalized email to the recruiter connecting the candidate's skills to the job description requirements.",
});

// Triggers async when user swipes right
export const handleRightSwipe = async (userId, jobId) => {
  // 1. Queue background job to prevent blocking UI
  await queue.add("generate-outreach", { userId, jobId });
};
```

---

## 🧭 Phase 2 — Beyond Linear: Truly Agentic Features

> Added 2026-10-22. Sources are in the Source Links table.

**Are features #1–#3 "agentic"? Mostly no, and that's correct.** Anthropic separates two kinds of system:

- **Workflows:** "LLMs and tools are orchestrated through predefined code paths".
- **Agents:** "LLMs dynamically direct their own processes and tool usage".

The Resume Parser is a fixed parse → validate → save chain. That is prompt chaining, which fits when "the task can be easily and cleanly decomposed into fixed subtasks". Keep it a workflow.

**Rule for Phase 2:** use an agent only where the next step can't be written down in advance.

- OpenAI's agent guide says agents pay off for complex decisions, hard-to-maintain rules and unstructured data. "Otherwise, a deterministic solution may suffice."
- A Medium post (Mar 2026) puts it this way: "If you can write down every step in advance, build a workflow."
- Agents cost more. Anthropic warns of "higher costs, and the potential for compounding errors". So every feature below has a step cap, and a human checkpoint before anything irreversible.

---

### 4. 🔎 Company Research Agent — _ReAct loop_

**What it does:**

- Given a job, the agent decides what to look up: company site, recent news, tech stack.
- It searches again when the results are thin, and stops when it has enough.
- Output: a company brief whose talking points each carry a source URL.

**Why it's agentic:** the number and order of searches depend on what earlier searches return. ReAct agents "alternate between reasoning about what to do next and actually doing it" (Medium, Apr 2026).

**Hooks in your code:**

- `jobDetail.model.ts` gives the company and the JD.
- The brief feeds Feature #3 (outreach) and #8 (mock interview).

**Gemini note:** Gemini's built-in Google Search grounding can't be mixed with custom tools in the same request (LangChain `ChatGoogle` docs). Either use a search API as a normal tool, or run grounding as its own step.

```typescript
const CompanyBrief = z.object({
  summary: z.string(),
  talkingPoints: z.array(z.object({ point: z.string(), sourceUrl: z.string() })),
});

const researcher = createReactAgent({
  llm: model,
  tools: [webSearch, fetchPage, getJobPosting],
  prompt:
    "Research the company behind this job. Search again if results are thin. Give a source URL for every point.",
  responseFormat: CompanyBrief,
});

const brief = await researcher.invoke(
  { messages: [{ role: "user", content: `Research the company for job ${jobId}` }] },
  { recursionLimit: 20 } // stopping condition: hard cap on steps
);
```

**What you'll learn:**

- Tool-calling loops.
- Stopping conditions (`recursionLimit`).
- Structured output that forces citations.

---

### 5. 🪄 Resume Tailor — _Evaluator-optimizer loop_

**What it does:**

- A writer step rewrites résumé bullets for one job.
- A judge step checks two things: keyword coverage, and no skill that isn't in the parsed résumé.
- They loop until the judge passes the draft, or 3 attempts are used.
- The user approves the final version.

**Why this pattern:** Anthropic says evaluator-optimizer fits when there are "clear evaluation criteria" and refinement adds measurable value.

```typescript
const TailorState = Annotation.Root({
  jobDescription: Annotation<string>(),
  resume: Annotation<string>(),
  draft: Annotation<string>(),
  feedback: Annotation<string>(),
  passed: Annotation<boolean>(),
  attempts: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
});

const Verdict = z.object({ passed: z.boolean(), feedback: z.string() });
const judge = model.withStructuredOutput(Verdict);

export const tailorGraph = new StateGraph(TailorState)
  .addNode("write", async (s) => {
    const res = await model.invoke(
      `Rewrite these résumé bullets for the job. Never add a skill that is not in the résumé.\nJob: ${s.jobDescription}\nRésumé: ${s.resume}\nFeedback: ${s.feedback ?? "none"}`
    );
    return { draft: String(res.content), attempts: 1 };
  })
  .addNode("judge", async (s) => {
    const v = await judge.invoke(
      `Check keyword coverage for the job and flag any invented skill.\nJob: ${s.jobDescription}\nRésumé: ${s.resume}\nDraft: ${s.draft}`
    );
    return { passed: v.passed, feedback: v.feedback };
  })
  .addEdge(START, "write")
  .addEdge("write", "judge")
  .addConditionalEdges("judge", (s) => (s.passed || s.attempts >= 3 ? END : "write"))
  .compile();
```

**What you'll learn:**

- LLM-as-judge.
- Loops built from conditional edges.
- Hallucination guardrails.

---

### 6. 🧭 Job Hunt Orchestrator — _Manager + specialist tools_

**What it does:**

- The user states a goal, e.g. "remote Go backend roles, 20 LPA+".
- A manager agent decides the subtasks at runtime:
  - semantic job search (Qdrant; `QDRANT_URL` is already in `apps/agent/.env`)
  - research on the top few companies
  - résumé tailoring for the best matches
- When the goal is unclear, it asks the user.

**Why it's agentic:**

- Anthropic's orchestrator-workers pattern is for "complex tasks where you can't predict the subtasks needed".
- LangChain's multi-agent docs call this pattern subagents: "A main agent coordinates subagents as tools."
- Reference build: DataCamp's deep-agents tutorial makes a job-application assistant with job-search and cover-letter sub-agents.

```typescript
const researchCompany = tool(
  async ({ jobId }) => {
    const out = await researcher.invoke({
      messages: [{ role: "user", content: `Research the company for job ${jobId}` }],
    });
    return JSON.stringify(out.structuredResponse);
  },
  {
    name: "research_company",
    description: "Company brief with sources for one job",
    schema: z.object({ jobId: z.string() }),
  }
);

export const orchestrator = createReactAgent({
  llm: model,
  tools: [searchJobs, researchCompany], // add tailor_resume the same way (wrap tailorGraph.invoke)
  prompt: "Plan the job hunt. Call specialists when needed. Ask the user when the goal is unclear.",
});
```

**Watch out:** every specialist call is another LLM call. Cap the steps and the number of jobs per run.

---

### 7. 📬 Application Inbox Agent — _Routing + human approval + long-running state_

**What it does:**

- Classifies a recruiter's reply: rejection, interview invite, or a request for information.
- Drafts the reply, or proposes interview slots.
- **Pauses for the user's approval before anything is sent.**
- Drafts a follow-up when there's no reply after N days.

**Why it's agentic:**

- What happens next depends on what arrives, and a run may wait hours for approval.
- Sending email can't be undone. OpenAI's guide says "high-risk actions" like this "should trigger human oversight".

**Hooks:**

- Kafka (`kafka.config.ts`) carries the events.
- The notification service (Socket.IO + its Kafka email consumer) asks the user to approve, then sends.

```typescript
import { interrupt, Command, MemorySaver } from "@langchain/langgraph";

const sendEmail = tool(
  async (email) => {
    const decision = interrupt({ action: "send_email", email }); // run pauses here
    if (decision !== "approve") return "User rejected the draft.";
    await publishEmailEvent(email); // Kafka → notification service sends it
    return "Sent.";
  },
  {
    name: "send_email",
    description: "Send the reply after the user approves it",
    schema: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  }
);

const inboxAgent = createReactAgent({
  llm: model,
  tools: [sendEmail],
  checkpointer: new MemorySaver(), // MongoDBSaver in production
});

const config = { configurable: { thread_id: applicationId } };
await inboxAgent.invoke({ messages: [{ role: "user", content: recruiterReply }] }, config);
// ...hours later, when the user clicks Approve:
await inboxAgent.invoke(new Command({ resume: "approve" }), config);
```

**Production:** `MemorySaver` keeps paused runs in RAM, so a restart loses them. Swap it for `MongoDBSaver` from `@langchain/langgraph-checkpoint-mongodb`. Add that package when you build this feature.

**What you'll learn:**

- `interrupt()` and `Command({ resume })`.
- Durable checkpoints keyed by `thread_id`.
- Event-driven agents.
- Idempotent sends.

---

### 8. 🎤 Mock Interview Agent — _Adaptive multi-turn + handoffs_

**What it does:** runs a mock interview for one job.

- Inputs: the JD, the parsed résumé, and the brief from #4.
- The next question depends on your last answer.
- A router hands off between a behavioral and a technical interviewer.
- A rubric judge scores each answer.
- Turns stream in real time over the notification service's Socket.IO.

**Why it's agentic:** your answers decide the conversation path at runtime. LangChain describes handoffs as "Agents transfer control to each other via tool calls."

**What you'll learn:**

- Conversation state.
- Routing between specialists.
- Rubric-based evaluation.
- It doubles as your own interview prep.

---

### 9. 🤖 Assisted Apply (browser agent) — _Highest autonomy, highest risk_

`apps/agent/chart/Chart.yaml` describes this service as "Agent service for auto apply". The most agentic idea here is a browser agent: it opens a careers page, fills the form, and asks you when it meets a question it doesn't know. It is also the riskiest.

- **LinkedIn bans it:** "we don't permit the use of any third party software, including "crawlers", bots, browser plug-ins…". Accounts can be "restricted or shut down".
- **Recruiter backlash:** the Hacker News thread on AIHawk (81 points, 64 comments) includes "tools like this are clogging job inboxes with hundreds of submissions per day".
- **Crowded market:** several "Show HN" auto-apply tools already exist. AIHawk has 32.2k GitHub stars and marks itself "status: alpha".

**If you build it:**

- Use company career/ATS pages only, never LinkedIn.
- The user approves every submit, with the same `interrupt()` pattern as #7.
- Rate-limit per day, and log every action.

**Skipped on purpose:** recruiter-side candidate screening. Automating hiring decisions has legal and bias implications that weren't researched.

---

## 📚 Learning Map — Concepts You'll Master

| Feature                      | Agent Primitives                   | Guardrails                         | Tooling                                        |
| ---------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **1. Resume Parser**         | LangGraph nodes, StateGraph        | Output validation (Zod)            | S3 tool, MongoDB tool                          |
| **2. Job Matcher**           | Multi-step agent loop              | Input validation (userId)          | Profile tool, scoring tool                     |
| **3. Outreach Copilot**      | Retrieval, Background Tasks        | Human-in-the-loop (HITL)           | S3 stream tool, SMTP config                    |
| **4. Company Research**      | ReAct loop, `recursionLimit`       | Citations required (output schema) | Web search, page fetch, job tool               |
| **5. Resume Tailor**         | Evaluator-optimizer graph          | Judge blocks invented skills       | Writer + judge (`withStructuredOutput`)        |
| **6. Job Hunt Orchestrator** | Manager + specialists as tools     | Step and cost caps                 | Qdrant search, #2/#4/#5 as tools               |
| **7. Application Inbox**     | Routing, `interrupt()` / `Command` | Approval before send               | Kafka, notification service, Mongo checkpoints |
| **8. Mock Interview**        | Multi-turn, handoffs               | Rubric scoring                     | Socket.IO                                      |
| **9. Assisted Apply**        | Browser agent (observe → act)      | Approve every submit, rate limit   | Browser automation                             |

---

## 🔢 Recommended Build Order

```
Week 1: Resume Parser Agent (Feature #1)
  → Learn: tools, Zod schemas, LangGraph basics

Week 2: Outreach Copilot Agent (Feature #3)
  → Learn: generative workflows, async execution, S3 buffers

Week 3: Job Matching Agent (Feature #2)
  → Learn: multi-tool agents, structured output

Phase 2 — truly agentic (after #1–#3):
Week 4: Resume Tailor (Feature #5)
  → Learn: evaluator-optimizer loop, LLM-as-judge
Week 5: Company Research Agent (Feature #4)
  → Learn: ReAct tool loop, stopping conditions, citations
Week 6: Job Hunt Orchestrator (Feature #6)
  → Learn: manager pattern, specialists as tools, cost control
Week 7: Application Inbox Agent (Feature #7)
  → Learn: interrupt/resume, durable checkpoints, event-driven agents
Later: Mock Interview (#8); Assisted Apply (#9) last, only with per-submit approval
```

---

## ⚡ Quick Start — You Can Code This Today

Your agent is ready. Open [`apps/agent/src/index.ts`](file:///Users/mayankgupta/Desktop/joblensai-2/apps/agent/src/index.ts) and add:

```typescript
import { z } from "zod"; // Already installed ✅
import { ChatGoogle } from "@langchain/google"; // Already installed ✅ (Gemini)
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const model = new ChatGoogle({ model: "gemini-3.8-flash" }); // reads GOOGLE_API_KEY

// Your first tool
const getJobseekerSkills = tool(
  async ({ userId }) => {
    const js = await JobSeeker.findOne({ userId });
    return JSON.stringify(js?.experience?.flatMap((e) => e.skills) ?? []);
  },
  {
    name: "get_jobseeker_skills",
    description: "Get skills from MongoDB for a user",
    schema: z.object({ userId: z.string() }),
  }
);

// Your first agent
const matchingAgent = createReactAgent({
  llm: model,
  tools: [getJobseekerSkills],
  prompt: "You match job seekers to jobs. Be precise.",
});

// Wire it to Express
app.post("/api/agent/match", async (req, res) => {
  const result = await matchingAgent.invoke({
    messages: [{ role: "user", content: req.body.prompt }],
  });
  res.json({ result: result.messages.at(-1)?.content });
});
```

> [!IMPORTANT]
> Before the first agent:
>
> 1. Add `GOOGLE_API_KEY` (from Google AI Studio) to `apps/agent/.env`, and its name to `.env.example`. It isn't wired into Vault/ExternalSecret for k8s yet; only `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` are.
> 2. Add `app.use(express.json())` in `apps/agent/src/index.ts`. Every other service has it, and in Express 5 `req.body` is `undefined` without a body parser.
> 3. On the free tier Google may use your prompts. Test with your own or fake résumés only.

---

## 🔗 Source Links

| Claim                                                                    | Source                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LangGraph recruitment workflow patterns                                  | [LangChain Blog 2025](https://blog.langchain.com)                                                                                                                                               |
| Resume parsing with Pydantic/Zod is production standard                  | [towardsai.net — Agentic Recruitment](https://towardsai.net)                                                                                                                                    |
| LangGraph conditional edges for notification routing                     | [medium.com — LangGraph stateful graphs](https://medium.com)                                                                                                                                    |
| Workflows vs agents; chaining, orchestrator-workers, evaluator-optimizer | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)                                                                                        |
| When an agent is worth it; human-intervention triggers                   | [OpenAI — A practical guide to building agents (PDF)](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)                                            |
| "If you can write down every step in advance, build a workflow"          | [Medium — AI Agents vs Workflows (Mar 2026)](https://medium.com/@0xmega/ai-agents-vs-workflows-how-to-know-which-one-you-actually-need-7e0e0d89f81d)                                            |
| ReAct and multi-agent patterns                                           | [Medium — Agentic workflow patterns (Apr 2026)](https://medium.com/@sathishkraju/the-ai-agentic-workflow-patterns-that-actually-matter-in-2026-08955ac6f398)                                    |
| LangGraph for durable, approval-gated workflows                          | [Medium — Best agent framework in 2026 (Sep 2026)](https://medium.com/data-science-collective/the-best-agent-framework-in-2026-langgraph-vs-openai-agents-sdk-vs-claude-agent-sdk-2c64e0b378d9) |
| Subagents as tools, handoffs                                             | [LangChain JS — Multi-agent](https://docs.langchain.com/oss/javascript/langchain/multi-agent)                                                                                                   |
| Checkpointers (HITL, memory, fault tolerance)                            | [LangGraph JS — Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)                                                                                                   |
| `MongoDBSaver` checkpointer                                              | [npm — @langchain/langgraph-checkpoint-mongodb](https://www.npmjs.com/package/@langchain/langgraph-checkpoint-mongodb)                                                                          |
| `ChatGoogle`, `GOOGLE_API_KEY`, tool calling, grounding limits           | [LangChain JS — ChatGoogle](https://docs.langchain.com/oss/javascript/integrations/chat/google)                                                                                                 |
| Gemini free tier; "Used to improve our products"                         | [Google — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)                                                                                                                    |
| Recommended Gemini models                                                | [Google — Gemini models](https://ai.google.dev/gemini-api/docs/models)                                                                                                                          |
| OpenRouter alternative (`ChatOpenRouter`)                                | [LangChain JS — OpenRouter](https://docs.langchain.com/oss/javascript/integrations/chat/openrouter)                                                                                             |
| Job-application assistant with sub-agents                                | [DataCamp — Deep Agents tutorial](https://www.datacamp.com/tutorial/deep-agents)                                                                                                                |
| Recruiter backlash to auto-apply bots                                    | [Hacker News — AIHawk thread](https://news.ycombinator.com/item?id=41756371)                                                                                                                    |
| LinkedIn bans automation tools                                           | [LinkedIn Help — Prohibited software](https://www.linkedin.com/help/linkedin/answer/a1341387)                                                                                                   |
