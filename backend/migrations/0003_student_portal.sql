-- ============================================================================
-- 0003_student_portal.sql
-- Kolom pendukung Portal Mahasiswa (Anggota 2 — Favian).
-- Bersifat aditif & idempoten sehingga aman dijalankan ulang saat startup.
--   * proposals.field_of_study            : kriteria bidang/jurusan pengusul
--   * logbook_entries.progress_percentage : persentase capaian kegiatan (0-100)
-- ============================================================================

ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(150);

ALTER TABLE logbook_entries
    ADD COLUMN IF NOT EXISTS progress_percentage INTEGER
        CHECK (progress_percentage IS NULL
               OR (progress_percentage >= 0 AND progress_percentage <= 100));
