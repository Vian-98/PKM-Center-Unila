-- ============================================================================
-- PKM Center Unila: Skema Pesan Langsung (Direct Messages) & Evaluasi Tambahan
-- File    : backend/migrations/0002_direct_messages.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS direct_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals (id) ON DELETE SET NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_proposal ON direct_messages (proposal_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages (created_at);
