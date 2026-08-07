# Learn AI Engineering

A self-paced, build-first roadmap for **modern AI engineering** — the discipline as it's actually practiced in industry today: LLM applications, agents, RAG, structured outputs, evals, and production deployment.

This is **not** a machine learning or data science curriculum. There is no calculus, no training-from-scratch, no Kaggle. The premise: modern AI engineering is a *software engineering* discipline that treats models as components you build products around.

> [!NOTE]
> This roadmap was created based on my own research, then optimized and enhanced with Claude Fable 5.

## Who this is for

Me — an Associate AI Engineer rebuilding skills from the ground up with current tools and current patterns. Python itself is taught from the start in Phase 1, scoped to exactly what AI engineering uses; prior ML theory is not required.

## Operating principles

1. **Build first, read second.** Every phase is anchored to a project. Reading without shipping doesn't count as progress.
2. **Raw APIs before frameworks.** Build the agent loop, the RAG pipeline, and structured-output parsing by hand once. Then adopt frameworks knowing exactly what they abstract.
3. **One primary tool per category.** Depth in one vector DB, one agent framework, one eval tool beats surface familiarity with five. "Also know about" lists exist so you can navigate job descriptions and migrations, not so you learn them all.
4. **Evals are the core skill.** The difference between a demo and a product is a test suite that tells you when you made things worse. This gets its own phase and shows up early in small ways.
5. **Exit by competence, not calendar.** Each phase ends with exit criteria. Move on when you can do the things — whether that took a week or a month.
6. **AI assistants, used deliberately.** Claude Code and friends are part of the modern workflow — use them for scaffolding, debugging, and explanations. But hand-write each phase's core learning target (the agent loop, the retrieval pipeline, the eval harness) at least once: you can't review AI-generated code in a domain you've never coded yourself.

## The map

| Phase | Focus | You build |
| ------- | ------- | ----------- |
| [1 — Foundations](phases/01-foundations.md) | Python for AI engineering (from the ground up), tooling, async, FastAPI, streaming, SQL, Docker | A typed data-wrangling CLI, then a streaming SSE service — tested, containerized |
| [2 — LLMs & Model APIs](phases/02-llms-and-model-apis.md) | How LLMs behave, provider APIs, open-weight models, cost/latency | A terminal chat client from scratch (hosted + local models) |
| [3 — Prompting & Structured Outputs](phases/03-prompting-and-structured-outputs.md) | Prompt engineering, JSON schema outputs, tool calling by hand | A document-extraction pipeline with measured accuracy |
| [4 — RAG](phases/04-rag.md) | Embeddings, chunking, pgvector, hybrid search, reranking | Docs-chat over a real corpus, with citations and retrieval evals |
| [5 — Agents](phases/05-agents.md) | Agent loops, LangGraph, MCP, human-in-the-loop, multi-agent | An agent three ways: raw loop, LangGraph, and an MCP server |
| [6 — Evals & Observability](phases/06-evals-and-observability.md) | Golden sets, LLM-as-judge, tracing, CI regression gates | A 50+ case eval suite and full tracing on your Phase 4–5 apps |
| [7 — Production](phases/07-production.md) | Architecture, gateways, caching, vLLM, cloud AI platforms (Azure/AWS), deployment, cost control | Docs-chat deployed for real: gateway, queue, cloud leg, dashboards, alerts |
| [8 — Capstone](phases/08-capstone.md) | Everything, end to end | A complete AI product: deployed, evaluated, observable, documented |

Phases build on each other — projects from 4 and 5 get instrumented in 6 and deployed in 7. Work them in order. Phase 1 teaches the language itself, scoped to this field: skim what you already know, drill what you don't.

## Rough effort

Self-paced, but for planning: Phase 1 runs ~30–50 hours if Python is genuinely new territory (a fraction of that as a refresher), phases 2–3 run ~15–25 focused hours each, phases 4–7 run ~25–40 each, and the capstone is as big as you make it (aim for 40+). At ~10 hours/week that's roughly six months to a strong, defensible skill set.

