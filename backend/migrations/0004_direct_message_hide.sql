-- ============================================================================
-- 0004_direct_message_hide.sql
-- Penanda "hapus chat" per sisi percakapan. Pesan tetap tersimpan bagi lawan
-- bicara; hanya disembunyikan dari tampilan pihak yang menghapus.
-- Bersifat aditif & idempoten sehingga aman dijalankan ulang saat startup.
-- ============================================================================

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS hidden_for_sender BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS hidden_for_receiver BOOLEAN NOT NULL DEFAULT FALSE;
