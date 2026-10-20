import { TeamManagement } from './TeamManagement'

/**
 * Halaman CariTim kini digabungkan ke dalam TeamManagement (Unified Team & Mentorship Hub).
 * Komponen ini dipertahankan sebagai wrapper kompatibilitas agar rute lama atau deep link
 * langsung menampilkan tab 'Cari Dosen' / 'Cari Tim'.
 */
export function CariTim({ user, initialTab = 'dosen' }) {
  return <TeamManagement user={user} initialTab={initialTab} />
}

export default CariTim
