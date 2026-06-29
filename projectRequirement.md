# JobLensAI Project Requirements

## 1. Revised Project Goal

JobLensAI is a job matching platform designed to demonstrate production-grade AI engineering, specifically:

- Retrieval-Augmented Generation (RAG)
- AI agent workflows
- LLM guardrails and structured outputs
- Human-in-the-loop approval flows
- Evaluation-driven AI development
- Event-driven microservice architecture

The project goal is no longer simply "send an AI-generated email after a match." That is too small and not agentic enough. The revised goal is:

> Build an AI career and recruiting copilot that uses RAG over resumes, job descriptions, user profiles, platform activity, and recruiter data to support job matching, candidate screening, interview preparation, and human-approved outreach.

## 2. Core AI Principle

Not every LLM feature should be an agent.

Use a deterministic LLM workflow when the system follows a known sequence:

1. Fetch resume.
2. Fetch job description.
3. Extract structured data.
4. Compare candidate to role.
5. Generate a result.
6. Validate the result.
7. Store or publish an event.

Use an agent only when the LLM must choose tools, branch dynamically, recover from missing information, perform multi-step reasoning, or maintain state across a longer workflow.

## 3. AI Service Direction

The existing `agent-service` should be repurposed into the platform's AI orchestration service.

Recommended name:

- Keep `agent-service` if the service will contain LangGraph workflows and tool-using agents.
- Rename to `ai-service` if the service will contain both deterministic RAG pipelines and agentic workflows.

The service should not own email delivery. Email delivery already belongs in the notification service.

The AI service should own:

- Resume parsing and indexing
- Job description parsing and indexing
- Embedding generation
- Vector search
- Match analysis
- Candidate ranking
- Agent workflow orchestration
- Structured LLM output validation
- AI evaluation datasets and scoring
- Trace metadata, latency, and cost tracking

## 4. Production RAG Use Cases

### 4.1 Resume and Job Description Fit Analyzer

Given a jobseeker resume and a job description, the system should generate:

- Match score
- Strong matching points
- Missing skills
- Experience alignment
- Salary/location compatibility
- Risk flags
- Evidence citations from the resume and job description

This should be a deterministic RAG workflow, not an autonomous agent.

Required behavior:

- Retrieve relevant resume chunks.
- Retrieve relevant job description chunks.
- Generate a structured analysis.
- Cite supporting evidence.
- Reject unsupported claims.
- Validate output with Zod.
- Store the result for future ranking and UI display.

### 4.2 Recruiter Candidate Search Agent

Recruiters should be able to ask questions such as:

> Find backend candidates with Kafka, Redis, payments experience, and at least 3 years of backend work.

This is a valid agent use case because the AI may need to choose between multiple tools:

- Vector search over resumes
- MongoDB filtering
- Candidate profile lookup
- Skill extraction
- Ranking
- Shortlist creation

Expected output:

- Ranked candidate list
- Explanation for each candidate
- Evidence-backed strengths
- Missing criteria
- Confidence score

The agent must not hallucinate experience. Every claim about a candidate must be backed by profile data or resume evidence.

### 4.3 Jobseeker Career Coach

Jobseekers should be able to ask:

- Which jobs am I actually qualified for?
- What roles should I target next?
- What skills am I missing?
- How should I improve my resume for this job?
- Rewrite my resume summary for this job without inventing experience.

This use case should combine RAG and controlled generation.

RAG sources:

- Resume
- Jobseeker profile
- Saved jobs
- Job descriptions
- Past applications
- Match history

Hard rule:

The system must not invent experience, education, companies, or skills.

### 4.4 Interview Preparation Agent

Given a candidate profile and job description, the system should generate:

- Interview question plan
- Skill-specific questions
- Resume-based questions
- Mock interview session
- Answer feedback
- Improvement plan

This is a strong LangGraph use case because the workflow is stateful:

1. Analyze role and resume.
2. Generate interview plan.
3. Ask question.
4. Evaluate answer.
5. Adapt next question.
6. Summarize performance.

State should be checkpointed so the session can resume later.

### 4.5 Human-Approved Outreach Drafting

The previous "AI sends email to HR automatically" idea should be replaced with a safer workflow.

New flow:

1. Match is created.
2. AI retrieves evidence from candidate resume and job description.
3. AI drafts outreach email.
4. AI validates that the email does not invent facts.
5. Recruiter reviews and approves.
6. Notification service sends the email.

The AI service should not directly send emails.

Required guardrails:

- No auto-send by default.
- Every candidate claim must be evidence-backed.
- Recruiter approval required before sending.
- Resume attachment must only be included with jobseeker consent.
- Store draft version, approval status, and final sent payload.

### 4.6 Company and Role Research Agent

For jobseekers, the system can help research a company and role before applying.

Possible tasks:

- Summarize the role.
- Compare company requirements against the candidate profile.
- Generate application strategy.
- Draft cover letter.
- Generate likely recruiter screening questions.

This becomes agentic only if external tools are introduced, such as web search or company knowledge retrieval. Without external tools, it should remain a deterministic RAG workflow.

### 4.7 Application Tracker Agent

The system should help jobseekers track:

- Jobs applied to
- Recruiter responses
- Interview rounds
- Follow-up dates
- Next best action

Agent tools may include:

- Application lookup
- Notification scheduling
- Email draft generation
- Calendar/reminder integration in the future

This use case is useful for learning stateful agents, scheduled workflows, and tool orchestration.

## 5. Non-Goals

The platform should not:

- Auto-send cold emails without human approval.
- Let an LLM decide the recipient email address without validation.
- Let an LLM directly mutate important database records without tool-level authorization.
- Treat every LLM call as an agent.
- Build flashy AI demos without evals.
- Generate candidate claims without citations.

