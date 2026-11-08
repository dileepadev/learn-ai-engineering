# Phase 1 — Software & AI Foundations

**Goal:** Build and deploy reliable Python backend APIs and data pipelines, and understand how modern language models work and how to evaluate model behavior.
**You build:** A production-shaped AI backend — an authenticated, streaming FastAPI service with a small TypeScript frontend, an idempotent background queue, tests, and Docker — plus a short lab that opens up the models themselves.
**Effort:** ~90–130 hours (months 1–2 at 10–15 hours a week). Skim what you already know; never skip the project.

## Why this phase exists

AI engineering is mostly software engineering under unusual constraints: everything is async and streamed, everything is untyped JSON until you force types onto it, and every dependency is a slow, expensive, flaky external API. The systems later phases build — retrieval with permissions, agents that take real actions, gated releases — fail on ordinary engineering long before they fail on the model: a retry that charges a customer twice, a queue that redelivers a poison message forever, a stream the UI cannot resume. So this phase builds the substrate first: Python and its modern tooling, backend and data engineering, the distributed-systems patterns that make retries safe, and enough frontend to put a streaming, trustworthy UI in front of a model.

Section 2 adds the theory you need to reason about models instead of treating them as magic: how they learn, how they are measured, and why inference behaves the way it does. Read it at literacy depth — enough to explain precision vs recall, a KV cache, or why numerical precision matters on a GPU. Building training pipelines is the ML Engineer track's job, not the core's.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## 1. Programming & Software Engineering

### Python

> [!TIP]
> **[Part A is built out in `01-foundations/part-a/`](01-foundations/part-a/README.md)** — a lesson and a set of failing tests for each Python fundamentals topic, from core mechanics to type hints and SQL. Read the lesson, fill in the drills, and run `uv run pytest phases/01-foundations/part-a` until it's green, or run the same tests in the browser on the site. Test out of what you already know.

- Fundamentals, OOP, data structures, algorithms
- Functions, decorators, generators, context managers
- Async Python, concurrency, multiprocessing
- Type hints, error handling, logging
- Testing: pytest, mocking, unit/integration tests
- Package management, virtual environments
- **[MUST]** Modern project tooling: `uv`/pip, dependency locks, `ruff`, `mypy`/Pyright, pre-commit, reproducible environments
- **[IMPORTANT]** Python profiling, memory profiling, `asyncio` cancellation, structured concurrency and safe task lifecycle
- **[IMPORTANT]** AI-assisted software delivery: coding agents, repository context, test-first development and review of generated changes

### Backend Engineering

- HTTP, REST APIs, API design
- FastAPI, Pydantic, JSON Schema
- Authentication, authorization, JWT, OAuth
- WebSockets, Server-Sent Events (SSE)
- Background tasks, queues, webhooks
- **[MUST]** Idempotency keys, request deduplication, circuit breakers, backpressure, graceful degradation
- **[MUST]** API contract tests, OpenAPI, versioning, pagination and async job-status endpoints
- **[IMPORTANT]** gRPC and service-to-service communication; safe file uploads and signed object storage URLs

### Databases & Data Engineering

- SQL, PostgreSQL, Redis
- JSON, JSONL, Parquet
- Database design, data modeling
- ORM, migrations, transactions
- ETL/ELT, data pipelines, data quality
- **[MUST]** Data contracts, schema evolution, lineage, provenance, change-data-capture (CDC), deletion propagation
- **[MUST]** Data permissions, retention, freshness guarantees, ingestion SLAs and quality checks
- **[IMPORTANT]** Apache Spark, Kafka, event streaming, lakehouse concepts (Delta Lake/Iceberg), query engines
- **[SPECIALIST]** Real-time feature pipelines and point-in-time correct feature stores (Feast or managed alternatives)

### Software Engineering & DevOps

- Git, GitHub, Linux, CLI
- Docker, containers, environment management
- Configuration and secret management
- CI/CD fundamentals, GitHub Actions
- Testing, debugging, documentation
- **[MUST]** Infrastructure as Code fundamentals (Terraform/OpenTofu); dependency scanning, SBOMs, signed artifacts
- **[IMPORTANT]** Automated API load tests and developer experience: scripts, templates, local staging and reproducible demos

### Distributed Systems for AI · MUST

- Message delivery semantics, at-least-once processing, exactly-once effects through idempotency
- Consistency, replication, partitioning, caching, distributed locks, race conditions
- Retry storms, exponential backoff with jitter, dead-letter queues, poison messages
- Queue-worker scaling, fan-out/fan-in, task deadlines, cancellation, resource budgets
- Durable execution, workflow orchestration and compensating actions (saga patterns)

### Full-Stack AI Product Engineering · IMPORTANT (basic capability is a MUST)

- TypeScript/JavaScript fundamentals; React/Next.js or a comparable web frontend
- Streaming token/tool results with SSE or WebSockets; resumable jobs and partial failure UX
- Structured AI output rendering, citation/source displays, feedback collection and error states
- Human-approval interfaces, progress/step visualization and clearly distinguished AI-generated content
- Accessibility, usability, user trust, uncertainty display and automation-bias mitigation

**Outcome:** Build and deploy reliable Python backend APIs and data pipelines.

