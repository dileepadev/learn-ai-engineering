# Phase 8 — Capstone: A Real AI Product, End to End

**Goal:** Prove the whole stack by shipping one complete product: designed, built, evaluated, deployed, observable, documented — the artifact that anchors your portfolio and your next interview.
**Effort:** 40+ hours. Scope it like a product, cut like an engineer.

## What qualifies as a capstone

Not a demo. The bar, drawn from every prior phase:

- **Real users possible:** deployed at a URL, authenticated, safe to show strangers. Any Phase 7 target works; Azure Container Apps makes the capstone double as cloud-platform evidence for enterprise roles.
- **Real data:** ingests and stays current with a live source — not a frozen sample folder.
- **AI where it earns its place:** at least one workflow/agent, at least one retrieval surface, structured outputs where code consumes model output.
- **Measured:** an eval suite with a written baseline, wired into CI; you can answer "how good is it?" with a number and "did this change help?" with a diff.
- **Operated:** tracing, cost/latency dashboard, budget alarm, runbook.
- **Documented:** a README that explains the architecture with a diagram, the eval results honestly (including failures), and a 3-minute demo path. Write it like the audience is a hiring manager, because it is.

## Recommended project: AI-native bookmark manager

You have a `bookmark-manager` project — turn it into the capstone. It's genuinely well-shaped for one: personal data with real volume, obvious retrieval value, natural agent jobs, and you'll actually use it, which means you'll actually find the failures.

**Core loop:**

1. **Capture:** save a URL via API/extension/CLI; a background worker (Phase 7 queue) fetches and parses the page.
2. **Enrichment agent:** summarizes, auto-tags against your evolving tag taxonomy, extracts key entities — structured outputs into Postgres (Phase 3 skills, for real stakes).
3. **Semantic search:** hybrid search + reranking over everything you've saved (Phase 4, on live data that grows).
4. **Chat with your library:** "what was that article about pgvector performance?" — grounded, cited, streamed (Phase 4/7).
5. **MCP server:** expose `search_bookmarks` / `save_bookmark` so Claude and other agents can use your library as a tool (Phase 5). This is the feature that makes it *AI-native* rather than "app with AI features."
6. **Evals + ops:** tagging-accuracy golden set, retrieval recall set, judge-graded answer faithfulness; CI gate; dashboards; budget alarm (Phases 6–7).

**Stretch ideas (pick at most two):** a weekly "what you saved" digest agent; dead-link sweeper with archive.org fallback; near-duplicate detection via embeddings on save; a "reading queue" agent that prioritizes by your stated goals.

## Alternatives (same bar, different shape)

- **Support copilot:** ingest a real product's docs + changelog; answer with citations; escalation workflow with human-in-the-loop gate; eval on a golden set harvested from real questions.
- **Personal ops agent:** email/calendar triage with approval gates on every outbound action — heavier on agent safety, lighter on RAG.
- **Codebase Q&A service:** docs-chat pointed at a large OSS repo with code-aware chunking — heavier on retrieval engineering.

## Suggested arc

1. **Week one energy — spec first:** one page: users, core loop, the 3 AI behaviors that matter, explicit non-goals, and the eval plan *written before the features*. (Phase 6 habit, now product-level.)
2. **Walking skeleton:** thinnest end-to-end slice deployed early — capture → store → search → answer, ugly but live. Everything after is iteration on a running system, never a big-bang integration.
3. **Build in eval-guarded loops:** feature → traces → error analysis → eval cases → fix → next. You know this rhythm; the capstone is proving you can sustain it.
4. **Harden:** red-team pass, load test, cost review, runbook.
5. **Present:** README + architecture diagram + honest eval table + demo video/GIF. Then show it to people and watch it break — every failure is a new eval case, which is the whole methodology in one sentence.

## Done means

- [ ] Live at a URL I'd put in a job application
- [ ] The spec's three AI behaviors work, with eval numbers I can quote
- [ ] CI runs evals; I've rejected at least one of my own changes because of them
- [ ] Dashboard + budget alarm + runbook exist; a week of my own real usage has produced trace-driven fixes
- [ ] MCP surface works from a real host app
- [ ] README tells the story: architecture, decisions, eval results, known limitations — honestly

## After the capstone

You're not "done learning" — you've built the machine that makes learning cheap: any new model, framework, or technique now gets evaluated against *your* stack, *your* evals, *your* cost dashboard in an afternoon. That loop — not any single framework — is what makes a strong AI engineer. Keep a weekly hour for staying current (Simon Willison's blog, the Latent Space newsletter, and the Anthropic/OpenAI engineering blogs cover it), keep harvesting failures into evals, and ship the next thing.