## 6. Recommended Architecture

### 6.1 Services

Backend service:

- Owns users, profiles, job posts, resumes, and core APIs.

Notification service:

- Owns email delivery.
- Owns real-time socket notifications.
- Owns notification persistence.

AI service:

- Owns RAG ingestion.
- Owns embeddings.
- Owns vector search.
- Owns LLM workflows.
- Owns LangGraph workflows.
- Owns AI evaluations and traces.

Shared package:

- Owns shared schemas.
- Owns Kafka topic constants.
- Owns shared event contracts.

### 6.2 Event-Driven Flow

Recommended Kafka topics:

- `ai.resume.index.requested`
- `ai.resume.index.completed`
- `ai.job.index.requested`
- `ai.job.index.completed`
- `ai.match.analysis.requested`
- `ai.match.analysis.completed`
- `ai.outreach.draft.requested`
- `ai.outreach.draft.completed`
- `notification.email`

Example match analysis flow:

1. Backend publishes `ai.match.analysis.requested`.
2. AI service consumes the event.
3. AI service retrieves resume, job, and profile data.
4. AI service performs RAG-based analysis.
5. AI service validates structured output.
6. AI service stores analysis and publishes `ai.match.analysis.completed`.
7. Backend/UI displays the result.

Example outreach flow:

1. Recruiter requests outreach draft.
2. Backend publishes `ai.outreach.draft.requested`.
3. AI service generates draft with evidence.
4. Recruiter reviews draft.
5. Backend publishes approved email event to `notification.email`.
6. Notification service sends the email.

## 7. Data and Indexing Requirements

The AI service should index:

- Resume text
- Resume metadata
- Job descriptions
- Required skills
- Candidate profile fields
- Recruiter/company profile fields
- Match analysis outputs
- Interview prep history

Each indexed chunk should store:

- Source type
- Source ID
- Owner user ID
- Chunk text
- Chunk index
- Embedding model
- Created timestamp
- Access control metadata

Access control is mandatory. A recruiter must not retrieve private candidate data unless the platform rules allow it.

## 8. AI Safety and Guardrails

All LLM outputs that affect product behavior must be structured and validated.

Use Zod schemas for:

- Match analysis
- Candidate ranking
- Outreach draft
- Interview question plan
- Career advice
- Resume rewrite suggestions

Required guardrails:

- Evidence citation required for candidate claims.
- Unsupported claims must be rejected or marked as uncertain.
- Emails require human approval.
- Resume attachment requires consent.
- Prompt injection checks on uploaded resumes and job descriptions.
- Rate limits for AI endpoints.
- Cost limits per workflow.
- Retry and timeout handling.

## 9. Evaluation Requirements

Production-ready AI means measurable AI.

The project should include an eval dataset with:

- Sample resumes
- Sample job descriptions
- Expected match categories
- Expected missing skills
- Expected ranking order
- Bad examples that test hallucination
- Prompt injection examples

Minimum evals:

- Resume parsing accuracy
- Skill extraction accuracy
- Match score consistency
- Citation correctness
- Hallucination rate
- Recruiter search ranking quality
- Outreach draft factuality

The AI service should log:

- Prompt version
- Model name
- Token usage
- Latency
- Cost estimate
- Retrieved chunk IDs
- Final structured output
- Validation failures

## 10. Suggested Implementation Roadmap

### Phase 1: RAG Foundation

- Extract resume text from uploaded PDFs.
- Extract job description text.
- Chunk resume and job data.
- Generate embeddings.
- Store vectors.
- Build vector search endpoints.

### Phase 2: Fit Analyzer

- Implement resume/JD fit analysis.
- Add evidence citations.
- Add Zod validation.
- Store match analysis results.
- Add UI display for strengths, gaps, and evidence.

### Phase 3: Evals

- Create a small eval dataset.
- Add automated scoring for structured outputs.
- Track hallucinations and citation failures.
- Version prompts.

### Phase 4: Recruiter Search Agent

- Add tool-based candidate search.
- Combine vector search and database filtering.
- Rank candidates with evidence.
- Save recruiter shortlists.

### Phase 5: Interview Prep Agent

- Build stateful LangGraph workflow.
- Add checkpointing.
- Support multi-turn mock interviews.
- Store session summaries.

### Phase 6: Human-Approved Outreach

- Generate outreach drafts.
- Add approval workflow.
- Send final approved email through notification service.
- Attach resume only when consent exists.

### Phase 7: Production Hardening

- Add tracing.
- Add rate limits.
- Add cost tracking.
- Add retries and dead-letter handling.
- Add prompt injection tests.
- Add access control tests.

## 11. Technology Direction

Preferred stack:

- TypeScript for the AI service to match the current monorepo.
- LangGraph JS for stateful workflows.
- LangChain JS or direct OpenAI SDK calls for model and retrieval flows.
- Zod for structured validation.
- Kafka for async workflow events.
- MongoDB for primary product data.
- A vector database or vector store for embeddings.

Python should only be introduced if there is a concrete technical reason, such as a Python-only document processing, OCR, ranking, or evaluation stack. "AI means Python" is not a valid reason by itself.

## 12. Success Criteria

The project is successful when it demonstrates:

- Grounded RAG outputs with citations.
- Agent workflows that genuinely use tools and state.
- Human approval for risky actions.
- Measurable eval results.
- Clear separation between AI orchestration and notification delivery.
- Production concerns: retries, validation, access control, monitoring, and cost tracking.

The strongest portfolio story is not "I added AI." The strongest story is:

> I built a production-style AI recruiting platform with RAG, evaluated outputs, guarded agent workflows, event-driven architecture, and human approval for risky actions.
