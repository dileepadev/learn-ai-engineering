# Phase 3 — Prompt Engineering & Structured Outputs

**Goal:** Treat prompts as engineered artifacts — versioned, tested, measurable — and make LLMs produce output your code can actually consume: validated JSON and tool calls.
**You build:** A document-extraction pipeline with a measured accuracy number.
**Effort:** ~15–25 hours.

## Why this phase exists

Structured output is the hinge between "chatbot" and "software component." The moment a model returns JSON your code parses, you've turned it into a callable function — and everything in phases 4–8 (RAG, agents, evals) is built out of exactly that move. Prompting, meanwhile, is unglamorous but has the highest ROI-per-hour of any skill in this roadmap; most production "model problems" are prompt problems.

## Core skills

### Prompt engineering (the durable parts)

- System prompt design: role, constraints, output contract, refusal behavior. Long, explicit system prompts are normal — read a few production ones (they leak regularly; Claude's is published).
- Few-shot examples: when 3 good examples beat 300 words of instructions; how example ordering and format leak into outputs.
- Chain-of-thought and "think step by step": when reasoning-before-answering helps (math, multi-constraint tasks) and when it's wasted tokens. Know that reasoning-tier models internalize much of this.
- Task decomposition: one prompt doing five things poorly → five small prompts doing one thing well, chained in code.
- Prompt layout for caching: static instructions and examples first, variable input last (this is why — see Phase 2's caching notes).
- Prompt hygiene: prompts live in version control as templates (Jinja or f-strings), never inline string soup; every change is diffable.
- Prompt injection: understand the attack class now — untrusted input mixed with instructions — because it shapes tool design in Phase 5 and guardrails in Phase 6.

### Structured outputs

- Native structured-output modes: passing a JSON Schema and getting schema-conformant output (all major providers support this; know your provider's flavor).
- The Pydantic pipeline: define a `BaseModel` → `model_json_schema()` → API call → `model_validate_json()` → typed object. Build this by hand before touching any library.
- The validation-retry loop: when output fails validation, feed the error back and retry once or twice. Cheap and shockingly effective.
- **[Instructor](https://python.useinstructor.com)** — the library version of everything above; adopt it after you've hand-rolled it once.
- Schema design *is* prompt engineering: field names and descriptions steer the model; enums beat free text; `Optional` with "null if absent" beats hallucinated values.

### Tool / function calling — by hand

- The full loop, raw: send tool schemas → model returns a tool-use request → your code executes it → return the result → model continues. Do this over the bare API, no framework.
- Writing good tool definitions: docstring-quality descriptions, tight parameter schemas, predictable error returns. (This exact skill is 60% of agent quality in Phase 5.)

## Hands-on project: `extractor`

A pipeline that turns messy real-world documents into validated, typed data — with an accuracy number attached.

Spec:

1. Pick a messy domain: receipts, job postings, event emails, or résumés. Collect 30+ real examples.
2. Define target Pydantic schemas with tight types (dates as `date`, money as `Decimal` + currency enum, categoricals as `Literal`/`Enum`).
3. Extraction pipeline: prompt template + structured output + validation-retry loop, processed concurrently with your Phase 1 asyncio patterns.
4. **Hand-label 20 documents as a golden set.** Score extraction accuracy per field. Iterate on the prompt/schema and watch the number move. *This is your first eval, and the habit that separates engineers from prompt-tinkerers.*
5. Compare a frontier-tier vs a cheap-tier model on cost and accuracy; write down the tradeoff you'd ship.
6. Add one tool: a currency-conversion or date-normalization function the model can call mid-extraction, implemented as a raw tool-use loop.

**Stretch:** malicious-input test — plant "ignore previous instructions" text inside a document and verify your pipeline extracts it as *data* rather than obeying it.

## Resources

- [Anthropic prompt engineering guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — the interactive tutorial in [anthropics/courses](https://github.com/anthropics/courses) is the hands-on version
- [Prompting Guide](https://www.promptingguide.ai) — broad reference; take the technique zoo with salt, the fundamentals are solid
- [Instructor docs](https://python.useinstructor.com) — including the "why" essays on validation-as-retry
- Your provider's structured-output and tool-use docs — read every page, they're short
- Published production system prompts (e.g., Anthropic releases Claude's) — reverse-engineer the patterns

## Exit criteria

- [ ] My prompts live in version control as templates with a changelog, not as inline strings
- [ ] I can take any extraction task and produce a Pydantic-validated pipeline with a retry loop, without a framework
- [ ] I have implemented a raw tool-calling loop over the bare API and can diagram the message flow from memory
- [ ] `extractor` reports per-field accuracy against a golden set, and I improved that number at least twice through deliberate iteration
- [ ] I can explain prompt injection with a concrete example and one mitigation
