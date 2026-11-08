# Phase 2 — Generative AI & LLM Engineering

**Goal:** Select and integrate appropriate models while controlling their inputs, outputs, context, and cost — and build robust LLM-powered APIs and application services on top of them.
**You build:** A provider-agnostic LLM service with typed tool contracts, validated structured outputs, streaming, failover, and cost per successful task — plus the quality–latency–cost benchmark that picks its default model.
**Effort:** ~45–65 hours (month 3).

## Why this phase exists

Calling a model is one line. Building on one is the job: choosing the right model for the task and proving it with a benchmark instead of a leaderboard, controlling what goes into the context window, forcing typed outputs out of a probabilistic system, and surviving rate limits, outages, and model deprecations without users noticing. Everything later — retrieval, agents, evaluation — sits on this layer, so it has to be boring and solid.

Start with direct model APIs, not frameworks: build the request, the stream, the tool-calling loop, and the validation-retry loop by hand once, and every framework afterwards is something you can read rather than something you have to trust. The model-serving and multimodal **[SPECIALIST]** items are vocabulary here; go deep only if your specialization needs them.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## 3. Foundation Models & Context Engineering

### LLM Fundamentals

- GPT, Claude, Gemini, open-weight models
- Tokens, context windows, tokenization
- Inference, sampling, temperature, top-p
- Model capabilities, limitations, benchmarks
- Reasoning models vs general-purpose models
- **[MUST]** Model version changes/deprecation, documented limits, provider SLAs, data handling and model-license checks
- **[IMPORTANT]** Compare smaller/domain models vs frontier models using a consistent task-specific quality–latency–cost benchmark

### Model Engineering

- Model APIs, hosted vs self-hosted models
- Model selection and benchmarking
- Quantization, batching, inference optimization
- Fine-tuning, supervised fine-tuning
- LoRA, PEFT, adapters
- Model serving: vLLM and related runtimes
- **[IMPORTANT]** Prompt/context caching, batching policies, inference performance profiling and throughput-per-dollar
- **[SPECIALIST]** Prefill/decode separation, KV-cache management, continuous batching, speculative decoding, paged attention
- **[SPECIALIST]** Parallel inference (tensor/pipeline), quantization quality trade-offs, GPU capacity planning
- **[SPECIALIST]** Preference optimization (e.g., DPO), distillation and reinforcement-learning-based post-training when the role owns model adaptation

### Multimodal AI

- Vision-language models
- Image understanding, document understanding
- Speech-to-text, text-to-speech, audio
- Multimodal inputs, outputs, retrieval
- **[IMPORTANT]** Document-layout understanding, tables/forms/charts, visual grounding and OCR-error evaluation
- **[SPECIALIST]** Real-time voice agents: VAD, interruptions/barge-in, turn-taking, WebRTC, audio latency and safety
- **[SPECIALIST]** Video frame/time indexing, timestamp-grounded retrieval and multimodal synchronization

### Prompt & Context Engineering

- Prompt engineering, system instructions
- Few-shot examples, task specifications
- Structured prompts and structured context
- Dynamic context construction
- Context selection and compression
- Long-context strategies
- Conversation history and memory management
- Grounding and context quality
- **[MUST]** Context budget allocation across system instructions, retrieval, history and tool outputs
- **[IMPORTANT]** Context poisoning detection, provenance labeling and explicit trust boundaries
- **[IMPORTANT]** Prompt/context versioning and replayable experiments; automated context ablation studies

**Outcome:** Select and integrate appropriate models while controlling their inputs, outputs, context, and cost.

## 4. LLM Application Engineering

### Model Integration

- OpenAI, Anthropic, Google model APIs
- SDK usage and provider abstraction
- Structured outputs, Pydantic, JSON Schema
- Function calling and tool calling
- Streaming responses
- Async and concurrent execution
- **[MUST]** Typed tool contracts, schema validation, invalid-output repair and refusal/abstention patterns
- **[IMPORTANT]** JSON streaming/partial parsing, reconnect/resume UX and graceful cancellation
- Schema design is prompt engineering: field names and descriptions steer the model, enums beat free text, and an optional field that is null when absent beats a hallucinated value