## 2. AI & Machine Learning Foundations

Literacy depth: the aim is to reason about model behavior, metrics, and inference cost — not to train production models. The **[SPECIALIST]** items, and training pipelines generally, belong to the ML Engineer and Inference specializations.

### Machine Learning

- Supervised and unsupervised learning
- Classification, regression, clustering
- Feature engineering, data preprocessing
- Train/validation/test splits
- Accuracy, precision, recall, F1, ROC-AUC
- Overfitting, underfitting, generalization
- Model serving and inference
- **[IMPORTANT]** Dataset labeling and annotation standards; class imbalance and data leakage
- **[SPECIALIST]** Model registries, automated training pipelines, feature-store offline/online consistency

### Deep Learning

- Neural networks, backpropagation
- Gradient descent, optimizers, loss functions
- PyTorch basics, tensors, autograd
- GPU fundamentals, batching, training loops
- **[IMPORTANT]** CPU/GPU profiling, memory budgets, numerical precision (FP16/BF16) and accelerator trade-offs
- **[SPECIALIST]** CUDA execution model, memory bandwidth, GPU scheduling and distributed training fundamentals

### NLP & Embeddings

- Text preprocessing, tokenization
- Word embeddings, semantic similarity
- Vector representations, cosine similarity
- Sequence modeling, language modeling

### Transformers

- Attention, self-attention, multi-head attention
- Positional encodings
- Encoder, decoder, encoder-decoder
- Pretraining, fine-tuning, inference
- Transformer architecture and limitations
- **[IMPORTANT]** Decoder prefill vs decode stages, attention cost, context-size trade-offs, KV cache fundamentals
- **[SPECIALIST]** Reasoning-process and tool-use benchmarking, robustness to distribution shift

**Outcome:** Understand how modern language models work and how to evaluate model behavior.

## Hands-on project: a production-shaped AI backend

A service shaped like the ones you will put real models behind from Phase 2 on — built here with a fake model, so you learn the engineering with zero API cost. Model the domain as a document job API ("summarize this document"), so later phases can swap a real model in without touching the plumbing.

1. **Service:** FastAPI with Pydantic request/response models, a published OpenAPI contract, versioned routes (`/v1/...`), cursor pagination, and JWT authentication with at least two roles that see different data.
2. **Streaming:** an SSE endpoint that streams fake tokens and fake tool-call events word by word, ends with a `[DONE]` event, and resumes from `Last-Event-ID` after a dropped connection.
3. **Queue:** long jobs go to a Redis-backed worker with job-status endpoints; an `Idempotency-Key` header deduplicates client retries; handlers are idempotent under at-least-once delivery, with exponential backoff and jitter, a dead-letter queue, and a poison-message test.
4. **Data:** Postgres with migrations and transactions; a versioned data contract on job inputs; deleting a document propagates to every record derived from it, and a test proves it.
5. **Frontend:** a small TypeScript page (React or Next.js) that streams tokens, renders the structured result, shows error and partial-failure states, labels AI-generated content as such, and resumes after a reconnect.
6. **Quality:** unit and integration tests (including a streaming test and an API contract test against the OpenAPI schema), `ruff` and `pyright` clean, pre-commit hooks, and an automated load test that reports p95 latency.
7. **Ship:** a multi-stage Dockerfile, compose for app + worker + Postgres + Redis, GitHub Actions running lint, types, tests, a dependency scan, and an SBOM; deploy the container to any public host, and provision at least one piece of its infrastructure with Terraform/OpenTofu.

**Stretch:** put a circuit breaker around a deliberately flaky downstream dependency and degrade gracefully in the UI; or feed a second store from Postgres with change-data-capture.

## Hands-on lab: models from the inside

Three short exercises, an afternoon each, that make Section 2 concrete.

1. Train a small text classifier on a labeled public dataset and report accuracy, precision, recall, F1, and ROC-AUC on a held-out test split — then leak test data into training on purpose and watch the numbers lie.
2. Write a training loop for a tiny neural network in PyTorch — tensors, autograd, a loss, an optimizer — and watch the loss fall; then set the learning rate too high and watch it diverge.
3. Run a small open-weight model locally and time prefill against decode as the prompt grows; estimate its KV-cache memory for a long context with the arithmetic 2 × layers × KV heads × head dimension × tokens × bytes per value.

## Exit criteria

- [ ] I can start a new Python project (uv, ruff, pyright, pytest, pre-commit, src layout) from scratch in under 10 minutes
- [ ] I can explain how an idempotency key turns at-least-once delivery into exactly-once effects, and I have a test that proves it
- [ ] My service streams over SSE to a TypeScript frontend that handles errors, partial failure, and reconnects
- [ ] Long work runs through a queue with jittered retries, a dead-letter queue, and job-status endpoints
- [ ] I can write SQL with joins, aggregates, and transactions against Postgres, and explain a migration and a data contract
- [ ] `docker compose up` runs the whole stack; CI runs lint, types, tests, and a dependency scan; one resource is provisioned with Terraform/OpenTofu
- [ ] I can explain precision vs recall, data leakage, and overfitting using my own lab results
- [ ] I can explain attention, prefill vs decode, and the KV cache, and estimate a model's KV-cache memory for a given context length
