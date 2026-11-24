-- ============================================================================
-- 0006_seleksi_ide_bidang_reviewer.sql
-- Tahap 2 "Seleksi Ide" dan akses reviewer per bidang.
--   * expertise_fields  : daftar bidang baku (dipakai reviewer, ide, proposal)
--   * user_expertise    : bidang yang dipegang tiap reviewer (tabel sudah ada)
--   * proposals.expertise_field_id : bidang proposal untuk antrean reviewer
--   * idea_submissions  : ide awal mahasiswa yang diseleksi reviewer sebidang
-- Bersifat aditif & idempoten sehingga aman dijalankan ulang saat startup.
-- ============================================================================

INSERT INTO expertise_fields (name, description) VALUES
    ('Teknologi & Rekayasa', 'Teknik, informatika, elektro, mesin, sipil, dan rekayasa sistem.'),
    ('Pertanian & Pangan', 'Agroteknologi, peternakan, perikanan, kehutanan, dan teknologi pangan.'),
    ('Kesehatan & Kedokteran', 'Kedokteran, gizi, farmasi, dan kesehatan masyarakat.'),
    ('MIPA & Lingkungan', 'Matematika, fisika, kimia, biologi, dan ilmu lingkungan.'),
    ('Sosial, Ekonomi & Bisnis', 'Ekonomi, manajemen, kewirausahaan, dan ilmu sosial politik.'),
    ('Pendidikan', 'Keguruan, pembelajaran, dan inovasi pendidikan.'),
    ('Hukum & Humaniora', 'Hukum, bahasa, seni, budaya, dan humaniora.')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS expertise_field_id BIGINT REFERENCES expertise_fields (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_expertise_field_id ON proposals (expertise_field_id);

CREATE TABLE IF NOT EXISTS idea_submissions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expertise_field_id BIGINT NOT NULL REFERENCES expertise_fields (id),
    scheme_code        VARCHAR(20),
    title              VARCHAR(255) NOT NULL,
    problem            TEXT NOT NULL,
    solution           TEXT NOT NULL,
    novelty            TEXT,
    target_output      TEXT,
    status             VARCHAR(20) NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('submitted', 'accepted', 'revision', 'rejected')),
    score              NUMERIC(5, 2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    reviewer_id        UUID REFERENCES users (id) ON DELETE SET NULL,
    reviewer_note      TEXT,
    reviewed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_field_status ON idea_submissions (expertise_field_id, status);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_student_id ON idea_submissions (student_id);
