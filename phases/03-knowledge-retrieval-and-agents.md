# Phase 3 — Knowledge, Retrieval & Agent Systems

**Goal:** Build accurate, source-grounded knowledge assistants with measurable retrieval quality, then stateful, tool-using agents and reliable multi-agent workflows with appropriate safety boundaries.
**You build:** Two portfolio projects — an evaluated, permission-aware RAG system and a governed workflow agent — each held against a simple baseline.
**Effort:** ~135–195 hours (months 4–6).

## Why this phase exists

Retrieval and agents are where most AI products live, and where most of them fail quietly. A RAG system that puts one tenant's document into another tenant's answer is a security incident, not a quality bug — so permissions are filtered *before* anything reaches the model. An agent that retries a payment is a production incident — so tools are idempotent, side effects are classified, and irreversible actions wait for a human.

This phase builds both, and holds each against a baseline: keyword search for the RAG system, a deterministic workflow for the agent. If the sophisticated version cannot beat the simple one on your own evaluation, ship the simple one. Build the agent loop over a raw model API once before adopting a framework, and a single agent before any multi-agent system.

> **Reading the tags:** untagged items are the core baseline. **[MUST]** essential production skill · **[IMPORTANT]** strong employability advantage · **[SPECIALIST]** deep skill for selected jobs · **[WATCH]** emerging, monitor rather than prioritize.

## 5. RAG & Knowledge Engineering

### Document Ingestion

- PDF, HTML, Markdown, Office documents
- Parsing, OCR, document structure
- Cleaning, deduplication, normalization
- Chunking and semantic chunking
- Metadata extraction, document versioning
- Ingestion pipelines and indexing
- **[MUST]** ACL/tenant metadata propagation from source to chunk to index; secure deletes and permission updates
- **[IMPORTANT]** CDC-based incremental refresh, late-arriving changes, backfills, replay and ingestion SLOs
- **[IMPORTANT]** Layout-aware extraction of tables/figures with page/section anchors for grounded citations

### Embeddings & Retrieval

- Embedding models and dimensionality
- Vector similarity, nearest-neighbor search
- Vector databases: pgvector, Qdrant, Pinecone, Weaviate
- Metadata filtering
- Dense retrieval, sparse retrieval, BM25
- Hybrid search and reranking
- **[MUST]** Permission-aware retrieval and filtering *before* model context construction
- **[IMPORTANT]** Lexical vs dense retrieval failure analysis, candidate diversity, filtering and reranking economics
- **[IMPORTANT]** Index quality dashboards: corpus coverage, staleness, recall at k and query distributions

### RAG Generation

- Retrieval pipelines
- Context construction and packing
- Grounding, citations, source attribution
- Answer generation and abstention
- Handling missing or conflicting evidence
- **[MUST]** Source-level permissions, citation validation, source freshness, data deletion/revocation tests
- **[IMPORTANT]** Evidence conflict-resolution and explicit support/uncertainty labels for high-stakes answers
- Long context vs retrieval: when putting a small, stable corpus straight into the context window beats RAG, and when corpus size, freshness, latency, or cost make retrieval the answer

### Advanced RAG

- Query rewriting and query expansion
- Multi-query retrieval
- Parent-child and hierarchical retrieval
- Contextual retrieval
- Graph RAG and knowledge graphs
- Multimodal RAG
- Corrective RAG, Self-RAG
- Agentic RAG
- Adaptive retrieval and iterative search
- **[IMPORTANT]** Search-and-browse pipelines: crawling constraints, source credibility, freshness and citation checking
- **[SPECIALIST]** Deep-research workflows with iterative query planning, provenance graphs and contradiction detection

### Semantic & Knowledge Modeling

- Entities, relationships, ontologies
- Entity linking, knowledge graphs
- Semantic search and information organization
- Knowledge freshness and data provenance

**Outcome:** Build accurate, source-grounded knowledge assistants with measurable retrieval quality.

## 6. AI Agents & Orchestration Engineering

### Agent Fundamentals

- Agent architecture and agent loops
- Reasoning, planning, reflection
- ReAct, task decomposition
- Tool use, action selection
- Termination conditions and execution budgets
- Workflow patterns before agents: prompt chaining, routing, parallelization, orchestrator–workers and evaluator–optimizer — fixed steps composed in code cover most production "agent" use cases

### Tools & Integrations

- HTTP APIs, databases, search
- Browser, files, code execution
- Custom Python tools
- Tool schemas, validation, permissions
- Tool error handling and recovery
- **[MUST]** Idempotent tools, side-effect classification (read/write), scoped credentials and human confirmation of irreversible actions
- **[IMPORTANT]** Browser/computer-use agent design: selectors vs screenshots, untrusted websites, auditability and safe session isolation
- **[IMPORTANT]** Enterprise SaaS integrations: OAuth consent, delegated identity, permission propagation and secrets rotation
- Tool design as API design: small, orthogonal toolsets, descriptions written for the model, and error messages that tell the model what to do next

### Memory Systems

- Short-term and working memory
- Long-term and episodic memory
- Semantic and user memory
- Persistence, retrieval, summarization
- Memory relevance, privacy, lifecycle

### Model Context Protocol (MCP)

- MCP architecture, client, server
- Tools, resources, prompts
- Transport and authentication
- Tool discovery and execution
- MCP security and access control
- **[MUST]** MCP tool identity, OAuth-based authorization, scoped resources, server verification and transport hardening
- **[IMPORTANT]** MCP lifecycle: tool discovery changes, contract testing, rate limits and approval policies
- **[WATCH]** Agent2Agent (A2A): discover/delegate across independent agents; understand interoperability and version compatibility rather than assuming adoption

