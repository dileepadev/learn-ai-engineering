# Phase 2 — LLMs & Model APIs

**Goal:** A working engineer's mental model of LLMs, and real fluency with the APIs — hosted frontier models and local open-weight models — including streaming, failure handling, and cost.
**You build:** A terminal chat client from scratch, no frameworks, speaking to both a hosted model and a local one.
**Effort:** ~15–25 hours.

## Why this phase exists

Everything downstream — prompting, RAG, agents — is shaped by a few mechanical facts: models see tokens (not characters), context windows are finite and cost money, output is sampled (not deterministic), and latency scales with output length. Engineers who internalize these facts design better systems; engineers who don't fight mysterious bugs. You need the mental model at the "explain it in an interview and use it in a design doc" level — not the "derive attention" level.

## Core skills

### The mental model (just enough theory)

- Tokens and tokenization: why "how many r's in strawberry" is hard, why token counts drive cost, how to count tokens for your provider.
- Context window: what fits, what happens when it doesn't, why long context isn't free (cost + attention degradation, "lost in the middle").
- Sampling: temperature and top_p, why outputs vary, when to pin temperature to 0 (extraction) vs not (creative tasks).
- Why time-to-first-token and tokens-per-second are the two latency numbers that matter, and why output tokens dominate cost and latency.
- Prompt caching: how providers discount repeated prefixes and why that dictates *stable prefix, variable suffix* prompt layout.
- What fine-tuning, RLHF, and "reasoning models" are — one paragraph each, so the vocabulary doesn't intimidate you. (When to actually fine-tune is Phase 7's problem.)

### Provider APIs

- **Learn deeply — Anthropic Messages API:** messages format, system prompts, streaming events, tool use (previewed here, deep-dive in Phase 3), vision/PDF input, prompt caching, token counting, the Batches API for 50%-off async workloads.
- **Know well — OpenAI API:** the de facto compatibility standard; most tools and gateways speak "OpenAI-shaped" requests. Understand the shape even if you default to Claude.
- **Know it exists — Google Gemini,** plus OpenAI-compatible aggregators like **OpenRouter** for accessing many models behind one key.
- **Enterprise routes — [Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/) (formerly Azure AI Foundry, renamed January 2026) and [Amazon Bedrock](https://aws.amazon.com/bedrock/):** the same frontier models (Claude is on both) consumed through a cloud platform for governance reasons — quotas, content filtering, private networking, unified billing, compliance. The API concepts are identical to what you're learning here; you'll work with these hands-on in Phase 7.
- Model tiers: every provider has a frontier tier, a fast/cheap tier, and something between (e.g., Claude Opus / Sonnet / Haiku). Choosing tier per task is a core cost lever.
- Production client behavior: timeouts, retries with exponential backoff and jitter, respecting 429/`Retry-After`, idempotent request design, never logging API keys.

### Open-weight models

- Run models locally with **Ollama** (or LM Studio): pull a small instruct model from the current Llama/Qwen/DeepSeek generation and talk to it over its OpenAI-compatible endpoint.
- Understand quantization at the practical level: a "7B Q4" model fits on a laptop; quality degrades gracefully with quantization level.
- The real decision framework: hosted APIs win on quality-per-effort; open weights win on privacy, unit economics at scale, latency control, and fine-tunability. (Serious self-hosted serving with vLLM comes in Phase 7.)

## Hands-on project: `termchat`

A polished terminal chat client, built directly on `httpx` — **no SDK wrappers for the core loop** (use the provider SDK only to cross-check your raw implementation).

Spec:

1. Streaming responses rendered token-by-token; conversation history maintained across turns.
2. Config file for system prompt, model, temperature; `/model` command switches between at least one hosted model and one local Ollama model mid-conversation.
3. Live cost meter: track input/output tokens per turn and cumulative session cost from a pricing table you maintain.
4. Robust failure handling: retries with backoff on 429/5xx, clean timeout behavior, a `--budget` flag that halts the session past a spend cap.
5. `/image` command that sends an image to a vision-capable model.
6. Context management: when history approaches the context limit, summarize older turns and carry the summary forward — your first taste of context engineering.

**Stretch:** add a `--batch` mode that runs a file of prompts through the Batches API and compares cost against synchronous calls.

## Resources

- [Anthropic docs](https://docs.anthropic.com) — Messages API, streaming, vision, prompt caching, batches
- [anthropics/courses](https://github.com/anthropics/courses) — free, hands-on, notebook-based API fundamentals
- [OpenAI Cookbook](https://cookbook.openai.com) — skim for API patterns; many recipes generalize across providers
- Andrej Karpathy, ["Intro to Large Language Models"](https://www.youtube.com/watch?v=zjkBMFhNj_g) and "Deep Dive into LLMs like ChatGPT" — the best intuition-without-homework explainers; optional but excellent
- [Ollama docs](https://docs.ollama.com) — quickstart plus the OpenAI-compatibility page
- Tokenizer playgrounds (any provider's) — spend 15 minutes breaking your intuitions about what a "word" is

## Exit criteria

- [ ] I can explain tokens, context windows, temperature, and prompt caching to a junior engineer, unaided
- [ ] I can estimate the monthly cost of "N requests/day averaging X input / Y output tokens on model Z" in my head to the right order of magnitude
- [ ] `termchat` is complete: streaming, model switching (hosted + local), cost meter, retries, and context summarization all work
- [ ] I have parsed a provider's raw SSE stream myself and know what the event types are
- [ ] I can articulate when I'd reach for an open-weight model over a hosted API, with real reasons
