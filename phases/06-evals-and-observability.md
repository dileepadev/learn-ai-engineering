# Phase 6 — Evaluation, Testing & Observability

**Goal:** Make quality measurable and regressions catchable: golden sets, LLM-as-judge, tracing, and evals wired into CI.
**You build:** A 50+ case eval suite and full tracing for your Phase 4–5 apps, with a regression gate in CI.
**Effort:** ~25–35 hours.

## Why this phase exists

This is the highest-leverage phase in the roadmap. LLM outputs are non-deterministic and failure is silent — no stack trace fires when an answer is subtly wrong. Teams without evals iterate by vibes, fear every prompt change, and plateau; teams with evals change models in an afternoon with confidence. Industry consensus (Hamel Husain, Eugene Yan, every serious AI team's postmortems) is unanimous: **systematic evaluation is the differentiating skill of AI engineering.** You've been seeding this since Phase 3's golden set; now it becomes a system.

## Core skills

### Error analysis — the part everyone skips

- **Look at your data.** Before any tooling: pull 30–50 real traces, read every one, and label failures in a spreadsheet. Let failure *categories* emerge (bad retrieval, wrong tone, hallucinated fields, tool misuse) rather than imposing generic metric names on day one.
- Metrics follow failure modes, not vice versa: you build a "citation accuracy" eval *because* you found citation failures, not because a framework offers the metric.
- This loop — read traces, categorize, build targeted evals, fix, repeat — is the actual methodology. Tools just automate it.

### Building evals

- The hierarchy, cheapest first: **code assertions** (parses, schema-valid, contains/excludes X, citation IDs exist) → **LLM-as-judge** for qualities code can't check (faithfulness, helpfulness, tone) → **human review** for calibrating the judges.
- Golden datasets: harvest from real usage + hand-label; version them in git; grow them from every production failure ("regression tests, but for behavior").
- LLM-as-judge, done properly: binary or few-level judgments (not 1–10 scores), a rubric with examples, a strong model as judge, and — non-negotiable — **validate the judge against human labels** before trusting it. Know pairwise comparison for A/Bs and position-bias to control for.
- Agent evals: end-state checks (did the file/record end up correct?) and trajectory checks (right tools, sane order, no loops) — not just final-text similarity.
- Non-determinism management: run flaky cases N times, report pass rates, set thresholds rather than demanding 100%.

### Tooling

- **Primary: [promptfoo](https://www.promptfoo.dev)** for config-driven eval suites (assertions + model-graded, CLI + CI-friendly, red-team scanning), **[DeepEval](https://deepeval.com)** for pytest-native evals with prebuilt LLM/RAG metrics (faithfulness, answer/context relevancy, hallucination) — it slots into the pytest workflow you already have — and **[Langfuse](https://langfuse.com)** for tracing (open-source, self-hostable; traces, spans, costs, user feedback capture, datasets from production traces).
- **Know:** LangSmith (deep LangGraph integration), Braintrust, Arize Phoenix, and Ragas (a RAG-metrics library that overlaps DeepEval). The honest industry picture: **there is no standard eval *library*** — the standard is the *methodology* (golden sets, validated judges, tracing, CI gates), which most companies implement as custom code on top of an observability platform (LangSmith, Braintrust, Langfuse). Prebuilt metrics from DeepEval/Ragas are scaffolding, not the destination: use them to start, replace them with judges tuned to *your* failure taxonomy as it emerges. Learn the concepts and any tool becomes a two-day migration.
- OpenTelemetry GenAI semantic conventions — tracing standards exist and the ecosystem is converging on them; know they're there so instrumentation isn't vendor-locked.

### Observability & guardrails

- Instrument everything: every LLM call gets a trace with prompt version, model, tokens, cost, latency; multi-step pipelines get nested spans (retrieval span, rerank span, generation span).
- Production feedback loops: thumbs up/down capture → trace review queue → new golden cases. The flywheel that makes systems improve after launch.
- Guardrails at the edges: input screening (injection patterns, off-topic), output screening (PII, schema, unsupported-claims), and the honest tradeoff — every guardrail adds latency and false positives.
- Red-teaming basics: systematically attack your own app (injection, jailbreaks, data exfiltration via tool calls) before users do; promptfoo automates a first pass.

## Hands-on project: instrument and gate everything

Retrofit `docs-chat` (Phase 4) and the research agent (Phase 5):

1. **Tracing:** Langfuse (self-hosted via compose, or free cloud tier) on every pipeline stage — retrieval, rerank, generation, each agent turn — with costs and latencies visible per request.
2. **Error analysis:** run 40+ realistic queries, read every trace, produce a written taxonomy of your top 5 failure modes with frequency counts. (This document will humble you. Good.)
3. **Eval suite:** 50+ cases targeting those failure modes — code assertions where possible, LLM-as-judge (with written rubrics) where not, including your Phase 4 retrieval metrics and at least one agent trajectory eval. Implement with promptfoo and/or DeepEval, whichever fits each case — mixing them is normal; start RAG cases from DeepEval's prebuilt metrics, then replace any metric that disagrees with your own judgment of the traces.
4. **Judge validation:** hand-label 20 outputs, measure judge–human agreement, tune the rubric until it's ≥80–90%.
5. **CI gate:** GitHub Actions runs the suite on every PR touching prompts or pipeline code, failing below threshold. Prove it works: introduce a plausible regression (swap to a cheaper model, "simplify" a prompt) and watch CI catch it.
6. **Red-team pass:** promptfoo's scanner plus 10 hand-written adversarial cases; fix what falls over, add the cases to the suite.

**Stretch:** add a feedback endpoint to `docs-chat` (👍/👎 + comment) that writes into Langfuse, and build a one-click "failed trace → new eval case" path.

## Resources

- Hamel Husain: ["Your AI Product Needs Evals"](https://hamel.dev/blog/posts/evals/) and the error-analysis follow-ups — the methodology backbone of this phase
- [applied-llms.org](https://applied-llms.org) — evaluation & monitoring sections
- [promptfoo docs](https://www.promptfoo.dev/docs/intro/) — getting started, assertions, model-graded, CI, red team
- [DeepEval docs](https://deepeval.com/docs) — metrics reference and the pytest integration
- [Langfuse docs](https://langfuse.com/docs) — tracing concepts, datasets, LLM-as-judge features
- Anthropic docs on defining success criteria and building evals — concise and vendor-neutral in substance
- Chip Huyen, *AI Engineering*, evaluation chapters — the best long-form treatment of judge validation

## Exit criteria

- [ ] I have read 40+ raw traces of my own system and produced a written failure taxonomy from them
- [ ] My eval suite has 50+ cases mixing assertions and validated LLM-judges, runnable with one command
- [ ] I measured judge–human agreement and improved a rubric based on it
- [ ] CI blocks a real regression — I proved it by introducing one
- [ ] Every LLM call in my apps produces a trace with cost, latency, and prompt version, and I check them habitually
- [ ] I can explain to a skeptical PM why eval infrastructure ships *before* feature N+1, with examples from my own failure taxonomy