### State & Workflow Orchestration

- Agent state management
- Persistence and checkpoints
- Sequential and parallel execution
- Conditional routing, loops
- Event-driven and durable workflows
- Human-in-the-loop approvals
- Interruption, resumption, recovery
- **[MUST]** Durable jobs, deduplication, replay safety, atomic state transitions and resumable human approvals
- **[IMPORTANT]** Temporal or equivalent durable workflow engine; explicit separation of deterministic workflow and autonomous decisions

### Multi-Agent Systems

- Supervisor and worker agents
- Planner and executor patterns
- Manager and specialist agents
- Agent-to-agent delegation
- Handoffs and context sharing
- Shared memory and collaboration
- Coordination, conflict resolution
- **[IMPORTANT]** Compare multi-agent execution against a single-agent and deterministic baseline; evaluate coordination overhead
- **[SPECIALIST]** Cross-service agent delegation, agent identities and distributed policy enforcement

### Agent Frameworks & SDKs

- LangChain and LangGraph
- OpenAI Agents SDK
- Claude Agent SDK
- Google Agent Development Kit (ADK)
- Pydantic AI
- Framework selection and trade-offs

### Loop & Harness Engineering

- Agent runtime design
- Agent execution loops and control flow
- Tool contracts, runtime state, checkpoints
- Sandboxed execution
- Context compaction and recovery
- Step limits, budgets and stop conditions
- Human intervention and resumability
- **[IMPORTANT]** Agent sandbox threat boundaries, safe code execution, per-step telemetry, task replay and trace-based debugging
- **[IMPORTANT]** Engineering agents: repository tools, test runners, code changes, diffs, merge requests and rollback controls

**Outcome:** Build stateful, tool-using agents and reliable multi-agent workflows with appropriate safety boundaries.

## Hands-on project 1: evaluated RAG system

Documents plus structured data, permission-aware hybrid search, citations, negative test cases, recall@k, and an evaluation dashboard. Use a corpus you know well — knowing it is what lets you feel retrieval failures.

1. **Ingestion:** parse a real mixed corpus (PDF, HTML, Markdown, and at least one Office document) plus one structured data source into structure-aware chunks that carry source, section, page anchor, version, and ACL/tenant metadata from source to chunk to index; re-runs are idempotent, keyed by content hash.
2. **Retrieval:** dense + BM25 hybrid search with metadata filters and a reranker, with permission filtering applied *before* anything enters the model's context.
3. **Answering:** streamed answers whose citations resolve to the exact source span and are validated before they are shown; explicit abstention when evidence is missing; conflicting sources surfaced, not averaged away.
4. **Freshness and deletion:** incremental refresh when a source changes; a deleted or revoked document disappears from results, and a test proves it.
5. **Evaluation:** a golden set of 50+ questions, including unanswerable ones and cross-tenant probes; recall@k and MRR for keyword-only → dense → hybrid → hybrid + rerank; zero cross-tenant leaks.
6. **Dashboard:** index quality — corpus coverage, staleness, recall@k, and the query distribution.

**Stretch:** contextual or parent-child retrieval, A/B tested on the golden set; or a small knowledge graph over the corpus's entities, compared honestly against plain hybrid search.

## Hands-on project 2: governed workflow agent

Read/write tool distinction, approvals, idempotent execution, MCP integration, failure injection, and permission attack tests — compared against a deterministic baseline.

1. **Raw loop first:** the agent loop over a raw model API — tool calls, execution, termination conditions, step and budget limits — with the full trace printed. Then break it on purpose with a vague tool description and a cryptic tool error, and watch the behavior degrade.
2. **Tools:** read tools (including the project 1 search) and write tools, each classified by side effect, idempotent, and run with scoped credentials; every irreversible action waits for human approval.
3. **Framework rebuild:** the same agent on LangGraph (or the framework you choose) with checkpointed state, resumable human approvals, and replay of a past run from its trace.
4. **MCP:** expose the project 1 search and one write tool as an MCP server with authorization, and use it from a real MCP host.
5. **Baseline:** build the same task as a deterministic workflow and compare task success, cost, and latency against the agent; a multi-agent version, if you build one, has to beat both.
6. **Attack and failure tests:** inject failures (tool timeouts, malformed tool output, a crash mid-run) and permission attacks (a prompt injection planted in retrieved content that tries to trigger a write tool); the agent fails safe every time.

**Stretch:** persistent memory across sessions with a privacy and expiry policy; or run the write path on Temporal (or an equivalent) and kill the worker mid-run to prove the workflow resumes without repeating a side effect.

## Exit criteria

- [ ] I can trace an ACL from source document to chunk to index to answer, and my tests prove there are no cross-tenant leaks
- [ ] I can report recall@k for keyword, dense, hybrid, and reranked retrieval on my own golden set, and explain the differences
- [ ] My RAG answers cite exact sources, validate their citations, abstain when evidence is missing, and drop deleted documents
- [ ] I can write the agent loop from a blank file — tools, execution, termination, budget guard — in under an hour
- [ ] Given a problem, I can say "workflow" or "agent", name the pattern, and justify it in two sentences
- [ ] My agent's write tools are idempotent, classified by side effect, and gated by a resumable human approval I can demo
- [ ] My MCP server runs in a real host with authorization, and I can explain its security model
- [ ] My agent beat a deterministic baseline on my evaluation — or I shipped the baseline and can say why
