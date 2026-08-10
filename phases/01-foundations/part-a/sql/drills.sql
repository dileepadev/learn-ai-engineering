-- Topic 11 — SQL drills.
--
-- Read lessons/11-a-little-sql.md, start the database, then work down this file.
--
--   docker compose -f sql/docker-compose.yml up -d
--   docker compose -f sql/docker-compose.yml exec db psql -U learner -d learning
--
-- Write each query in psql and compare against the expected result stated in
-- the comment. Answers are in solutions.sql -- try first.
--
-- Useful in psql:  \dt  list tables   \d documents  describe a table
--                  \x   expanded output (for wide rows)   \q  quit


-- 11.1  SELECT and ORDER BY
-- List every document title, alphabetically.
-- Expect: 10 rows, starting with 'Batch API Guide' and ending with
--         'What We Learned Shipping RAG'.



-- 11.2  WHERE and ORDER BY DESC
-- Titles and word counts of documents longer than 1000 words, longest first.
-- Expect: 6 rows -- Dense Retrieval Survey (5400), Hybrid Search Revisited
--         (4100), Indexes and Query Plans (3100), Tool Use Overview (2400),
--         What We Learned Shipping RAG (1750), Streaming Messages (1200).



-- 11.3  IS NULL
-- Titles of documents with no publication date.
-- Expect: 2 rows -- 'Tool Use Overview' and 'Hybrid Search Revisited'.
--
-- Try `WHERE published_on = NULL` first and watch it return zero rows without
-- raising anything. That silence is the whole lesson.



-- 11.4  COALESCE
-- Every document's title alongside its publication date, showing the text
-- 'unknown' where the date is missing.
-- Expect: 10 rows, two of them showing 'unknown'.
-- Hint: COALESCE needs both arguments to be the same type -- cast the date.



-- 11.5  ILIKE
-- Titles containing "rag", case-insensitively.
-- Expect: 1 row -- 'What We Learned Shipping RAG'.
-- Note that LIKE '%rag%' would find nothing here, because the title is
-- uppercase. Provider and user text is never reliably cased; prefer ILIKE.



-- 11.6  JOIN
-- Each document's title next to the name of its source, ordered by title.
-- Expect: 10 rows. 'Batch API Guide' -> 'Anthropic Docs',
--         'Dense Retrieval Survey' -> 'Retrieval Papers', and so on.
-- Alias your tables and qualify your columns.



-- 11.7  LEFT JOIN with COUNT
-- How many documents each source has -- INCLUDING sources with none.
-- Expect: 5 rows -- Anthropic Docs 4, Postgres Manual 2, Engineering Blog 2,
--         Retrieval Papers 2, Community Forum 0.
--
-- A plain JOIN gives 4 rows and silently drops Community Forum. Getting the 0
-- also needs COUNT on the documents column, not COUNT(*) -- the outer-joined
-- row exists, so COUNT(*) would report 1.



-- 11.8  GROUP BY with AVG
-- Average document word count per source kind, highest average first.
-- Expect: 3 rows -- paper 4750, docs ~1483.33, blog 1185.
-- ('forum' is absent because Community Forum has no documents. Think about
--  which join type you used, and whether that is the answer you wanted.)



-- 11.9  HAVING
-- Names of sources with more than 2 documents.
-- Expect: 1 row -- 'Anthropic Docs'.
--
-- WHERE cannot do this: it filters rows before grouping, and "more than 2
-- documents" is a property of the group, which does not exist yet.



-- 11.10  LEFT JOIN to find missing rows
-- Titles of documents that have no chunks at all.
-- Expect: 2 rows -- 'JSONB Operators' and 'Batch API Guide'.
--
-- These are exactly the documents an ingestion pipeline failed on, which is
-- why this query is one you will actually run in Phase 4.



-- 11.11  GROUP BY with SUM and LIMIT
-- The 3 documents with the highest total chunk token count. Show title and
-- total, largest first.
-- Expect: Dense Retrieval Survey 1960, Indexes and Query Plans 1450,
--         Hybrid Search Revisited 1190.



-- 11.12  Everything at once
-- Every document's title and chunk count, including documents with zero
-- chunks. Order by chunk count descending, then title ascending.
-- Expect: 10 rows, starting Dense Retrieval Survey 6, Indexes and Query Plans
--         5, Hybrid Search Revisited 4, Tool Use Overview 4, ... and ending
--         Batch API Guide 0, JSONB Operators 0.



-- Then, to finish: run EXPLAIN ANALYZE on your 11.12 query.
--
--   EXPLAIN ANALYZE <your query>;
--
-- Find where it uses idx_chunks_document_id. Then drop that index, run it
-- again, and compare:
--
--   DROP INDEX idx_chunks_document_id;
--   -- re-run EXPLAIN ANALYZE, look for "Seq Scan on chunks"
--   CREATE INDEX idx_chunks_document_id ON chunks (document_id);
--
-- At 28 rows the timings are noise -- Postgres may even prefer the sequential
-- scan, which is the correct choice on a tiny table. The point is to recognise
-- the plan shapes, so that a Seq Scan on a million-row table in Phase 7 reads
-- as a finding rather than as text.
