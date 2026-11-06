-- ============================================================================
-- 0005_admin_akun_and_ktm.sql
-- Penambahan peran 'admin_akun' untuk verifikasi akun mahasiswa dan berkas KTM,
-- pembaruan status akun 'rejected', serta kolom KTM pada profil mahasiswa.
-- Bersifat aditif & idempoten.
-- ============================================================================

-- 1. Perbarui constraint status akun di tabel users agar mendukung 'rejected'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'pending', 'rejected', 'suspended', 'inactive'));

-- 2. Tambahkan kolom pendukung KTM dan verifikasi di student_profiles
ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS ktm_url TEXT;

ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE student_profiles
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users (id) ON DELETE SET NULL;

-- 3. Daftarkan role baru 'admin_akun'
INSERT INTO roles (code, name, description) VALUES
    ('admin_akun', 'Admin Akun', 'Administrator Pengelola dan Verifikasi Akun Pengguna')
ON CONFLICT (code) DO NOTHING;

