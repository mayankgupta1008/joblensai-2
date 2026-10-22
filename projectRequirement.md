# 🤖 JobLens AI — Product Requirements (Agent Edition)

> Living document · Updated 2026-10-22 · Personal project
>
> Every TypeScript sample below was type-checked (`tsc`) and loaded at runtime (no API calls) against the installed packages: `@langchain/core` 1.2.20, `@langchain/langgraph` 1.2.6, `@langchain/google` 0.2.12, `zod` 4.3.6.

---

## 1. 🎯 What JobLens Is

JobLens is an **AI job agent**. You talk to it by voice (or type). It:

- builds your profile
- reads your résumé
- finds matching jobs
- tailors your résumé for each job
- drafts the outreach

You review every result on a card: **Approve** or **Skip**. Nothing goes out without your approval.

Recruiters post jobs and review the applications that come in.

**Pitch:** _Tell JobLens what you want. Agents find matching jobs, tailor your résumé and draft the email. You approve each one with a tap._

---

## 2. 🧭 Product Principles

1. **Review-first, not chat-first.** Agents do the work. The user reviews results one card at a time. The only conversation is the voice onboarding (and a mock interview later).
2. **Agents run in the background.** Events trigger them. Results appear as normal UI: review cards, a match %, notifications.
3. **Humans approve anything irreversible,** such as sending an email or applying. The approval is the **Approve** button on the card.
4. **Workflow before agent.** Use an agent only where the next step can't be written down in advance (see Appendix A).
5. **The LLM handles language; code handles rules.** Validation, flow control and scoring stay in code. FormBharo (arXiv, Aug 2026) pairs "Large Language Models (LLMs) with deterministic, rule-based validation and flow control."
6. **Minimal dependencies.**
   - LangGraph + Gemini (`@langchain/google`).
   - One extra package, `@google/genai`, for the real-time voice connection (Gemini Live), as in Google's docs.
   - No `langchain` meta-package.
   - No vector DB until it is needed.
7. **Privacy.**
   - Gemini's free tier marks prompts as "Used to improve our products: Yes", so development uses test data only.
   - Voice audio goes from the browser straight to Gemini and is never stored by JobLens.
   - Move to the paid tier before real users.

---

## 3. 🔍 Where the Codebase Is Today (verified 2026-10-22)

| Area          | Today                                                                                                                                                | Evidence                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Web dashboard | A Tinder-style `SwipeDeck` with mock data. "Swipe" also appears in the landing page, auth screens, navbar, footer and subscription plans (10 files). | `apps/web/src/pages/DashboardPage.tsx`, `SubscriptionPage.tsx`     |
| Profile       | A manual multi-step form (react-hook-form) posts to `POST /api/account/complete`. The shared `CompleteJobSeekerProfileSchema` validates it.          | `CompleteProfileJobseeker.tsx`, `user.schema.ts`                   |
| Résumé        | `POST /api/file/upload/resume` (S3)                                                                                                                  | `apps/backend/src/routes/fileService.route.ts`                     |
| Jobs          | Recruiters post jobs with `POST /api/job/create`. There is no feed endpoint.                                                                         | `apps/backend/src/routes/jobPost.route.ts`                         |
| Swipe backend | None. The backend, payment and shared packages have no swipe logic, so removing swipes only touches web.                                             | `git grep -i swipe`                                                |
| Agent service | An empty scaffold (12 empty files). Missing `express.json()` and `resumeParser/schema.ts`.                                                           | `apps/agent/src`                                                   |
| Events        | Kafka `notification.email`. The notification consumer saves a Notification and emits `notification` over Socket.IO.                                  | `kafka.config.ts`, `email.consumer.ts`                             |
| PDFs          | The notification service already renders PDFs with puppeteer (invoices) and sends email attachments.                                                 | `apps/notification/src/lib/email-service/invoice.ts`               |
| Gateway       | `/api/agent/` is routed. **`/api/job/` is not.** No `client_max_body_size` is set, so nginx's default of 1 MB applies.                               | `apps/api-gateway/nginx.conf.template`                             |
| Model key     | `GOOGLE_API_KEY` is not in `.env.example`, seed-vault or ExternalSecret.                                                                             | `apps/agent/.env.example`, `infra/local-k8s/scripts/seed-vault.sh` |

---

## 4. 📦 Scope

**MVP (build in this order):**

