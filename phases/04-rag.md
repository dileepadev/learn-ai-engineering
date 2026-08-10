# Phase 4 — RAG: Embeddings, Vector Search, Retrieval

**Goal:** Build retrieval-augmented generation properly — embeddings, chunking, hybrid search, reranking, citations — and know how to measure whether retrieval is actually working.
**You build:** `docs-chat`, a grounded Q&A system over a real corpus, with a retrieval eval set.
**Effort:** ~25–40 hours.

## Why this phase exists

RAG is how you make models answer from *your* data — the single most requested capability in industry. It's also where naive implementations quietly fail: the demo works, then real users ask real questions and retrieval misses. The skill isn't wiring up a vector DB (an afternoon); it's the retrieval quality engineering around it. Note the framing: RAG is a *retrieval* problem wearing an AI costume. Most of this phase is search engineering, and that's why it transfers.

## Core skills

### Embeddings

- What an embedding is (a vector such that semantic similarity ≈ geometric closeness) and what cosine similarity does. That one sentence of theory is genuinely enough.
- Hosted embedding models (OpenAI `text-embedding-3`, Cohere, Voyage) vs open-source (`sentence-transformers`, the BGE/GTE families via `sentence-transformers`). Dimensions, cost, and the fact that you *cannot mix* embeddings from different models in one index.
- Embeddings beyond RAG: near-duplicate detection, clustering, classification, semantic caching — cheap tricks you'll reuse everywhere.

### Chunking & ingestion

- Why chunking exists (context limits, retrieval precision) and why it's the highest-leverage knob in most RAG systems.
- Strategies: fixed-size with overlap (baseline), structure-aware (headings/paragraphs — usually the right answer), semantic chunking (rarely worth it). Chunk size tradeoffs.
- **Contextual retrieval** (Anthropic's technique): prepend an LLM-generated one-line context to each chunk before embedding. Cheap with prompt caching, large recall gains — read the post.
- Metadata capture at ingest (source, section, date, URL) — it powers filtering *and* citations later.
- Parsing real documents: PDFs are where ingestion pipelines go to die; know `pymupdf`/`docling`-class tools exist and budget time accordingly.

### Vector storage & retrieval

- **Primary: Postgres + [pgvector](https://github.com/pgvector/pgvector).** One database for vectors, metadata, full-text search, and your app data. This is the boring, correct default, and Postgres skills compound.
- **Also know:** Qdrant / Weaviate / Milvus (dedicated engines for scale), Pinecone/Turbopuffer (managed), Chroma/LanceDB (embedded, great for prototypes). Know *why* you'd graduate from pgvector — most apps never need to.
- HNSW indexes at the practical level: approximate search trading recall for speed; when to just brute-force (small corpora).
- **Hybrid search:** dense vectors miss exact identifiers, keywords miss paraphrases — combine vector search with BM25/full-text (Postgres `tsvector` gives you both in one query) and merge with Reciprocal Rank Fusion.
- **Reranking:** over-retrieve (top 25–50), then rerank to top 5 with a cross-encoder (Cohere Rerank hosted, or BGE reranker local). Usually the single biggest quality jump after hybrid search.
- Query-side techniques: query rewriting from conversation context (essential for multi-turn), decomposition for compound questions. Know HyDE exists.

### Generation & measurement

- Grounded answering: instruct the model to answer *only* from provided chunks, cite sources per claim, and say "not found" when retrieval comes up empty — the last one is what users actually judge you on.
- Retrieval metrics: build a question → relevant-chunk golden set, measure recall@k and MRR. Answer-quality metrics (faithfulness, relevance) come via LLM-as-judge in Phase 6; libraries like [DeepEval](https://deepeval.com) and [Ragas](https://docs.ragas.io) ship prebuilt versions of these metrics — learn them as vocabulary, knowing that serious teams usually end up writing custom judges (Phase 6 covers why and how).
- The long-context question: when stuffing everything into a million-token window beats RAG (small stable corpus, cost-insensitive) and when it doesn't (large/fresh corpora, latency, cost, attention degradation). Have an opinion; interviewers ask.

## Hands-on project: `docs-chat`

Grounded Q&A over a corpus you actually know — your own notes, a project's docs, or a tool's documentation site. Knowing the corpus is what lets you *feel* retrieval failures.

Spec:

1. Ingestion CLI: parse → chunk (structure-aware, with metadata) → embed → store in pgvector (Docker compose from Phase 1). Idempotent re-runs (content-hash based).
2. Retrieval: hybrid (vector + Postgres full-text) merged with RRF, then reranked. Every stage's output loggable — you will be debugging retrieval, not generation.
3. Answering: streamed FastAPI endpoint (Phase 1 skills) with inline numbered citations resolving to source chunks; refuses gracefully when nothing relevant is found.
4. Multi-turn: follow-up questions get rewritten into standalone queries before retrieval.
5. **Eval set: 25+ questions with known relevant chunks.** Report recall@5 for: vector-only → hybrid → hybrid+rerank. Watching that number climb across the three configs is the point of the phase.
6. A/B one variable (chunk size, or contextual retrieval on/off) and record the result in the README.

**Stretch:** add contextual retrieval if you didn't; or expose the whole thing as a single `search(query) -> chunks` function with a clean interface — you'll want exactly that shape for Phase 5's MCP server.

## Resources

- [Anthropic: Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) — read even if you don't implement it; the failure analysis is the value
- [pgvector README](https://github.com/pgvector/pgvector) — complete and short; plus any Supabase/Neon pgvector + hybrid search guide
- [DeepEval docs](https://deepeval.com/docs) — skim the RAG metrics pages (faithfulness, answer & context relevancy) for the vocabulary now; hands-on use comes in Phase 6
- [applied-llms.org](https://applied-llms.org) — the RAG sections distill a year of practitioner scar tissue
- Chip Huyen, *AI Engineering*, RAG chapter — best written treatment of the architecture decisions

## Exit criteria

- [ ] I can explain embeddings, chunking tradeoffs, hybrid search, and reranking on a whiteboard, no notes
- [ ] `docs-chat` works end to end with citations, streaming, refusal-when-absent, and multi-turn query rewriting
- [ ] I have recall@5 numbers for three retrieval configs and can say which change mattered and why
- [ ] I can articulate when I'd choose pgvector vs a dedicated vector DB vs long context, and defend it
- [ ] Given "our RAG gives wrong answers," I have an ordered debugging checklist that starts with retrieval, not the prompt