## Before you start

- **Keys & spend caps:** create an Anthropic API key and set a hard monthly spend limit in the console *before* writing any code — $10–20/month is plenty through Phase 5. Keys live in environment variables, never in code or git.
- **Budget reality:** worked carefully (cheap model tiers for drills, prompt caching, Ollama for free local calls), the whole roadmap costs roughly $50–150 in API spend, plus ~$10–30 of rented GPU time in Phase 7.
- **Hardware:** an ordinary laptop is enough for everything — no GPU needed. Ollama on CPU is slow but fine for learning; the only real GPU work (Phase 7's vLLM leg) uses serverless GPU rented by the hour.
- **Day-zero installs:** uv, Docker, git, and an editor with pyright wired in. That's the entire toolchain until Phase 4 adds Postgres (which runs in Docker anyway).
- **Rhythm:** short frequent sessions beat weekend marathons; end sessions mid-task so restarting is cheap, and tick exit criteria as you go. The classic failure mode of self-paced plans is the tutorial loop — the guard is simple: start each phase's project no later than a third of the way through the reading, before it feels like you're "ready."

## The stack

Everything this roadmap uses, what it is, and why it earned the slot. Primary picks get real depth; "aware" rows exist so job descriptions and migration decisions never surprise you.

### Languages & core engineering

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [Python](https://www.python.org) | The language | Industry default for AI engineering; every major framework here is Python-first | 1+ |
| [SQL / PostgreSQL](https://www.postgresql.org) | Relational database & query language | App data, vectors, and full-text search all live in Postgres from Phase 4 on | 1, 4+ |
| [uv](https://docs.astral.sh/uv/) | Python package & project manager | Replaces pip/venv/poetry/pyenv with one fast tool; the current standard | 1+ |
| [ruff](https://docs.astral.sh/ruff/) | Linter + formatter | One instant tool, no config debates | 1+ |
| [pyright](https://microsoft.github.io/pyright/) | Static type checker | AI apps are schema-heavy; typing catches contract breaks before runtime | 1+ |
| [pytest](https://docs.pytest.org) | Test framework | Tests in every phase; later carries eval suites too | 1+ |
| [Pydantic](https://docs.pydantic.dev) | Data validation & serialization | The load-bearing library of the field: API contracts, LLM output schemas, tool signatures | 1+ |
| [FastAPI](https://fastapi.tiangolo.com) | Async web framework | Serves every app in this roadmap; Pydantic-native, streaming-friendly | 1+ |
| [httpx](https://www.python-httpx.org) | Async HTTP client | Raw provider API calls, SSE consumption, concurrent fan-out | 1+ |
| [Docker](https://docs.docker.com) | Containers | Local infra (Postgres, Langfuse) and the deployment artifact | 1+ |
| [GitHub Actions](https://docs.github.com/en/actions) | CI/CD | Runs tests and eval regression gates on every change | 6–7 |

### Models & model access

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [Anthropic API](https://docs.anthropic.com) | Hosted frontier models (Claude) | The API studied in depth: streaming, tool use, prompt caching, batches | 2+ |
| [OpenAI API](https://platform.openai.com/docs) | Hosted frontier models | The de facto wire-format standard most tooling speaks | 2 |
| [Ollama](https://ollama.com) | Local model runner | Run open-weight models (Llama/Qwen/DeepSeek families) on your own machine | 2 |
| [OpenRouter](https://openrouter.ai) | Model aggregator | Aware: many models behind one key | 2 |
| [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/) | Microsoft's unified AI platform (rebranded from Azure AI Foundry) | Enterprise route to frontier models with quotas, content filters, private networking; first-choice cloud | 2, 7 |
| [Amazon Bedrock](https://aws.amazon.com/bedrock/) | AWS managed model access | Claude and other models with AWS governance; Knowledge Bases, Guardrails | 2, 7 |
| [Vertex AI](https://cloud.google.com/vertex-ai) | GCP's AI platform | Aware: same concepts, third ecosystem | 7 |

### Structured outputs, RAG & agents

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [Instructor](https://python.useinstructor.com) | Structured-output library | Pydantic-validated LLM outputs with retries — adopted after hand-rolling the same loop | 3 |
| [pgvector](https://github.com/pgvector/pgvector) | Vector extension for Postgres | Vectors + metadata + BM25 in one boring, correct database | 4+ |
| [sentence-transformers](https://sbert.net) | Open-source embeddings & rerankers | Local embedding and cross-encoder reranking without API costs | 4 |
| [Cohere Rerank](https://docs.cohere.com/docs/rerank-overview) | Hosted reranker | The biggest retrieval-quality jump per line of code | 4 |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Agent orchestration framework | Primary framework: durable state, human-in-the-loop, streaming | 5 |
| [MCP](https://modelcontextprotocol.io) | Model Context Protocol | The open standard for exposing tools to AI apps; you build a server | 5, 8 |
| [Pydantic AI](https://ai.pydantic.dev) | Type-safe agent framework | Aware: the lighter-weight alternative worth watching | 5 |
| [Claude Agent SDK](https://docs.anthropic.com/en/api/agent-sdk/overview) | Agent harness SDK | Aware: the production harness behind Claude Code | 5 |

### Evals, observability & production

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [promptfoo](https://www.promptfoo.dev) | Eval & red-team CLI | Config-driven eval suites wired into CI; automated red-teaming | 6 |
| [DeepEval](https://deepeval.com) | Pytest-native eval library | Prebuilt LLM/RAG metrics (faithfulness, relevancy) inside the pytest you already use | 6 |
| [Ragas](https://docs.ragas.io) | RAG evaluation library | Aware: RAG-metric vocabulary; overlaps DeepEval | 4, 6 |
| [Langfuse](https://langfuse.com) | LLM observability platform | Open-source tracing, cost tracking, datasets, feedback capture; self-hostable | 6+ |
| [LiteLLM](https://docs.litellm.ai) | LLM gateway/proxy | One choke point for budgets, rate limits, fallbacks, model routing | 7 |
| [vLLM](https://docs.vllm.ai) | Inference server | The standard for self-hosting open-weight models on GPUs | 7 |
| [Redis](https://redis.io) + [arq](https://arq-docs.helpmanual.io) | Queue + async worker | Background jobs (ingestion, long agent runs) off the request path | 7 |
| [Fly.io](https://fly.io) / [Railway](https://railway.com) | Container hosting | Simple, cheap deploys for containerized apps | 7 |
| [Modal](https://modal.com) | Python-native serverless + GPU | Serverless GPUs for vLLM legs and spiky workloads | 7 |
| [Azure AI Search](https://learn.microsoft.com/en-us/azure/search/) | Managed retrieval service | The managed version of the RAG stack you built by hand | 7 |
| [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/) | Serverless containers on Azure | Primary cloud deploy target (Azure-first) | 7 |

## Progress

- [ ] Phase 1 — Foundations
- [ ] Phase 2 — LLMs & Model APIs
- [ ] Phase 3 — Prompting & Structured Outputs
- [ ] Phase 4 — RAG
- [ ] Phase 5 — Agents
- [ ] Phase 6 — Evals & Observability
- [ ] Phase 7 — Production
- [ ] Phase 8 — Capstone

## Project code

Keep phase projects in their own repos (they're portfolio pieces) and link them here as you go:

- Phase 1 wrangle CLI + mockstream: *(link)*
- Phase 2 chat client: *(link)*
- Phase 3 extraction pipeline: *(link)*
- Phase 4 docs-chat: *(link)*
- Phase 5 agent + MCP server: *(link)*
- Phase 8 capstone: *(link)*