| #   | Feature                         | Type                    | One line                                                                             |
| --- | ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| F1  | Résumé Parser                   | Workflow                | The upload fills experience, education and skills.                                   |
| F2  | Voice Onboarding (Gemini Live)  | Conversational workflow | A friendly, real-time voice chat fills the rest of the profile, then a confirm card. |
| F3  | Jobs for You + real match %     | Code + small agent      | The % comes from code; the agent writes "why" and missing skills.                    |
| F4  | Agent Mode (voice or text goal) | Agent                   | A goal turns into review cards, each with a tailored résumé PDF and a draft email.   |
| F5  | Review & Send                   | Workflow                | Approve sends. Skip drops it. Nothing is sent without Approve.                       |

**Removed:** swipe-based job discovery and the recruiter "mutual match". Recruiters review applications instead (see F5).

**Later:** Feed Curator, Company Research, Application Inbox, Mock Interview, recruiter-side candidate summaries, external job boards, mobile parity, Assisted Apply. See §9.

---

## 5. ✨ MVP Features

### F1. 🧠 Résumé Parser — _workflow_

**Trigger (background):** a résumé upload makes the backend publish `resume.uploaded`, and the agent's consumer runs the graph. While learning, start with `POST /api/agent/resume/parse` and call it by hand.

**Steps:**

1. Read the PDF from S3.
2. Turn it into `resumeText` with `pdf-parse` (already installed).
3. Gemini returns structured output.
4. Validate it: every skill must appear in the text.
5. Save experience, education and skills to `JobSeekerProfile`.

**UI:** the profile fills itself, and the completeness % goes up.

**Acceptance:**

- A test résumé fills experience, education and skills.
- An invented skill is rejected.
- Uploading again replaces the old parse.

**You'll learn:** LangGraph state, nodes and edges; structured output; a deterministic guardrail.

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

---

### F2. 🎙️ Voice Onboarding (Gemini Live) — _conversational workflow_

**Goal:** a friendly, real-time voice conversation (like Sarvam-style assistants) that fills the profile, instead of a long form.

**Why Gemini Live:** it is real-time voice-to-voice over WebSocket, and the free tier covers input and output ("Free of charge").

- **Barge-in:** "When VAD detects an interruption, the ongoing generation is canceled and discarded."
- **Natural voice:** native audio output gives "natural, realistic-sounding speech".
- **Languages:** Hindi and 99 languages in total.
- **Friendly tone:** "affective dialog" lets Gemini "adapt its response style to the input expression and tone".
- **Tools:** function calling is supported during the session.
- **Latency:** one team reports "around 600–700ms in most sessions" (Prayag, Medium, Mar 2026).

**Flow:**

1. **Résumé first.** `resumeKey` is required by the schema. F1 then fills experience, education and skills.
2. **Token.** The browser calls `POST /api/agent/voice/token`. The agent service mints an **ephemeral token** (`@google/genai` `authTokens.create`, `uses: 1`, short expiry). The real API key never reaches the browser.
3. **Connect.** The browser calls `ai.live.connect({ model: "gemini-3.8-live", ... })` with audio responses, a friendly onboarding system instruction (English/Hindi), and one tool: `update_profile`.
4. **Talk.** Gemini asks only for what's missing:
   - phone
   - current location
   - expected salary (min, max, currency)
   - preferred locations
   - job types
   - notice period
5. **Fill live.** Whenever Gemini learns something, it calls `update_profile({...})`.
   - The browser validates the fields with the shared zod schema.
   - It updates the confirm card on screen.
   - It answers `ok` or `invalid: <reason>`, and Gemini asks again if the value was invalid.
6. **Confirm card.** The existing profile form, pre-filled.
   - The user types the address and LinkedIn/GitHub URLs, which are hard to say aloud.
   - Submitting calls the existing `POST /api/account/complete`.
   - **The backend needs no change to save.**

**Fallback (no mic, or Live unavailable):** the same questions run turn by turn through `POST /api/agent/onboarding/turn`. The code below is that path. It accepts audio or typed text (pass a text block instead of the audio block).

**Rules:**

- Code, through the shared zod schema, validates every value. The LLM only hears, extracts and phrases.
- Never save without the confirm card. FormBharo found form completion drops "by up to about 41 points" on real-speech transcripts.
- Audio-only sessions are limited to 15 minutes, which is plenty for onboarding. Use session resumption for reconnects (about every 10 minutes per the token docs).
- Keep the browser's echo cancellation on, and stop and clear audio playback when an interruption arrives (Live API docs).
- JobLens never stores the audio.

