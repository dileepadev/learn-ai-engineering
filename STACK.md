# The stack

Everything this roadmap uses, what it is, and why it earned the slot. Primary picks get real depth; "aware" rows exist so job descriptions and migration decisions never surprise you.

## Languages & core engineering

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

## Models & model access

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [Anthropic API](https://docs.anthropic.com) | Hosted frontier models (Claude) | The API studied in depth: streaming, tool use, prompt caching, batches | 2+ |
| [OpenAI API](https://platform.openai.com/docs) | Hosted frontier models | The de facto wire-format standard most tooling speaks | 2 |
| [Ollama](https://ollama.com) | Local model runner | Run open-weight models (Llama/Qwen/DeepSeek families) on your own machine | 2 |
| [OpenRouter](https://openrouter.ai) | Model aggregator | Aware: many models behind one key | 2 |
| [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/) | Microsoft's unified AI platform (rebranded from Azure AI Foundry) | Enterprise route to frontier models with quotas, content filters, private networking; first-choice cloud | 2, 7 |
| [Amazon Bedrock](https://aws.amazon.com/bedrock/) | AWS managed model access | Claude and other models with AWS governance; Knowledge Bases, Guardrails | 2, 7 |
| [Vertex AI](https://cloud.google.com/vertex-ai) | GCP's AI platform | Aware: same concepts, third ecosystem | 7 |

## Structured outputs, RAG & agents

| Tool | What it is | Why it's in the roadmap | Phases |
| ---- | ---- | ---- | ---- |
| [Instructor](https://python.useinstructor.com) | Structured-output library | Pydantic-validated LLM outputs with retries — adopted after hand-rolling the same loop | 3 |
| [pgvector](https://github.com/pgvector/pgvector) | Vector extension for Postgres | Vectors + metadata + BM25 in one boring, correct database | 4+ |
| [sentence-transformers](https://sbert.net) | Open-source embeddings & rerankers | Local embedding and cross-encoder reranking without API costs | 4 |
| [Cohere Rerank](https://docs.cohere.com/docs/rerank-overview) | Hosted reranker | The biggest retrieval-quality jump per line of code | 4 |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | Agent orchestration framework | Primary framework: durable state, human-in-the-loop, streaming | 5 |
| [MCP](https://modelcontextprotocol.io) | Model Context Protocol | The open standard for exposing tools to AI apps; you build a server | 5, 8 |
| [Pydantic AI](https://ai.pydantic.dev) | Type-safe agent framework | Aware: the lighter-weight alternative worth watching | 5 |
| [Claude Agent SDK](https://docs.anthropic.com/en/api/agent-sdk/overview) | Agent harness SDK | Aware: the production harness behind Claude Code | 5 |

## Evals, observability & production

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

This table is the stack: adding a dependency outside it needs a reason and a note of what it replaces (see [AGENTS.md](AGENTS.md)).

[← Back to the README](README.md)
