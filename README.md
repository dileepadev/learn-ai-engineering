# Learn AI Engineering

A self-paced, build-first roadmap for **production AI engineering**: designing, building, evaluating, securing, deploying, operating, and scaling end-to-end AI applications, retrieval systems, agents, and multimodal workflows.

It treats AI engineering as a *software engineering* discipline that builds products around models. Machine learning and deep learning appear at literacy depth — enough to reason about model behavior, metrics, and inference cost. Training models is a specialization, not the core.

> [!NOTE]
> This roadmap was created based on my own research, then optimized and enhanced with Claude Fable 5.

> [!IMPORTANT]
> **This is the 2027 edition** — the complete, in-depth roadmap, built to be finished by **31 December 2027**. The 2026 edition (`v1.0.0`) was the fast, hands-on preview of the same ground; this edition goes deep. Revision date: 9 November 2026.

## Work through it interactively

**[dileepadev.github.io/learn-ai-engineering →](https://dileepadev.github.io/learn-ai-engineering/)**

The roadmap is also a learning app. **Every part of every phase is trackable** — each skill bullet, project step, and exit criterion is a checkbox, each section has a one-click "mark section done", and Part A topics you already know can be tested out. A **sprint planner** on the dashboard turns what is left into the hours a week it takes and a finish-by date for each phase. Phase 1's Python drills run **in your browser** — the same pytest suites that live in this repo, executed against your code via WebAssembly. No clone, no setup, no API keys, no account; progress is saved locally and exportable.

Everything it shows is generated from `phases/`, so the site and the docs cannot drift apart. Source and build instructions in [site/](site/).

## Who this is for

Me — an Associate AI Engineer who worked through the 2026 edition's hands-on preview and is now going deep. The schedule assumes existing programming competence; Python itself is still drilled from the start in Phase 1, scoped to what AI engineering uses.

## Goal

Become a production-ready AI Engineer capable of designing, building, evaluating, securing, deploying, operating, and scaling end-to-end AI applications, retrieval systems, AI agents, and multimodal workflows — with measurable product value, cost, reliability, and governance. The roadmap therefore emphasizes complete production systems rather than chatbot demos.

**Final objective:** Be able to take an AI use case from business requirements → data → models → context → RAG/agents → backend APIs → evaluation → security → monitoring → deployment → continuous improvement.

**Learning path:**

Software & Distributed Systems → Data & AI/ML Foundations → LLM & Multimodal Engineering → RAG & Agents → Evaluation & Security → AI SRE & Governance → Cloud & Inference Economics → Architecture & Product Impact

## Operating principles

1. **Build first, read second.** Every phase is anchored to a project. Reading without shipping doesn't count as progress.
2. **Master the engineering concepts before exploring every framework.** Start with direct model APIs and simple workflows, then introduce RAG, agent frameworks, multi-agent systems and advanced infrastructure when requirements justify them.
3. **Core first, then one specialization.** Build the core first. Select **one** primary specialization, and acquire literacy in adjacent domains.
4. **One primary tool per category.** Depth in one vector DB, one agent framework, one eval tool beats surface familiarity with five.
5. **Evals are the core skill.** The difference between a demo and a product is a test suite that tells you when you made things worse — with confidence intervals, not vibes.
6. **Beat a baseline.** Every RAG system is compared against keyword retrieval, every agent against a deterministic workflow, every model against a cheaper one.
7. **Exit by competence, not calendar.** Each phase ends with exit criteria. Move on when you can do the things — whether that took a week or a month.
8. **AI assistants as teachers, not just typists.** Let them write the code, including each phase's core learning target. The bar is comprehension, not authorship: every generated piece gets walked through until you can explain it, modify it, and debug it unaided. Agent instructions live in [AGENTS.md](AGENTS.md), which encodes exactly that expectation.

## Reading the tags

Untagged items in a phase are the core baseline. Tagged items add production depth:

| Tag | Meaning |
| ---- | ---- |
| **MUST** | Essential production skill |
| **IMPORTANT** | Strong employability advantage |
| **SPECIALIST** | Deep skill for selected jobs |
| **WATCH** | Emerging — monitor rather than prioritize |

## The map

| Phase | Sections | You build | Months |
| ---- | ---- | ---- | ---- |
| [1 — Software & AI Foundations](phases/01-foundations.md) | 1. Programming & Software Engineering · 2. AI & Machine Learning Foundations | A production-shaped AI backend: authenticated streaming API, TypeScript frontend, idempotent queue | 1–2 |
| [2 — Generative AI & LLM Engineering](phases/02-generative-ai-and-llm-engineering.md) | 3. Foundation Models & Context Engineering · 4. LLM Application Engineering | A provider-agnostic LLM service and the benchmark that picks its model | 3 |
| [3 — Knowledge, Retrieval & Agent Systems](phases/03-knowledge-retrieval-and-agents.md) | 5. RAG & Knowledge Engineering · 6. AI Agents & Orchestration Engineering | An evaluated RAG system and a governed workflow agent | 4–6 |
| [4 — Production Quality, Reliability & Safety](phases/04-quality-reliability-and-safety.md) | 7. AI Evaluation Engineering · 8. AI Observability Engineering · 9. AI Security & Guardrails | An AI reliability and cost lab | 7–8 |
| [5 — Deployment, Cloud & Architecture](phases/05-deployment-cloud-and-architecture.md) | 10. AI Operations · 11. Cloud AI Engineering · 12. AI System Design & Architecture | The Phase 3–4 systems on one cloud, from IaC, with gated CI/CD | 9–10 |
| [6 — Capstone](phases/06-capstone.md) | End-to-end production AI project | An enterprise AI knowledge & workflow assistant | 11–12 |
| Specialization (optional) | One track from the table below | An inference or data-platform benchmark | 13–18 |

Phases build on each other — the Phase 3 systems get evaluated and instrumented in Phase 4 and deployed in Phase 5. Work them in order.

## Recommended priority and timing

The following schedule assumes existing programming competence and ~10–15 deliberate hours weekly; it is a planning estimate, not a guarantee.

| Period | Focus | Proof of skill |
| ---- | ---- | ---- |
| Months 1–2 | Python/backend/SQL/TypeScript basics; distributed reliability patterns | Authenticated FastAPI service, streaming frontend, tests, Docker, idempotent queue |
| Months 3–4 | Model APIs, context/structured outputs, retrieval with ACLs | Citation-grounded RAG app, hybrid retrieval, permission tests, benchmarks |
| Months 5–6 | Agents, MCP, safe actions, durable workflow | Stateful approval-gated agent vs deterministic baseline, trace replay |
| Months 7–8 | Evaluation statistics, observability, SRE, security | Versioned holdout eval suite, CIs, red-team tests, trace dashboard, failure drills |
| Months 9–10 | Cloud deployment, governance, cost/latency optimization | IaC, CI/CD with quality gates, production-like deployment and runbooks |
| Months 11–12 | Capstone, domain integration, targeted specialization | Public architecture, benchmark report, risk assessment, case-study narrative |
| Months 13–18 (optional) | Inference/AI platform or advanced ML/data specialization | vLLM GPU benchmark, data platform, MLflow/Kubernetes or domain-specific project |

## Portfolio: four increasingly rigorous projects

1. **Evaluated RAG system (core).** Documents + structured data, permission-aware hybrid search, citations, negative test cases, recall@k and evaluation dashboard. Built in [Phase 3](phases/03-knowledge-retrieval-and-agents.md).
2. **Governed workflow agent (core).** Read/write tool distinction, approvals, idempotent execution, MCP integration, failure injection and permission attack tests. Built in [Phase 3](phases/03-knowledge-retrieval-and-agents.md).
3. **AI reliability and cost lab (core).** Load-test service, provider fallback, SLOs, chaos/timeout drills, cost per successful task and rollback report. Built in [Phase 4](phases/04-quality-reliability-and-safety.md).
4. **Inference or data-platform benchmark (specialization).** Compare vLLM serving options with TTFT, throughput, VRAM and quality, **or** build governed CDC→lakehouse→RAG data architecture. Built after the [capstone](phases/06-capstone.md).

## Choose a career specialization (after the core)

| Track | Best fit | Deepen after baseline |
| ---- | ---- | ---- |
| **Applied AI / LLM Engineer** | Most product AI roles | Full-stack UI, RAG, tool workflows, evals, secure integrations, cost, deployment |
| **Agent / Automation Engineer** | Workflow automation and enterprise agents | MCP, durable execution, browser/coding agents, idempotency, permissioning; A2A awareness |
| **AI Platform / MLOps Engineer** | Internal tooling and shared AI services | Kubernetes, Terraform, model gateway, MLflow, observability, GPU quotas and governance |
| **Inference / LLM Systems Engineer** | Model-serving infrastructure | GPU performance, KV cache, batching, quantization, vLLM, scheduling, profiling |
| **ML Engineer** | Predictive models and customization | PyTorch, training/data pipelines, feature stores, evaluation, registry, serving |
| **Forward-Deployed AI Engineer** | Customer implementations | Enterprise integration, domain systems, stakeholder discovery, full-stack, deployment and support |
| **AI Security / Governance Engineer** | Regulated, sensitive AI systems | Threat modeling, privacy, authorization, auditability, risk assessments and standards |

**Depth principle:** Build the core first. Select **one** primary specialization, and acquire literacy in adjacent domains. Agent frameworks, GPU kernel development, multimodal video, and all three clouds are *not* universal prerequisites.

## The 12 layers of production AI engineering

These layers describe the engineering responsibilities across the full roadmap, rather than 12 additional courses.

| Layer | Core responsibility |
| ---- | ---- |
| 1. Business Understanding | Problem, requirements, value and success metrics |
| 2. Data Understanding | Data sources, structure, quality and access |
| 3. Knowledge Engineering | Ingestion, indexing, retrieval and provenance |
| 4. Model Engineering | Model selection, inference, tuning and serving |
| 5. Context Engineering | Prompts, memory, context selection and compression |
| 6. Semantic Engineering | Meaning, embeddings, entities and relationships |
| 7. Agent Engineering | Agents, tools, planning and orchestration |
| 8. Loop Engineering | Execution cycles, control flow, retries and feedback |
| 9. Evaluation Engineering | Tests, benchmarks, metrics and quality gates |
| 10. Harness Engineering | Agent runtime, state, tool execution and sandboxing |
| 11. Infrastructure Engineering | APIs, pipelines, cloud, deployment and monitoring |
| 12. Continual Learning | Feedback, experiments, updates and optimization |

**Cross-cutting dimensions:** security/privacy, reliability/SRE, governance/provenance, product impact/AI economics. These are *not* replacements for the twelve engineering layers; they are recurring acceptance criteria in every layer.

## Recommended practical technology stack

| Category | Recommended starting stack |
| ---- | ---- |
| Language | Python |
| Backend | FastAPI, Pydantic |
| Databases | PostgreSQL, Redis |
| Vector Search | pgvector or Qdrant |
| LLM Providers | OpenAI, Anthropic, Google |
| LLM Framework | LangChain (as needed) |
| Agent Framework | LangGraph or OpenAI Agents SDK |
| Integrations | MCP, HTTP APIs |
| Evaluation | pytest, custom eval datasets, RAG/agent eval tools |
| Observability | Langfuse or LangSmith, OpenTelemetry |
| CI/CD | GitHub Actions |
| Containers | Docker |
| Cloud | AWS, Azure or GCP (choose one first) |
| Infrastructure | Managed cloud services, then Kubernetes when needed |
| Full-stack UI | TypeScript + React/Next.js for streaming, citations, feedback and approvals |
| Distributed workflows | Redis/managed queue first; Temporal when durable long-running workflows are needed |
| Data streaming | Batch + CDC; Kafka/Spark/Delta/Iceberg if enterprise scale justifies them |
| ML lifecycle | MLflow, only if experiment/model lifecycle is materially complex |
| AI governance | NIST AI RMF-informed risk register, model cards, provenance/retention audit records |
| SRE and FinOps | OpenTelemetry + service metrics + load tests + cost-per-success dashboards |
| Inference specialist | vLLM + accelerator/GPU profiler; KServe/Ray/Kubeflow as needed |
| Platform evaluation | Databricks/Snowflake/managed cloud AI platforms if job targets require them |

The repo's own Python toolchain — uv, ruff, pyright, pytest, Pydantic v2, httpx — is fixed in [AGENTS.md](AGENTS.md). Where a row offers a choice, the picks carried over from the 2026 edition stand until they are reviewed: pgvector, LangGraph, Langfuse, and Azure first, with Instructor for structured outputs, promptfoo and DeepEval for evals, LiteLLM as the gateway, and Redis + arq for queues.

## What NOT to overlearn early

- Do not master every agent framework or build multi-agent teams before establishing a single-agent baseline.
- Do not treat prompt engineering as a substitute for datasets, evaluation, access control and software reliability.
- Do not start with Kubernetes when managed container/serverless deployment meets requirements.
- Do not learn low-level CUDA, distributed model training or complex Graph RAG unless target roles require them.
- Do not treat certifications, framework popularity or benchmark leaderboards as a substitute for maintained software and measured results.

## Before you start

- **Keys & spend caps:** create provider API keys and set a hard monthly spend limit in each console *before* writing any code. Keys live in environment variables, never in code or git.
- **Budget reality:** worked carefully — cheap model tiers for drills, prompt caching, local models for free calls — API spend stays modest. The cloud work in Phase 5 and any GPU work in a specialization cost extra; set budget alerts before you start them.
- **Hardware:** an ordinary laptop is enough for the core — no GPU needed. Local models on CPU are slow but fine for learning; GPU work (self-hosted inference, the Inference specialization) uses GPUs rented by the hour.
- **Day-zero installs:** uv, Docker, git, Node.js (for the Phase 1 frontend), and an editor with pyright wired in. Terraform/OpenTofu arrives with Phase 1's DevOps work; a cloud account with Phase 5.
- **Rhythm:** short frequent sessions beat weekend marathons; end sessions mid-task so restarting is cheap, and tick exit criteria as you go. The guard against the tutorial loop is simple: start each phase's project no later than a third of the way through its reading, before it feels like you're "ready."

**Regional note:** Hiring expectations and regulatory duties depend on country, employer, industry and seniority. Treat frontier infrastructure as a specialization, while backend reliability, data permissions, safe integrations, measurable evaluations and product impact are transferable across markets.

## Progress

- [ ] Phase 1 — Software & AI Foundations
- [ ] Phase 2 — Generative AI & LLM Engineering
- [ ] Phase 3 — Knowledge, Retrieval & Agent Systems
- [ ] Phase 4 — Production Quality, Reliability & Safety
- [ ] Phase 5 — Deployment, Cloud & Architecture
- [ ] Phase 6 — Capstone
- [ ] Specialization (optional)

## Project code

Phase projects live in this repo under `projects/`, as [uv workspace](https://docs.astral.sh/uv/concepts/projects/workspaces/) members — one lockfile, one environment, one set of standards across every phase:

```text
projects/
  <NN>-<name>/       # one directory per phase project, NN = the phase number
```

Tick them off in **Progress** above as you go.

## Working with AI agents

This repo is set up agent-first. [AGENTS.md](AGENTS.md) is the single source of truth — project context, toolchain, coding standards, testing expectations, and the "explain what you generate" rule. [CLAUDE.md](CLAUDE.md), [.github/copilot-instructions.md](.github/copilot-instructions.md), and [.cursor/rules/](.cursor/rules/) are thin pointers to it, so the standards can't drift apart.

`.mcp.json` configures [Context7](https://github.com/upstash/context7) for up-to-date library documentation — the stack here moves fast, and looking up a real signature beats guessing at one.

## Interactive site deployment

GitHub Pages deployment of the learning site under `site/` is handled by
[.github/workflows/deploy-site.yml](.github/workflows/deploy-site.yml). It builds `site/` and
deploys `site/dist` on pushes to `main`.