**Acceptance:**

- A fresh account completes its profile by voice plus the confirm card.
- A negative salary is rejected by the shared schema.
- The user can interrupt Gemini mid-sentence.
- The text fallback works without a mic.

**You'll learn:** real-time voice agents, tool calls from a live session, schema-driven validation, and splitting work between the LLM and code.

```typescript
// Fallback path: one stateless turn (audio or text) on the agent service
import { z } from "zod";
import { ChatGoogle } from "@langchain/google";
import { HumanMessage } from "@langchain/core/messages";
import { CompleteJobSeekerProfileSchema } from "@joblensai/shared/src/schemas/user.schema.js";

const model = new ChatGoogle({ model: "gemini-3.8-flash" }); // reads GOOGLE_API_KEY

// Only the fields voice is good at. email/role come from auth, resumeKey from the upload,
// experience/education from the résumé parser, URLs are typed on screen.
const VoiceFields = CompleteJobSeekerProfileSchema.shape.body
  .pick({
    phoneNumber: true,
    currentLocation: true,
    expectedSalary: true,
    preferredLocations: true,
    jobTypes: true,
    noticePeriod: true,
  })
  .partial();
type Collected = z.infer<typeof VoiceFields>;

export async function onboardingTurn(audioBase64: string, mimeType: string, collected: Collected) {
  // 1. LLM: hear the answer and pull out fields
  const extracted = await model.withStructuredOutput(VoiceFields).invoke([
    new HumanMessage({
      contentBlocks: [
        {
          type: "text",
          text: `Extract profile fields from this answer. Known so far: ${JSON.stringify(collected)}`,
        },
        { type: "audio", mimeType, data: audioBase64 },
      ],
    }),
  ]);
  const merged: Collected = { ...collected, ...extracted };

  // 2. Code, not the LLM, decides what is still missing
  const missing = (Object.keys(VoiceFields.shape) as (keyof Collected)[]).filter(
    (k) => merged[k] === undefined
  );
  if (missing.length === 0) return { done: true, collected: merged };

  // 3. LLM phrases the next question
  const next = await model.invoke(
    `Ask the user for their ${missing[0]} in one short, friendly sentence.`
  );
  return { done: false, collected: merged, question: String(next.content) };
}
```

---

### F3. 🎯 Jobs for You + Real Match % — _code + small agent_

**What it does:** a "Jobs for you" list, ranked by a real match %. Each job has a **Prepare application** button, which runs F4 for that single job.

**The % comes from code. The LLM only explains.** No vector DB is needed yet.

| Stage            | How                                                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 · Now**      | Filter jobs in Mongo by `locationName` and `jobTypes`. Score the rest by the overlap between `requiredSkills` and `experience[].skills`. "SQL is exceptionally good at filtering structured facts. Vectors are exceptionally good at measuring semantic closeness." (Dhananjay Kumar, Medium, Jul 2026)           |
| **2 · Semantic** | Store `gemini-embedding-2` vectors (768 dims) on the Mongo documents, and run brute-force cosine over the jobs that pass the filter. Below ~10,000 documents this is "perfectly fine" (Alex Klimenko, Medium, May 2026). `@langchain/google` has no embeddings class, so pick the embedding client at this stage. |
| **3 · Scale**    | Amazon DocumentDB vector search: HNSW, up to 2,000 indexed dimensions, `$vectorSearch` from 8.0. Local MongoDB 8.2 Community has `$vectorSearch` only as a public preview for development and testing. Add Qdrant only if both fall short.                                                                        |

**Explanation agent:** runs only for the jobs shown on screen, and writes `reasoning` and `missingSkills`. The LLM is never called once per job in the database.

**Backend:** `GET /api/job/feed`. The gateway needs a `/api/job/` route.

**Acceptance:**

- Real jobs appear with a computed %.
- The jobs shown on screen have a "why" line and missing skills.

**You'll learn:** when _not_ to use an LLM, cost control, and staged retrieval.

---

### F4. 🧭 Agent Mode (voice or text goal) — _agent_

**Input:** a goal such as "Remote React jobs, 20 LPA+", typed or spoken. Speech uses Gemini Live, the same as F2.

**What the agent does** (it decides the steps at runtime):

