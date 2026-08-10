# Phase 7 — Production: Architecture, Deployment & Scaling

**Goal:** Ship and operate AI systems: gateway patterns, caching, queues, self-hosted model serving, deployment, security, and cost engineering.
**You build:** `docs-chat`, deployed for real — gateway, background ingestion, dashboards, load-tested, budget-alarmed.
**Effort:** ~25–40 hours.

## Why this phase exists

The gap between "works on my machine" and "runs for strangers" is where AI engineers earn the title. AI workloads bend normal web architecture in specific ways — requests take 30 seconds and stream, dependencies rate-limit you, marginal cost per request is real money, and a misbehaving prompt can burn a budget overnight. The patterns here are the difference between an app and a liability.

## Core skills

### Architecture patterns for AI apps

- **The gateway layer:** route all model traffic through one choke point — [LiteLLM](https://docs.litellm.ai) proxy (or provider-native routing) — giving you per-key budgets, rate limits, model fallbacks, retries, and unified logging in one place instead of scattered through app code.
- **Model routing & tiering:** cheap/fast models for easy calls (classification, rewriting), frontier models where quality pays; automatic fallback to a second provider on outage. Your Phase 6 evals are what make tier-downgrades safe.
- **Async by architecture:** anything slow (ingestion, batch extraction, long agent runs) goes through a queue/worker (start with Postgres-backed jobs or arq/Celery + Redis), with status polling or push updates; only interactive chat stays on the request path, streaming via SSE behind a proper reverse proxy (buffering off — the classic gotcha).
- **Caching stack:** provider prompt caching (Phase 2 layout habits pay off here) → exact-match response cache → semantic cache (embed the query, serve cached answers above a similarity threshold — mind the staleness/false-hit tradeoffs).
- Multi-tenancy basics: per-user rate limits and spend attribution from day one; "one user cost us $400 last night" is a rite of passage you can skip.

### Security & safety in production

- Secrets management (env/vault, never in code), key rotation, and scoped keys per environment.
- The injection perimeter, now for real: outputs are untrusted (escape/validate before they touch HTML, SQL, or shells), tool-bearing agents run least-privilege, retrieved content is data-not-instructions (Phases 3/5 lens, enforced at the boundary).
- PII discipline: what enters prompts, what persists in traces/logs, retention policy on both. Know your provider's data-usage terms cold.
- Abuse controls: auth in front of anything that spends tokens, per-IP/user throttles, hard budget kill-switches.

### Serving open-weight models

- **[vLLM](https://docs.vllm.ai)** as the standard self-hosted inference server: OpenAI-compatible endpoint, continuous batching, PagedAttention — understand *what* those buy you (high-throughput GPU serving) at the operator level, not the implementer level.
- Quantization in practice: AWQ/GPTQ-class 4-bit for GPU serving, GGUF for CPU/edge; the VRAM arithmetic (params × bytes + KV cache) that tells you what fits on what GPU.
- Where the GPUs live: serverless GPU platforms (**[Modal](https://modal.com)**, RunPod, Replicate) for spiky workloads vs reserved instances for steady ones; per-token API pricing vs per-hour GPU math for the build-vs-buy call.
- **Fine-tuning, honestly:** the last resort after prompting, RAG, and routing — legitimate for style consistency, narrow high-volume tasks on small models, and latency/cost crunches. Know LoRA conceptually and that hosted fine-tuning services exist; spend an afternoon here, not a month. Your evals (Phase 6) are the prerequisite — without them you can't even tell if fine-tuning helped.

### Cloud AI platforms (Azure & AWS)

Enterprise employers hire against these by name, and everything you've built by hand exists as a managed service. Learn them as *mappings*, not new material — each service is the managed version of a box you already run, which means you can evaluate the build-vs-buy trade per component instead of taking the platform on faith:

- **[Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/)** (first choice; renamed from Azure AI Foundry in January 2026 — same platform, unified under the Microsoft umbrella rather than filed under Azure): Microsoft's AI app and agent platform. Its model catalog (OpenAI models, Claude, open weights) behind managed endpoints with quotas, content filters, and private networking maps to your gateway; **[Azure AI Search](https://learn.microsoft.com/en-us/azure/search/)** (hybrid retrieval + semantic reranking) maps to your Phase 4 pipeline; the **Foundry Agent Service** maps to your LangGraph harness. Learn where each one earns its cost and where it boxes you in.
- **[Amazon Bedrock](https://aws.amazon.com/bedrock/)** (second choice): managed access to Claude and other models under AWS governance; **Knowledge Bases** = managed RAG ingestion + retrieval; **Guardrails** = managed input/output screening; **Bedrock Agents / AgentCore** = managed agent harness. Same mapping exercise.
- **[Vertex AI](https://cloud.google.com/vertex-ai)** (GCP): awareness level — same shapes, third vendor; recognize the names in job descriptions.
- Supporting cloud skills that ride along: secrets managers (Azure Key Vault / AWS Secrets Manager), managed Postgres with pgvector (Azure Database for PostgreSQL / RDS), and container platforms (Azure Container Apps / ECS Fargate).
- The honest trade to internalize: managed AI services buy compliance, speed, and enterprise checkboxes; they cost flexibility, portability, and often quality-per-dollar. Teams that never built the raw version can't tell which side of that trade they're on — you can, and that's the interview answer.

### Shipping & operating

- Deployment targets, pick one and go deep: **Fly.io or Railway** for containerized simplicity, **Modal** for Python-native + GPU, or **Azure Container Apps** if you want the cloud line on your CV to be load-bearing. Your Phase 1 Docker skills carry you regardless.
- CI/CD: tests + evals gate → build → deploy → smoke test; prompt changes ride the same pipeline as code changes (they *are* code changes).
- SLOs that fit AI: time-to-first-token, tokens/sec, p95 end-to-end, error rate, cost per request, eval pass rate. Alert on cost anomalies as seriously as on errors.
- Load behavior: use your Phase 1 concurrent client (or Locust/k6) to find where streaming concurrency breaks and what the provider rate limit does to p95 under burst.

## Hands-on project: `docs-chat`, productionized

1. **Gateway:** LiteLLM proxy in front of all model calls — two providers configured, automatic fallback (kill provider A's key and watch traffic fail over), per-key budget and rate limit.
2. **Queue:** document ingestion moves to a background worker with job-status endpoints; chat stays interactive/streamed.
3. **Caching:** exact-match cache, then semantic cache; measure hit rate and cost saved over a realistic query replay.
4. **Deploy:** app + Postgres/pgvector + worker + Langfuse on your chosen platform, TLS included, secrets managed properly, deployed from CI with the Phase 6 eval gate in front.
5. **Operate:** dashboard (Langfuse + platform metrics) showing TTFT, p95, cost/request, error rate; alert (email/Slack/webhook) on daily-spend threshold; a written half-page runbook: "provider down," "cost spike," "quality drop."
6. **Load test:** 50 concurrent streaming sessions; find the first bottleneck; fix or document it.
7. **Open-weight leg:** serve a small quantized model with vLLM (local GPU or a cheap Modal/RunPod hour) behind the gateway as a third route; run your Phase 6 evals against it and write the honest cost-vs-quality comparison.
8. **Cloud leg:** stand up a model deployment in Microsoft Foundry (or Bedrock) and add it to the gateway as another provider route — run the same evals through it. Optionally redeploy the whole stack to Azure Container Apps. Write down what the managed route bought you and what it cost you versus the direct APIs.

**Stretch:** semantic-cache invalidation strategy for when the corpus updates; blue/green deploy a prompt change with eval-gated rollback; or rebuild the retrieval layer on Azure AI Search and compare recall@5 against your hand-built pgvector pipeline.

## Resources

- [LiteLLM docs](https://docs.litellm.ai) — proxy setup, routing, budgets
- [vLLM docs](https://docs.vllm.ai) — quickstart + serving guide; skim the architecture page for vocabulary
- [Modal docs & guides](https://modal.com/docs) — even if you deploy elsewhere, their LLM serving examples are excellent
- [Microsoft Foundry docs](https://learn.microsoft.com/en-us/azure/foundry/) and [Amazon Bedrock docs](https://docs.aws.amazon.com/bedrock/) — quickstarts for the cloud leg; skim the service overviews with your architecture diagram open and do the mapping exercise
- Microsoft Learn's [AI-103 (Azure AI App and Agent Developer Associate) path](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-app-agent-developer-associate/) — optional; replaced AI-102 as of mid-2026 and is a better fit for this roadmap (it centers on generative AI apps, agents, and RAG on Microsoft Foundry rather than wiring up pre-built services). The cert itself matters less than it being the fastest structured tour of Microsoft's AI platform, and it's a recognizable line for Azure-shops
- [applied-llms.org](https://applied-llms.org) — the operational/product sections
- Chip Huyen, *AI Engineering* — inference optimization and architecture chapters
- Your deployment platform's production checklist — actually read it

## Exit criteria

- [ ] `docs-chat` is live at a URL, streaming through a gateway with working provider fallback I have demonstrated
- [ ] Ingestion runs through a queue; nothing slow lives on the request path
- [ ] I can state my app's TTFT, p95 latency, cost/request, and cache hit rate from a dashboard, not a guess
- [ ] A cost-anomaly alert exists and has fired in a test; a runbook exists for the three obvious incidents
- [ ] I served a quantized open-weight model with vLLM and produced an eval-backed cost/quality comparison against the hosted route
- [ ] I routed traffic through Microsoft Foundry or Bedrock, and I can map every box in my architecture to its Azure and AWS managed equivalent — with a build-vs-buy opinion per box
- [ ] I can whiteboard a production AI app architecture — gateway, cache, queue, tracing, eval gate — and justify each box from experience, because I have each box running
