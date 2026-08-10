-- Topic 11 — SQL drills: reference solutions.
--
-- As everywhere else in Part A: try first. Comments explain why, not what.


-- 11.1  SELECT and ORDER BY
SELECT title
FROM documents
ORDER BY title;


-- 11.2  WHERE and ORDER BY DESC
SELECT title, word_count
FROM documents
WHERE word_count > 1000
ORDER BY word_count DESC;


-- 11.3  IS NULL
-- `published_on = NULL` is not an error and not a match -- comparing with NULL
-- yields unknown, and WHERE keeps only rows where the predicate is true.
SELECT title
FROM documents
WHERE published_on IS NULL;


-- 11.4  COALESCE
-- The cast is required: COALESCE's arguments must share a type, and
-- 'unknown' is text while published_on is a date.
SELECT title, COALESCE(published_on::text, 'unknown') AS published
FROM documents
ORDER BY title;


-- 11.5  ILIKE
SELECT title
FROM documents
WHERE title ILIKE '%rag%';


-- 11.6  JOIN
SELECT d.title, s.name AS source_name
FROM documents AS d
JOIN sources AS s ON s.id = d.source_id
ORDER BY d.title;


-- 11.7  LEFT JOIN with COUNT
-- Two deliberate choices. LEFT JOIN keeps Community Forum, which has no
-- documents. COUNT(d.id) rather than COUNT(*) makes its count 0: the outer
-- join produces one row for it with every document column NULL, and COUNT on
-- a column ignores NULLs while COUNT(*) counts the row.
SELECT s.name, COUNT(d.id) AS document_count
FROM sources AS s
LEFT JOIN documents AS d ON d.source_id = s.id
GROUP BY s.name
ORDER BY document_count DESC, s.name;


-- 11.8  GROUP BY with AVG
-- An inner join here, so 'forum' is absent rather than showing a NULL average.
-- That is the right answer for "average across documents that exist"; swap in
-- a LEFT JOIN if you would rather see the empty kind listed.
SELECT s.kind, AVG(d.word_count) AS avg_words
FROM documents AS d
JOIN sources AS s ON s.id = d.source_id
GROUP BY s.kind
ORDER BY avg_words DESC;


-- 11.9  HAVING
-- HAVING filters groups after aggregation; WHERE filters rows before it, and
-- so cannot see COUNT(*) at all.
SELECT s.name
FROM sources AS s
JOIN documents AS d ON d.source_id = s.id
GROUP BY s.name
HAVING COUNT(*) > 2;


-- 11.10  LEFT JOIN to find missing rows
-- The anti-join idiom: outer join, then keep only the rows where the right
-- side came back empty. `WHERE NOT EXISTS (SELECT 1 FROM chunks ...)` reads
-- more clearly to some people and Postgres plans both the same way.
SELECT d.title
FROM documents AS d
LEFT JOIN chunks AS c ON c.document_id = d.id
WHERE c.id IS NULL;


-- 11.11  GROUP BY with SUM and LIMIT
SELECT d.title, SUM(c.token_count) AS total_tokens
FROM documents AS d
JOIN chunks AS c ON c.document_id = d.id
GROUP BY d.title
ORDER BY total_tokens DESC
LIMIT 3;


-- 11.12  Everything at once
-- LEFT JOIN so the two chunkless documents still appear, COUNT(c.id) so they
-- appear as 0, and a two-key ORDER BY so ties are broken deterministically --
-- without the second key, equal counts come back in whatever order the plan
-- happened to produce.
SELECT d.title, COUNT(c.id) AS chunk_count
FROM documents AS d
LEFT JOIN chunks AS c ON c.document_id = d.id
GROUP BY d.title
ORDER BY chunk_count DESC, d.title;