1. Turns the goal into filters.
2. Searches platform jobs (MVP).
3. Scores them with F3.
4. For the top N (at most 10):
   - **Tailored résumé.** A writer and a judge loop until there are no invented skills (at most 3 tries). The result is rendered to PDF.
   - **Outreach draft.** A short email that uses only facts from the résumé.

**Output:** every job becomes a **review card**, showing the job, the "why" line, a preview of the tailored résumé and the draft email.

- The cards appear one at a time, with **Approve / Skip** buttons. Drag gestures are optional.
- The current `SwipeDeck` component is reused for this.

**How it runs:**

- `POST /api/agent/runs` creates an `AgentRun` and publishes one `agent.job.requested` message per job, so the jobs are processed in parallel.
- Progress reaches the UI through notification → Socket.IO.
- Caps: jobs per run, a step limit (`recursionLimit`), Gemini's per-project rate limits, and the daily run limit from the subscription.

**Why it's an agent:** Anthropic describes orchestrator-workers as suited to "complex tasks where you can't predict the subtasks needed".

**Acceptance:**

- A goal produces up to 10 review cards, each with a tailored PDF and a draft.
- Nothing is sent without Approve.
- A failed job shows a retry state.

**You'll learn:** orchestrator-workers, the evaluator-optimizer pattern, background runs, and cost caps.

---

### F5. ✅ Review & Send — _workflow_

**Jobseeker:**

1. Approve on a review card (or on the Drafts page) calls the backend.
2. The backend publishes `application.approved`.
3. The notification service sends the email with the PDF attached (attachment support already exists).
4. The application tracker moves to **Applied**.

Skip drops the card. Skips are kept as a signal for the later Feed Curator.

**Platform jobs don't need email.** The job model has no HR email field (it has `employerId` → Recruiter). The recruiter is on the platform, so the application lands in the recruiter's list with an in-app notification.

**Recruiter:** an **Applications** list per job (replacing the candidate deck), with Accept / Reject. Humans make every decision.

**Why approval is required:**

- OpenAI's agent guide says actions that are "sensitive, irreversible, or have high stakes should trigger human oversight".
- Practitioners keep approval in the loop. Byren Cheema's email agent works "with my approval before sending" (Medium, Oct 2025).

**Acceptance:**

- Nothing is sent before Approve.
- The tracker and the recruiter's list update.
- Double-clicking Approve causes one send (idempotent by draft id).

---

## 6. 🏗️ Architecture

**Flow:**

```
web (React) ──HTTP──▶ api-gateway (nginx) ──▶ auth | backend | agent | payment | notification
   │                                                 │          │
   │ Gemini Live (ephemeral token)       backend publishes ──▶ Kafka ◀── agent consumes & publishes
   └──────────────▶ Google                                     │
                                         notification consumes ──▶ Mongo + Socket.IO "notification" ──▶ web
```

**Events (Kafka):**

| Topic                  | Producer             | Consumer                    |
| ---------------------- | -------------------- | --------------------------- |
| `resume.uploaded`      | backend              | agent (F1)                  |
| `job.posted`           | backend              | agent (F3 scores)           |
| `agent.job.requested`  | agent (`/runs`)      | agent workers (F4)          |
| `application.approved` | backend              | notification (F5 send)      |
| `notification.email`   | agent, auth, payment | notification (exists today) |

**New data (shared models):**

- `Application` (stage: Applied → Viewed → Interview → Offer, plus recruiter Accept/Reject)
- `Draft` (email, tailored-résumé S3 key, Approve/Skip status)
- `AgentRun` (goal, status, jobIds)

**Background consumer pattern:** the same shape as the notification service's `email.consumer.ts`.

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  createConsumer,
  sendMessage,
  KAFKA_TOPICS,
} from "@joblensai/shared/src/utils/kafka.config.js";

const outreachAgent = createReactAgent({
  llm: model,
  tools: [getParsedResume, getJobDetails],
  prompt:
    "Write a short, personalized email to the recruiter for this job, using only facts from the résumé.",
});

const consumer = createConsumer("agent-service");

