# Phase 5 — Agents & Agentic Workflows

**Goal:** Build agents three ways — a raw loop, a framework (LangGraph), and an MCP server — and develop judgment about when agency is warranted at all.
**You build:** All three, sharing one set of tools.
**Effort:** ~25–40 hours.

## Why this phase exists

Agents are where the industry's energy (and hiring) is concentrated, and also where the most money is wasted on overengineering. The core insight, per Anthropic's *Building Effective Agents*: most "agent" problems are actually **workflows** — fixed LLM steps composed in code — and true agents (model-directed loops) are for problems where you *can't* predict the path. Engineers who know the difference ship reliable systems; everyone else ships demos that work twice.

You already own the two hard prerequisites: tool calling by hand (Phase 3) and retrieval as a tool (Phase 4).

## Core skills

### Patterns before frameworks

- The workflow patterns, in code, from *Building Effective Agents*: prompt chaining, routing, parallelization, orchestrator–workers, evaluator–optimizer. These cover ~80% of production "agent" use cases.
- The agent loop, precisely: `while not done: model → tool calls → execute → append results`. Termination conditions, max-iteration guards, budget caps.
- **Context engineering** — the discipline's actual name for its hardest problem: what goes in the window each turn (tool results, compacted history, retrieved memory), what gets summarized, what gets dropped. Agents die by context bloat.
- Tool design as API design: small orthogonal toolsets beat sprawling ones; error messages written *for the model* ("file not found; did you mean X?") measurably change agent behavior.
- Failure containment: sandboxing code execution (Docker), allowlists for shell/file tools, spend ceilings, and **human-in-the-loop gates** for irreversible actions.
- Multi-agent honestly: orchestrator–workers for parallelizable research-shaped work; skepticism for "crews" of role-played personas. Subagents are mostly a *context isolation* mechanism — that framing predicts when they help.
- Memory beyond the session: persisting facts/preferences to storage and retrieving them into context (file-based or DB-backed; the Phase 4 skills apply directly).

### Frameworks

- **Primary: [LangGraph](https://langchain-ai.github.io/langgraph/).** Graph-based orchestration with the strongest production adoption; gives you durable state/checkpointing, streaming, human-in-the-loop interrupts, and time-travel debugging. Learn it *after* the raw loop so you know what it's doing for you.
- **Know:** [Pydantic AI](https://ai.pydantic.dev) (type-safe, lighter-weight, excellent taste), OpenAI Agents SDK, [Claude Agent SDK](https://docs.anthropic.com/en/api/agent-sdk/overview) (the harness behind Claude Code, reusable for your own agents). Reading their design docs is a masterclass in the tradeoff space.
- Framework judgment: for a fixed 3-step pipeline, plain Python functions beat any framework. Reach for LangGraph when you need durable state, interrupts, or genuinely dynamic control flow.

### MCP (Model Context Protocol)

- What it is: the open standard (now industry-wide) for exposing tools, resources, and prompts to any AI application — write a server once, and Claude Code, Claude Desktop, and other hosts can all use it.
- Build servers with the Python SDK (`FastMCP`-style decorators); understand tools vs resources vs prompts, stdio vs HTTP transports.
- Security model: an MCP server executes with *your* permissions against input from a model reading untrusted data — the Phase 3 injection lens, now with real stakes.

## Hands-on project: one agent, three ways

Pick a use case with real tools and verifiable outcomes. Recommended: a **research agent** over your `docs-chat` corpus plus live web search — tools: `search_docs` (Phase 4), `fetch_url`, `run_python` (sandboxed), `save_note`.

**Part A — raw loop (no framework).** The agent loop over the bare API: multi-step tool use until done, max-iteration + budget guards, full conversation trace printed so you can watch it think. Then break it on purpose — vague tool descriptions, a tool that errors cryptically — and watch behavior degrade. This is the understanding everything else rents.

**Part B — LangGraph rebuild.** Same tools, now with: checkpointed state (resumable mid-run), streamed progress, and a human-approval interrupt before any `save_note`/write action. Add one workflow pattern around it (e.g., orchestrator that fans out to parallel research workers and synthesizes).

**Part C — MCP server.** Wrap `search_docs` (and one more tool) as an MCP server. Register it with Claude Code or Claude Desktop and use it in a real session. Ship it with a README; this is a genuinely useful portfolio artifact.

**Stretch:** give the Part B agent persistent memory across sessions (facts it learned → pgvector → retrieved into future runs).

## Resources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — the field's reference essay; read twice, once now and once after Part A
- [LangChain Academy: Introduction to LangGraph](https://academy.langchain.com) — free, hands-on, current
- [MCP docs](https://modelcontextprotocol.io) — spec overview + Python SDK quickstart; the HF MCP course is a good guided alternative
- [Hugging Face Agents Course](https://huggingface.co/learn/agents-course) — free; useful breadth across frameworks
- Anthropic engineering blog posts on multi-agent systems and context engineering for agents — pattern-dense, practitioner-written
- [Claude Agent SDK docs](https://docs.anthropic.com/en/api/agent-sdk/overview) — even just the architecture pages sharpen your own designs

## Exit criteria

- [ ] I can write the agent loop from a blank file — tools, execution, termination, budget guard — in under an hour
- [ ] Given a problem, I can say "workflow" or "agent," name the pattern, and justify it in two sentences
- [ ] My LangGraph build has working checkpointing and a human-in-the-loop gate I can demo
- [ ] My MCP server runs inside a real host app, and I can explain its security model
- [ ] I can explain context engineering — what enters the window each turn and why — for my own agent, concretely
