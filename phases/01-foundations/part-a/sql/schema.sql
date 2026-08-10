-- Topic 11 schema: a miniature RAG corpus.
--
-- Deliberately the same shape you will build for real in Phase 4 -- a source
-- has many documents, a document has many chunks -- so the joins you practise
-- here are the joins you will write there.

CREATE TABLE sources (
    id    integer PRIMARY KEY,
    name  text NOT NULL,
    -- A closed set of values, enforced by the database. This is the SQL
    -- equivalent of topic 10's Literal, and it is checked on every write.
    kind  text NOT NULL CHECK (kind IN ('docs', 'blog', 'paper', 'forum'))
);

CREATE TABLE documents (
    id            integer PRIMARY KEY,
    source_id     integer NOT NULL REFERENCES sources (id),
    title         text NOT NULL,
    -- Nullable on purpose: some documents genuinely have no publication date,
    -- and the drills use it to practise IS NULL and COALESCE.
    published_on  date,
    word_count    integer NOT NULL
);

CREATE TABLE chunks (
    id           integer PRIMARY KEY,
    document_id  integer NOT NULL REFERENCES documents (id),
    -- Position of this chunk within its document, 0-based.
    position     integer NOT NULL,
    content      text NOT NULL,
    token_count  integer NOT NULL,

    -- A chunk position cannot repeat within a document. Constraints like this
    -- catch ingestion bugs at write time instead of at retrieval time.
    UNIQUE (document_id, position)
);

-- Primary keys are indexed automatically; foreign keys are NOT. These two are
-- the highest-value indexes in this schema, because every join below uses them.
CREATE INDEX idx_documents_source_id ON documents (source_id);
CREATE INDEX idx_chunks_document_id ON chunks (document_id);
