# Phase 6 — Capstone: End-to-End Production AI Project

**Goal:** Build one complete application that combines RAG, AI agents, backend APIs, evaluation, security, monitoring and cloud deployment.
**You build:** A production-grade enterprise AI knowledge & workflow assistant — deployed, documented, evaluated and observable, with safe agent workflows, automated CI/CD, production monitoring and measurable performance.
**Effort:** ~90–130 hours (months 11–12), then one specialization after it.

## Why this phase exists

Every earlier phase built a piece; the capstone proves you can hold all of them at once, in one system, against numbers you set before you started. It is also the artifact that carries your interviews — reviewers read the architecture, the evaluation table, and the postmortem far more closely than the demo.

Deploy a walking skeleton early: the thinnest end-to-end slice, live, ugly but running. Everything after that is iteration on a working system, never a big-bang integration at the end. And compare it against simple keyword retrieval, a deterministic workflow, and a cheaper model — not just a flashy agent demo.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## The capstone: production-grade enterprise AI knowledge & workflow assistant

### Step 1 — Business & System Design

- Define use cases, users, success metrics
- Create architecture and data-flow diagrams
- Choose models, storage and deployment strategy
- **[MUST]** Establish target user outcomes, baseline/manual workflow, cost-per-success and explicit non-goals
- **[MUST]** Define SLOs, risk class, data retention, tenant boundaries and model/provider evaluation criteria

### Step 2 — Data & Knowledge Engineering

- Ingest PDFs, websites and structured data
- Build document parsing and chunking pipelines
- Create embeddings and vector indexes
- Implement hybrid retrieval and reranking
- **[MUST]** Source ACL synchronization, incremental updates/deletions, data lineage and retrieval freshness tests
- **[IMPORTANT]** Integrate one structured operational data source through batch or CDC

### Step 3 — RAG Application

- Build question-answering with citations
- Implement structured outputs and streaming
- Add context selection and grounding
- **[MUST]** Citation verification, unanswerable-query behavior and permission-aware results

### Step 4 — AI Agent Workflows

- Add document search, database and API tools
- Build stateful agent workflows
- Integrate MCP tools
- Add human approval for sensitive operations
- Add specialist agents only where justified
- **[MUST]** Compare agentic and deterministic baselines; add approval queues and replay/idempotency for write actions
- **[IMPORTANT]** Optional browser/code-execution sandbox with auditable permissions

### Step 5 — Backend Engineering

- Build FastAPI endpoints
- Implement authentication and authorization
- Add PostgreSQL, Redis and background workers
- Implement rate limits, retries, error handling
- **[MUST]** Build a simple TypeScript/React or Next.js UI with streaming output, citations, feedback and approval controls
- **[MUST]** Add multi-tenant SSO/RBAC (or a representative local role model for a demo) and contract/load tests

### Step 6 — Quality, Security & Observability

- Create golden datasets
- Evaluate retrieval, generation and agents
- Add tracing, logs and cost metrics
- Test prompt-injection resistance and permissions
- Build evaluation and regression dashboards
- **[MUST]** Track confidence intervals, judge calibration, unsafe-action tests and measured cost per successful task
- **[MUST]** Add threat model, data-flow diagram, risk register, provenance/license inventory and privacy-safe logs

### Step 7 — Deployment & AI Operations

- Containerize with Docker
- Create GitHub Actions pipelines
- Configure cloud infrastructure
- Deploy APIs, workers and storage
- Implement monitoring, scaling and rollback
- **[MUST]** Document and exercise SLOs, load tests, provider outage fallbacks, restore drills and runbooks
- **[IMPORTANT]** Optional self-hosted inference experiment with explicit benchmark and cloud-cost comparison

### Step 8 — Production Improvement

- Analyze failures and user feedback
- Optimize context, retrieval, models and cost
- Version prompts, datasets and configurations
- Continuously test and improve reliability
- **[MUST]** Conduct an A/B or simulated controlled experiment against the non-AI baseline
- **[MUST]** Publish a release report with quality, p95 latency, failure rate, spend and user outcome changes

**Final deliverable:** A deployed, documented, evaluated and observable AI application with safe agent workflows, automated CI/CD, production monitoring and measurable performance.

## Turning it into a job

The capstone is your strongest interview artifact; this is the rest of the loop.

- **LLM system design, out loud.** Practice "design a chatbot over our internal documents" and "design an agent that books meetings across calendars and email" in 45–60 minutes, covering data flow, retrieval, evaluation, failure modes, cost and latency, and safety.
- **Coding rounds, both kinds.** Practice arrays, hash maps, strings, and trees at medium difficulty unaided, and an AI-assisted round where you have to review and correct the model's code.
- **A timed take-home.** Build a small RAG or agent task with an evaluation suite in 2–3 hours and write up the trade-offs. Scope tightly and write the evaluations first.
- **Portfolio write-ups.** For the capstone and each portfolio project: a README, a demo, the evaluation table, and a short "what failed and how I fixed it" — the part reviewers actually read.
- **Explain it to a non-engineer.** Five minutes on what your system does, how you know it works, and what it costs. Forward-deployed and customer-facing roles test exactly this.
- **Behavioral stories.** Three stories about ownership in ambiguous AI work: a failure you diagnosed from traces, a trade-off you defended with evaluation numbers, and a change you rejected because of them.
- **Know the titles.** Applied AI Engineer, Agent/Automation Engineer, AI Platform Engineer, Inference Engineer, ML Engineer, Forward Deployed AI Engineer, and AI Security Engineer — the same core with different emphases, matching the specialization tracks in the README.

## Done means

Capstone acceptance criteria. Set realistic thresholds using your workload, not universal promises.

- [ ] ≥90% success on a representative held-out task set **if the task definition supports that target**, with confidence intervals and error breakdown
- [ ] Retrieval recall@k, citation support rate, and unauthorized access tests recorded; zero known critical cross-tenant access escapes at release
- [ ] Explicit p95 response latency and success-rate SLOs plus measured load-test capacity; show degradation under overload
- [ ] Dashboard for token/GPU cost per *successful business task*, retries, approvals, source freshness and user feedback
- [ ] Run a failover/rollback drill and document an incident postmortem; show deployment and audit evidence in CI
- [ ] Compare against simple keyword retrieval, deterministic workflow and cheaper model baselines — not just a flashy agent demo
- [ ] I can design a RAG assistant and an agent out loud in 45–60 minutes, covering data flow, retrieval, evaluation, failure modes, cost and latency, and safety

## After the capstone: choose a specialization

Build the core first. Then select **one** primary specialization from the tracks in the [README](../README.md#choose-a-career-specialization-after-the-core), and acquire literacy in adjacent domains. Agent frameworks, GPU kernel development, multimodal video, and all three clouds are *not* universal prerequisites.

The fourth portfolio project belongs here (optional, months 13–18): compare vLLM serving options on TTFT, throughput, VRAM, and quality, **or** build a governed CDC → lakehouse → RAG data architecture — whichever matches your track.
