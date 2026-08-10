-- Topic 11 seed data.
--
-- Small enough to check answers by eye, but shaped to make the interesting
-- cases reachable:
--   - one source with no documents at all      (source 5)
--   - two documents with no chunks             (documents 5 and 10)
--   - two documents with a NULL published_on   (documents 3 and 9)
-- Those three are what separate JOIN from LEFT JOIN, and = NULL from IS NULL.

INSERT INTO sources (id, name, kind) VALUES
    (1, 'Anthropic Docs',    'docs'),
    (2, 'Postgres Manual',   'docs'),
    (3, 'Engineering Blog',  'blog'),
    (4, 'Retrieval Papers',  'paper'),
    (5, 'Community Forum',   'forum');

INSERT INTO documents (id, source_id, title, published_on, word_count) VALUES
    (1,  1, 'Streaming Messages',            '2026-01-15', 1200),
    (2,  1, 'Prompt Caching',                '2026-02-03',  800),
    (3,  1, 'Tool Use Overview',              NULL,         2400),
    (4,  2, 'Indexes and Query Plans',       '2025-11-20', 3100),
    (5,  2, 'JSONB Operators',               '2025-12-01',  450),
    (6,  3, 'What We Learned Shipping RAG',  '2026-03-10', 1750),
    (7,  3, 'Cutting Latency in Half',       '2026-04-02',  620),
    (8,  4, 'Dense Retrieval Survey',        '2025-09-14', 5400),
    (9,  4, 'Hybrid Search Revisited',        NULL,         4100),
    (10, 1, 'Batch API Guide',               '2026-05-21',  950);

INSERT INTO chunks (id, document_id, position, content, token_count) VALUES
    -- document 1: Streaming Messages
    (1,  1, 0, 'Server-sent events deliver tokens as they are generated.',  180),
    (2,  1, 1, 'Each event carries a type and a JSON data payload.',        210),
    (3,  1, 2, 'The stream terminates with an explicit done sentinel.',     150),
    -- document 2: Prompt Caching
    (4,  2, 0, 'Cache breakpoints mark reusable prefixes of a prompt.',     200),
    (5,  2, 1, 'Cached reads are billed at a reduced rate.',                160),
    -- document 3: Tool Use Overview
    (6,  3, 0, 'Tools are described to the model as JSON schemas.',         220),
    (7,  3, 1, 'The model returns a tool name and its arguments.',          240),
    (8,  3, 2, 'Your code executes the tool and returns a result block.',   190),
    (9,  3, 3, 'The loop continues until the model stops requesting tools.', 260),
    -- document 4: Indexes and Query Plans
    (10, 4, 0, 'An index trades write speed for read speed.',               300),
    (11, 4, 1, 'B-tree indexes serve equality and range predicates.',       280),
    (12, 4, 2, 'EXPLAIN ANALYZE reports the plan and real timings.',        310),
    (13, 4, 3, 'A sequential scan on a large table is worth investigating.', 290),
    (14, 4, 4, 'Foreign key columns are not indexed automatically.',        270),
    -- document 5 (JSONB Operators) deliberately has NO chunks
    -- document 6: What We Learned Shipping RAG
    (15, 6, 0, 'Retrieval quality dominates generation quality.',           240),
    (16, 6, 1, 'Chunk boundaries matter more than chunk size.',             260),
    (17, 6, 2, 'Reranking gave the largest gain per line of code.',         230),
    -- document 7: Cutting Latency in Half
    (18, 7, 0, 'Streaming moved perceived latency from 4s to 200ms.',       190),
    -- document 8: Dense Retrieval Survey
    (19, 8, 0, 'Dense retrieval encodes queries and passages jointly.',     320),
    (20, 8, 1, 'Approximate nearest neighbour search bounds the cost.',     340),
    (21, 8, 2, 'Recall at k is the standard retrieval metric.',             300),
    (22, 8, 3, 'Hard negatives improve training signal substantially.',     360),
    (23, 8, 4, 'Sparse and dense methods fail on different queries.',       330),
    (24, 8, 5, 'Hybrid approaches combine both scoring functions.',         310),
    -- document 9: Hybrid Search Revisited
    (25, 9, 0, 'BM25 remains a strong lexical baseline.',                   280),
    (26, 9, 1, 'Reciprocal rank fusion needs no score calibration.',        300),
    (27, 9, 2, 'Weighting requires tuning on a held-out set.',              320),
    (28, 9, 3, 'Evaluation must use queries the index has not seen.',       290);
    -- document 10 (Batch API Guide) deliberately has NO chunks
