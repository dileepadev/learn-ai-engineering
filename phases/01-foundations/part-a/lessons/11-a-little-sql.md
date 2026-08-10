# 11 — A little SQL

> **Drills:** `sql/drills.sql` · **Run it:** see "Getting a database" below

The phase doc scopes this tightly: "`SELECT`, `JOIN`, `GROUP BY`, indexes at a practical
level." That is the whole ask. You are not becoming a DBA — you are learning enough Postgres
that Phase 4 is about retrieval quality rather than about SQL syntax.

The reason it is in Phase 1 at all: from Phase 4 onward your app data, your embeddings, and
your full-text index all live in the same Postgres database. pgvector is a Postgres extension,
which means a vector search is a `SELECT` with an unusual `ORDER BY`. If `SELECT` and `JOIN`
are already comfortable, that sentence is all the explanation you need.

## Why this topic breaks the pattern

Every other topic here is graded by pytest. This one is not. Testing SQL through pytest would
mean adding a `psycopg` dependency and requiring a running container for the suite to pass,
which is a poor trade for "a little SQL."

So: you run the queries yourself and check your own answers. `sql/drills.sql` states each
question and the expected result inline.

## Getting a database

From this directory:

```bash
docker compose -f sql/docker-compose.yml up -d      # starts Postgres 17 on port 5433
docker compose -f sql/docker-compose.yml logs -f    # wait for "ready to accept connections"
```

Port **5433**, not the default 5432, so it cannot collide with anything already running.
`schema.sql` and `seed.sql` load automatically on first start — Postgres runs everything in
`/docker-entrypoint-initdb.d` when the data directory is empty.

Open a shell:

```bash
docker compose -f sql/docker-compose.yml exec db psql -U learner -d learning
```

Useful `psql` commands: `\dt` lists tables, `\d documents` describes one, `\q` quits. Prefix
with `\x` to switch to expanded output when rows are too wide to read.

When you are done:

```bash
docker compose -f sql/docker-compose.yml down        # stop, keep data
docker compose -f sql/docker-compose.yml down -v     # stop and wipe, to re-seed from scratch
```

## The data

Three tables, deliberately shaped like a small RAG corpus so nothing has to be re-learned in
Phase 4:

```text
sources                documents                    chunks
-------                ---------                    ------
id                     id                           id
name                   source_id -> sources.id      document_id -> documents.id
kind                   title                        position
                       published_on                 content
                       word_count                   token_count
```

A source has many documents; a document has many chunks. That is the shape every ingestion
pipeline produces.

## SELECT

```sql
SELECT title, word_count
FROM documents
WHERE word_count > 500
ORDER BY word_count DESC
LIMIT 10;
```

Clauses must appear in that order, but they **execute** roughly as: `FROM` → `WHERE` →
`GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`. That execution order explains two
things that otherwise look arbitrary:

- You cannot use a `SELECT` alias in `WHERE` (the alias does not exist yet), but you can in
  `ORDER BY` (by then it does).
- `WHERE` filters rows **before** grouping; `HAVING` filters groups **after**. They are not
  interchangeable.

Useful predicates:

```sql
WHERE title ILIKE '%rag%'              -- case-insensitive substring
WHERE published_on >= '2026-01-01'
WHERE source_id IN (1, 2)
WHERE published_on IS NULL             -- never `= NULL`; see below
```

### NULL is not a value

`NULL` means "unknown," so every comparison with it returns unknown, not true:

```sql
WHERE published_on = NULL      -- matches NOTHING, ever. Not an error, just silently empty.
WHERE published_on IS NULL     -- correct
```

This is the single most common SQL bug. `COALESCE(published_on, '1970-01-01')` substitutes a
default when a value may be NULL.

## JOIN

```sql
SELECT d.title, s.name AS source_name
FROM documents AS d
JOIN sources AS s ON s.id = d.source_id;
```

- `JOIN` (inner) keeps only rows that match on both sides.
- `LEFT JOIN` keeps every row from the left table, filling NULLs where the right has no match.

The difference matters more than it looks. "How many chunks does each document have?" with an
inner join silently **omits documents that have no chunks** — which are exactly the documents
your ingestion pipeline failed on, and exactly the ones you needed to find. Use `LEFT JOIN`
whenever the answer should include zeroes.

Alias your tables (`AS d`) and qualify your columns (`d.title`). With three tables in play,
unqualified column names become guesswork for the reader.

## GROUP BY and aggregates

```sql
SELECT s.name, COUNT(*) AS document_count, AVG(d.word_count) AS avg_words
FROM documents AS d
JOIN sources AS s ON s.id = d.source_id
GROUP BY s.name
HAVING COUNT(*) > 1
ORDER BY document_count DESC;
```

The rule: every column in `SELECT` must either be **in the `GROUP BY`** or **inside an
aggregate**. Postgres rejects anything else, which feels strict until you realise the
alternative is a made-up answer.

Aggregates: `COUNT(*)`, `SUM`, `AVG`, `MIN`, `MAX`.

`COUNT(*)` counts rows; `COUNT(column)` counts **non-NULL** values in that column. On a
`LEFT JOIN` this is the difference between 1 and 0 for a document with no chunks — the
outer-joined row exists, so `COUNT(*)` sees it, but its columns are NULL, so `COUNT(c.id)`
does not. Use `COUNT(c.id)` when you want a true zero.

## Indexes, practically

An index is a lookup structure the database maintains so it can find rows without scanning the
whole table.

```sql
CREATE INDEX idx_documents_source_id ON documents (source_id);
```

What you need to know at this level:

- Index the columns you **filter** or **join** on, not the ones you display.
- Primary keys are indexed automatically. Foreign keys are **not** — index them yourself. This
  is the single highest-value index most schemas are missing.
- Indexes cost write speed and disk. Do not index everything.
- `EXPLAIN ANALYZE <query>` shows the plan and the real timing. `Seq Scan` on a large table in
  a query you run often is the signal to add an index.

In Phase 4, pgvector adds an HNSW index for approximate nearest-neighbour search. It is a
different algorithm answering a different question, but the reasoning is identical: without it
every query scans every vector.

## Where this shows up later

- **Phase 4** — documents, chunks, and embeddings in Postgres; retrieval is a `SELECT` with an
  `ORDER BY` on vector distance, joined back to metadata.
- **Phase 6** — eval runs stored and aggregated per metric with `GROUP BY`.
- **Phase 7** — reading query plans when retrieval gets slow under real load.

## Resources

The phase doc recommends [SQLBolt](https://sqlbolt.com) — interactive, and genuinely an
afternoon. Do it before or alongside `sql/drills.sql`.

## Do the drills

`sql/drills.sql` has twelve questions in rough order of difficulty, each with the expected
result described in a comment. Write the query, run it in `psql`, compare. Answers are in
`sql/solutions.sql` — same rule as everywhere else here: try first.