export const startAgentJobConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "agent.job.requested", fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const { userId, jobId } = JSON.parse(message.value?.toString() || "{}");
      const result = await outreachAgent.invoke({
        messages: [{ role: "user", content: `Draft outreach for user ${userId} and job ${jobId}` }],
      });
      await saveDraft(userId, jobId, String(result.messages.at(-1)?.content ?? ""));
      // notification service saves it and emits "notification" over Socket.IO
      await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
        type: "OUTREACH_DRAFT_READY",
        data: { userId, jobId },
      });
    },
  });
};
```

**Background rules:**

- **Idempotency:** key the work by `runId`, `jobId` and draft id.
- **Rate limits:** Gemini limits apply per project.
- **Failures:** show a visible retry state on the card.
- **Speed:** parse at upload time, and run per-job steps in parallel.

**Known bug:** `ensureTopicExists(topic)` checks `KAFKA_TOPICS.NOTIFICATION_EMAIL` instead of its `topic` argument (`kafka.config.ts:39`), so new topics are never created. Fix it before adding topics.

---

## 7. 🛠️ Codebase Changes

| Area             | Change                                                                                                                                                                                                                                                                                                                                                                                                                  | Size          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **agent**        | All new code.<br>• `express.json()`, and restore `resumeParser/schema.ts`.<br>• Gemini setup, plus `@google/genai` to mint voice tokens.<br>• Graphs: F1, the F2 fallback, F4 and F3's explanation step.<br>• Routes: `/api/agent/resume/parse`, `/api/agent/voice/token`, `/api/agent/onboarding/turn`, `/api/agent/runs`.<br>• Kafka consumers.<br>• Drafts and runs stored in Mongo.                                 | **Large**     |
| **web**          | • Voice onboarding screen (`@google/genai` Live session, mic with echo cancellation, live confirm card that pre-fills the existing form).<br>• "Jobs for you" list.<br>• `SwipeDeck` becomes the Approve/Skip review card.<br>• Agent Mode screen (goal + progress).<br>• Drafts page and tracker.<br>• Remove swipe text (landing, auth screens, navbar, footer).<br>• Plans move from "swipes per day" to agent runs. | **Large**     |
| **backend**      | • `GET /api/job/feed`.<br>• Approve/Skip endpoints that publish `application.approved`.<br>• Application tracker endpoints, and the recruiter Applications list (Accept/Reject).<br>• Publish `resume.uploaded` and `job.posted`.<br>• Daily agent-run limit from the subscription.<br>• Profile and file routes are reused unchanged.                                                                                  | **Medium**    |
| **shared**       | • `Application`, `Draft` and `AgentRun` models.<br>• New `KAFKA_TOPICS`.<br>• Fix `ensureTopicExists`.                                                                                                                                                                                                                                                                                                                  | **Small–Med** |
| **api-gateway**  | • Add a `/api/job/` location.<br>• Raise `client_max_body_size` on `/api/agent/`, but only for the fallback audio path. Gemini Live audio goes browser → Google and never touches the gateway.                                                                                                                                                                                                                          | **Small**     |
| **notification** | • New message types (draft ready, run done).<br>• Send approved outreach with the PDF attached.<br>• Possibly render résumé PDFs (puppeteer is already here).                                                                                                                                                                                                                                                           | **Small**     |
| **infra**        | • `GOOGLE_API_KEY` in `.env`, `.env.example`, seed-vault and ExternalSecret.<br>• New topics.<br>• k8s S3 env for the app isn't wired yet (ExternalSecret maps only `S3_ROOT_*`), so test résumé upload on k8s.                                                                                                                                                                                                         | **Small–Med** |
| **payment/auth** | None in code. The plan text and limits change in web and backend only.                                                                                                                                                                                                                                                                                                                                                  | —             |
| **mobile**       | Later.                                                                                                                                                                                                                                                                                                                                                                                                                  | —             |

---

## 8. 🔢 Build Order

```
Phase 0 — prerequisites
  express.json() in agent · GOOGLE_API_KEY (env, .env.example, Vault/ESO)
  fix ensureTopicExists · gateway: /api/job/ · restore resumeParser/schema.ts

