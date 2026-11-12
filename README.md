# Learn AI Engineering

A self-paced, build-first roadmap for **modern AI engineering** — the discipline as it's actually practiced in industry today: LLM applications, agents, RAG, structured outputs, evals, and production deployment.

This is **not** a machine learning or data science curriculum. There is no calculus, no training-from-scratch, no Kaggle. The premise: modern AI engineering is a *software engineering* discipline that treats models as components you build products around.

> [!NOTE]
> This roadmap was created based on my own research, then optimized and enhanced with Claude Fable 5.
<!--  -->
> [!IMPORTANT]
> **This is the 2026 edition**, released as a preview ([`v1.0.0-beta.1`](https://github.com/dileepadev/learn-ai-engineering/releases/tag/v1.0.0-beta.1)): the fast, hands-on pass over the roadmap. The 2027 edition, the complete in-depth curriculum, will be the first stable release, `v1.0.0`. See the [CHANGELOG](CHANGELOG.md).

## Work through it interactively

**[dileepadev.github.io/learn-ai-engineering →](https://dileepadev.github.io/learn-ai-engineering/)**

The roadmap is also a learning app:

- **Every part is trackable.** Every skill, project step, and resource is a checkbox; Part A topics you already know can be tested out.
- **Real drills in your browser.** Phase 1's pytest suites run against your code via WebAssembly.
- **Easy to navigate.** Course sidebar, "On this page" contents, Ctrl/⌘K search, and `←`/`→` between lessons.
- **Progress you can see.** The **Progress** button shows every phase at a glance; a sprint planner turns what is left into hours a week.

No setup, no API keys, no account. Everything is generated from `phases/`, so the site and the docs cannot drift apart. Source in [site/](site/).

## Operating principles

1. **Build first, read second.** Every phase is anchored to a project. Reading without shipping doesn't count as progress.
2. **Raw APIs before frameworks.** Build the agent loop, the RAG pipeline, and structured-output parsing directly against raw APIs once. Then adopt frameworks knowing exactly what they abstract.
3. **One primary tool per category.** Depth in one vector DB, one agent framework, one eval tool beats surface familiarity with five. "Also know about" lists exist so you can navigate job descriptions and migrations, not so you learn them all.
4. **Evals are the core skill.** The difference between a demo and a product is a test suite that tells you when you made things worse. This gets its own phase and shows up early in small ways.
5. **Exit by competence, not calendar.** Each phase ends with exit criteria. Move on when you can do the things — whether that took a week or a month.
6. **AI assistants as teachers, not just typists.** Let Claude Code and friends write the code, core learning targets included. The bar is comprehension, not authorship: walk through every generated piece until you can explain, modify, and debug it unaided. [AGENTS.md](AGENTS.md) encodes that rule.

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

## What the 2026 market asks for

The phases are weighted the way 2026 job postings are. [The role](phases/the-role.md) has the full research (the job, pay, and interview loops), with every figure linked to its source.

| Skill | Share of 2026 AI Engineer postings | Taught in |
| ----- | ----- | ----- |
| Python | 59–82.5% across three studies | Phase 1 |
| LLMs / LLM integration | 63% / 25.4% | Phases 2–3 |
| Evals | 56% | Phase 6, seeded from Phase 3 |
| Agents | 14.4–50% | Phase 5 |
| RAG | 26–35.9% | Phase 4 |
| AWS · Docker · CI/CD | 40.1% · 31.0% · 29.3% | Phases 1, 7 |
| Fine-tuning | 8.5–26% | Phase 7, deliberately brief |

## Rough effort

Phase 1 runs ~30–50 hours if Python is new (a fraction as a refresher), phases 2–3 ~15–25 each, phases 4–7 ~25–40 each, and the capstone 40+. At ~10 hours a week that is about six months. Test out only what you could do unaided today: skipping is not covering.

## Before you start

- **Keys & spend caps:** set a hard monthly limit on your Anthropic key *before* writing code; $10–20/month covers Phases 1–5. Keys live in environment variables, never in code or git.
- **Budget:** roughly $50–150 of API spend for the whole roadmap, plus ~$10–30 of rented GPU time in Phase 7.
- **Hardware:** an ordinary laptop. No GPU needed; Phase 7's vLLM leg rents one by the hour.
- **Installs:** uv, Docker, git, and an editor with pyright. Postgres arrives in Phase 4, in Docker.
- **Rhythm:** short, frequent sessions. Start each phase's project a third of the way through the reading, before it feels like you're "ready."

## The stack

One primary tool per category: uv, ruff, pyright, pytest, Pydantic, FastAPI, httpx, and Docker; the Anthropic API; pgvector; LangGraph and MCP; promptfoo, DeepEval, and Langfuse; LiteLLM and vLLM. [STACK.md](STACK.md) lists every tool, what it is, why it earned its slot, and the phases that use it.

## Project code

Phase projects live under `projects/` as [uv workspace](https://docs.astral.sh/uv/concepts/projects/workspaces/) members: one lockfile, one environment, one set of standards.

```text
projects/
  01-wrangle/        # Phase 1 — typed data-cleaning CLI
  01-mockstream/     # Phase 1 — streaming SSE service
  02-chat-client/    # Phase 2 — terminal chat client
  ...                # one directory per phase project
```

## Working on this repo

- **AI agents:** [AGENTS.md](AGENTS.md) is the single source of truth for context, standards, and the "explain what you generate" rule. [CLAUDE.md](CLAUDE.md), [Copilot](.github/copilot-instructions.md), and [Cursor](.cursor/rules/) configs point to it. `.mcp.json` adds [Context7](https://github.com/upstash/context7) for current library docs.
- **The site:** [deploy-site.yml](.github/workflows/deploy-site.yml) tests, builds, and deploys [site/](site/) to GitHub Pages on every push to `main` that touches `phases/` or `site/`.
- **Releases:** see [VERSIONING.md](VERSIONING.md) and [CHANGELOG.md](CHANGELOG.md).