### Reliability & Performance

- Timeouts, retries, exponential backoff
- Fallback models and provider failover
- Rate limiting and concurrency limits
- Semantic caching and response caching
- Model routing and LLM gateways
- Token accounting and cost optimization
- Latency optimization and error recovery
- **[MUST]** Cost per *successful task* (not just tokens), usage budgets, per-tenant quotas and request attribution
- **[MUST]** Provider/model release regression tests and shadow testing before model migrations
- **[IMPORTANT]** Prompt-prefix cache hit rate, token input/output ratios, routing policies and gateway audit logs

### Application Patterns

- Chat applications
- Document extraction and classification
- AI copilots and assistants
- AI-powered backend services
- Event-driven AI pipelines
- **[IMPORTANT]** End-user workflow design: user review, editable outputs, citations, feedback and escalation
- **[IMPORTANT]** Enterprise integrations with CRM, ticketing, collaboration and content systems using robust API permissions
- **[SPECIALIST]** Code assistants and repository agents: diff review, test sandboxes, branch/PR automation, rollback

**Outcome:** Build robust LLM-powered APIs and application services.

## Hands-on project: a provider-agnostic LLM service

Put real models behind the Phase 1 backend. The point is not a clever prompt; it is a service that keeps working, keeps its costs attributable, and can change models without a rewrite.

1. **Provider layer:** one typed interface over two hosted providers (raw HTTP for one, the official SDK for the other) and one local open-weight model — streaming, timeouts, retries with backoff on 429/5xx, and failover to the second provider when the first goes down.
2. **Structured outputs:** an extraction endpoint over a messy real-world document type, including at least one image or scanned PDF: Pydantic schema → JSON Schema → validated typed object, with an invalid-output repair loop and an explicit abstention path when the answer is not in the input.
3. **Tools:** one typed tool contract (a currency or date normalizer is enough) executed in a tool-calling loop you write by hand, with every argument validated before it runs.
4. **Context:** a context builder with an explicit token budget split across instructions, examples, history, and tool output; older history summarized when the budget runs out; prompts versioned in git, and every request logged with its prompt version so any run can be replayed.
5. **Benchmark:** hand-label 30+ examples as a golden set and compare a frontier model, a small model, and the local model on accuracy, p95 latency, and cost per *successful* extraction; pick the default and write down why.
6. **Cost controls:** token accounting per request and per tenant, a per-tenant budget that rejects requests past its quota, and the prompt-cache hit rate of a stable-prefix prompt layout.
7. **Migration drill:** before changing the default model, run the golden set against old and new as a regression test, then shadow a slice of traffic through the new model before cutting over.

**Stretch:** a semantic cache with a similarity threshold, measured for hit rate *and* false hits; or a JSON-streaming endpoint whose frontend renders partial structured output as it arrives.

## Exit criteria

- [ ] I can call two hosted providers and one local model through one typed interface, with streaming, retries, and a failover I have demonstrated
- [ ] I can get validated typed objects out of a model, repair invalid output, and make it abstain when the answer is not there
- [ ] I can explain tokens, sampling, context windows, and reasoning vs general-purpose models, and how each affects cost and latency
- [ ] I can allocate a context budget across instructions, retrieval, history, and tool outputs, and say what gets dropped first
- [ ] I picked my default model with a task-specific quality–latency–cost benchmark, not a leaderboard, and I can defend the pick
- [ ] I can state cost per successful task for my service, and per-tenant budgets reject over-quota requests
- [ ] I can migrate to a new model version behind a regression test and a shadow run
- [ ] I can explain fine-tuning, LoRA, quantization, and vLLM-style serving well enough to say when each is worth it