Phase 1 — F1 Résumé Parser              → learn: LangGraph basics, structured output, guardrails
Phase 2 — F2 Voice Onboarding           → learn: Gemini Live, tool calls, schema-driven validation
Phase 3 — F3 Jobs for You + match %     → learn: code-first scoring, cost control
Phase 4 — F4 Agent Mode + F5 Review     → learn: orchestrator-workers, evaluator loops, background runs
Then    — features from §9, one at a time
```

---

## 9. 🗺️ Later Features

| Feature                 | Idea                                                                                                         | Pattern / note                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feed Curator**        | Learn from Approve/Skip history ("more fintech, avoid on-site") and rank tomorrow's jobs, with a "why" line. | Mostly a workflow: one LLM step for preferences, ranking in code.                                                                                                |
| **Company Research**    | Per prepared application, cached per company: 2–3 cited talking points for the draft.                        | ReAct loop with `recursionLimit`. Gemini Search grounding can't be mixed with custom tools in one request.                                                       |
| **Application Inbox**   | Classify recruiter replies, draft answers or interview slots, and wait for approval.                         | `interrupt()` + `Command({ resume })` + `MongoDBSaver`. Gmail: `gmail.send` is a Sensitive scope; reading replies needs Restricted scopes (security assessment). |
| **Mock Interview**      | Opens only when an interview invite arrives. A Gemini Live voice session.                                    | Adaptive multi-turn, with handoffs between interviewers.                                                                                                         |
| **Recruiter summaries** | Candidate summaries in the recruiter's Applications list.                                                    | Summaries only. Humans make every decision.                                                                                                                      |
| **External jobs**       | Greenhouse/Lever public boards (GET needs no auth).                                                          | Applying through their APIs needs **the company's** API key.                                                                                                     |
| **Assisted Apply**      | A browser agent fills career pages and you approve every submit.                                             | Highest risk. LinkedIn bans bots ("we don't permit… bots"), and recruiters push back on spam (HN AIHawk thread).                                                 |
| **Mobile**              | Parity with web.                                                                                             | Expo app is scaffolded.                                                                                                                                          |

---

## 10. ⚠️ Open Decisions & Risks

- **Subscription metric:** the plans currently promise "5 swipes per day" and "Unlimited daily swipes". Pick a replacement, such as agent runs or prepared applications per day.
- **Where PDFs are rendered:**
  - In the agent service: add puppeteer and Chromium, which makes the image bigger.
  - In the notification service: puppeteer is already there.
- **Email channel:**
  - The app's own address, with reply-to set to the user. Simple.
  - The user's Gmail through `gmail.send`, which is a Sensitive scope and needs Google verification.
- **Privacy:** free-tier prompts are used by Google. Use test data and switch to paid before real users.
- **Hallucination:** the judge loop + the confirm card + the "facts only from the résumé" prompts.
- **Voice:**
  - Expect transcription errors on real speech, so the confirm card is mandatory.
  - Handle echo and interruptions on the client.
- **k8s S3:** app S3 env isn't wired for k8s yet, so test résumé upload there before relying on it.

---

## Appendix A — Workflows vs Agents

- Anthropic: workflows are "orchestrated through predefined code paths". Agents "dynamically direct their own processes and tool usage". Their advice: "finding the simplest solution possible, and only increasing complexity when needed."
- OpenAI's guide: agents pay off for complex decisions, hard-to-maintain rules and unstructured data. "Otherwise, a deterministic solution may suffice."
- Medium (Mar 2026): "If you can write down every step in advance, build a workflow."
- In JobLens:
  - F1, F2 and F5 are workflows.
  - F3 is mostly code.
  - F4 is the real agent.

## Appendix B — Voice Options Considered

| Option                    | Free?                                                                                                   | Real-time?                                                                         | Verdict                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- |
| **Gemini Live**           | Free tier: input and output "Free of charge"                                                            | Yes: voice-to-voice, barge-in, Hindi                                               | **Chosen**                                    |
| **Sarvam AI**             | "Every new user receives ₹100 in credits", then STT ₹0.49/min and Bulbul V3 TTS ₹3 per 1,000 characters | STT + TTS only; needs a separate LLM in between (1–3 s per turn)                   | Indian voices; paid after the credits run out |
| **Browser Web Speech**    | Free                                                                                                    | `SpeechRecognition` has "Limited availability"; Chrome sends the audio to a server | Fallback only                                 |
| **Pipecat** (open source) | Free                                                                                                    | Supports Gemini Live and Sarvam                                                    | Python; would need a separate service         |

---

## 🔗 Sources

| Claim                                                                         | Source                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workflows vs agents; orchestrator-workers; simplest solution                  | [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)                                                                                                                                                                                         |
| When to use an agent; human oversight for high-risk actions                   | [OpenAI — A practical guide to building agents (PDF)](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)                                                                                                                                             |
| "If you can write down every step in advance…"                                | [Medium — AI Agents vs Workflows (Mar 2026)](https://medium.com/@0xmega/ai-agents-vs-workflows-how-to-know-which-one-you-actually-need-7e0e0d89f81d)                                                                                                                                             |
| LLM + rule-based validation; ~41-point drop on real speech                    | [FormBharo (arXiv 2608.06027)](https://arxiv.org/abs/2608.06027)                                                                                                                                                                                                                                 |
| Gemini Live: barge-in, native audio, affective dialog, Hindi, 15-min sessions | [Google — Live API guide](https://ai.google.dev/gemini-api/docs/live-guide), [Live API](https://ai.google.dev/gemini-api/docs/live)                                                                                                                                                              |
| Ephemeral tokens (`@google/genai`, `authTokens.create`, `ai.live.connect`)    | [Google — Ephemeral tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)                                                                                                                                                                                                              |
| Gemini Live latency ~600–700 ms                                               | [Medium — Prayag, Real-time AI coding interviewer (Mar 2026)](https://medium.com/@prayagtushar/how-we-built-a-real-time-ai-coding-interviewer-with-gemini-live-api-7b97ee7727ef)                                                                                                                 |
| Pipeline voice latency 1–3 s                                                  | [Medium — Charles Adewoye (Jan 2026)](https://charlesadewoye.medium.com/building-voice-ai-agents-that-dont-suck-lessons-from-production-448fc1ef3155)                                                                                                                                            |
| Sarvam pricing and credits                                                    | [Sarvam — API pricing](https://www.sarvam.ai/api-pricing), [Sarvam docs — pricing](https://docs.sarvam.ai/api/getting-started/pricing)                                                                                                                                                           |
| Pipecat (Gemini Live, Sarvam)                                                 | [Pipecat — Gemini Live guide](https://docs.pipecat.ai/guides/features/gemini-live)                                                                                                                                                                                                               |
| Approval before sending                                                       | [Medium — Byren Cheema (Oct 2025)](https://medium.com/@cheemabyren/i-built-a-team-of-ai-agents-to-find-me-a-job-heres-what-happened-ad19566fc193)                                                                                                                                                |
| `ChatGoogle` audio input, tool calling, grounding limits                      | [LangChain JS — ChatGoogle](https://docs.langchain.com/oss/javascript/integrations/chat/google)                                                                                                                                                                                                  |
| Gemini audio (WebM, 20 MB inline); TTS; free tier                             | [Gemini audio](https://ai.google.dev/gemini-api/docs/audio), [Speech generation](https://ai.google.dev/gemini-api/docs/speech-generation), [Pricing](https://ai.google.dev/gemini-api/docs/pricing)                                                                                              |
| Gemini models; embeddings                                                     | [Google — Models](https://ai.google.dev/gemini-api/docs/models), [Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)                                                                                                                                                                  |
| `SpeechRecognition` availability                                              | [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)                                                                                                                                                                                                      |
| nginx `client_max_body_size` default 1 MB → 413                               | [nginx core module](https://nginx.org/en/docs/http/ngx_http_core_module.html)                                                                                                                                                                                                                    |
| Filter first, then vectors; brute force below ~10k                            | [Medium — Dhananjay Kumar (Jul 2026)](https://dhnanjay.medium.com/you-dont-need-a-vector-database-you-need-a-where-clause-e33407af215c), [Medium — Alex Klimenko (May 2026)](https://medium.com/@alxkm/vector-databases-explained-the-missing-piece-in-your-ai-stack-ddc25be57232)               |
| DocumentDB / MongoDB 8.2 vector search                                        | [AWS — DocumentDB vector search](https://docs.aws.amazon.com/documentdb/latest/developerguide/vector-search.html), [MongoDB — Community vector search preview](https://www.mongodb.com/products/updates/public-preview-mongodb-community-edition-now-offers-native-full-text-and-vector-search/) |
| Checkpointers; `MongoDBSaver`                                                 | [LangGraph JS — Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence), [npm — @langchain/langgraph-checkpoint-mongodb](https://www.npmjs.com/package/@langchain/langgraph-checkpoint-mongodb)                                                                            |
| Gmail scope classes                                                           | [Google — Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)                                                                                                                                                                                                       |
| Greenhouse / Lever public boards                                              | [Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html), [Lever Postings API](https://github.com/lever/postings-api)                                                                                                                                                               |
| LinkedIn bans bots; recruiter backlash                                        | [LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a1341387), [HN — AIHawk thread](https://news.ycombinator.com/item?id=41756371)                                                                                                                                                     |
