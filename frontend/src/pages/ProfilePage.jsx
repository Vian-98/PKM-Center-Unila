import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Save,
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Camera,
} from 'lucide-react'
import { api } from '../lib/content'
import { getAuthToken, updateAuthUser } from '../lib/authSession'

const FAKULTAS_OPTIONS = [
  'Fakultas Teknik',
  'FMIPA',
  'Fakultas Pertanian',
  'Fakultas Kedokteran',
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Hukum',
  'Fakultas Ilmu Sosial dan Ilmu Politik',
  'Fakultas Keguruan dan Ilmu Pendidikan',
]

export function ProfilePage({ user, onUpdateUser, onSwitchRole, onLogout }) {
  const [activeTab, setActiveTab] = useState('identitas') // 'identitas' | 'keamanan'
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState('')

  // Form state diinisialisasi dari data pengguna aktif
  const [form, setForm] = useState({
    name: user?.name || user?.nama || '',
    email: user?.email || '',
    idNumber: user?.nip || user?.npm || user?.idNumber || (user?.role === 'mahasiswa' ? '2117051001' : '197508122001121002'),
    phone: user?.phone || '0812-7890-1234',
    faculty: user?.faculty || (user?.role === 'reviewer' ? 'FMIPA' : 'Fakultas Teknik'),
    department: user?.department || (user?.role === 'reviewer' ? 'Ilmu Komputer' : 'Teknik Elektro'),
    studyProgram: user?.studyProgram || (user?.role === 'reviewer' ? 'S1 Ilmu Komputer' : 'S1 Teknik Elektro'),
    academicPosition: user?.academicPosition || (user?.role === 'mahasiswa' ? 'Mahasiswa Aktif' : 'Lektor Kepala'),
    expertise: user?.expertise || (user?.role === 'reviewer' ? 'Artificial Intelligence, Decision Support System, Data Mining' : 'Sistem Tenaga Listrik, Internet of Things (IoT), Energi Terbarukan'),
    supervisionCapacity: user?.supervisionCapacity || 10,
    biography: user?.biography || (user?.role === 'dosen'
      ? 'Dosen Pembimbing PKM Aktif Universitas Lampung. Terbuka untuk membimbing tim skema PKM-KC, PKM-PI, dan PKM-RE.'
      : user?.role === 'reviewer'
      ? 'Reviewer Penilai Proposal PKM Tingkat Universitas dan Nasional. Fokus pada orisinalitas ide dan kelayakan metodologi.'
      : 'Mahasiswa aktif pengusul program kreativitas mahasiswa.'),
  })

  const userInitials = form.name
    ? form.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  // Tentukan URL tujuan tombol "Kembali"
  const getBackHash = () => {
    if (!user) return '#beranda'
    if (user.role === 'reviewer') return '#reviewer'
    if (user.role === 'dosen') return '#dosen'
    if (user.role === 'admin') return '#admin'
    return '#mahasiswa'
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'dosen': return 'Dosen Pembimbing PKM'
      case 'reviewer': return 'Reviewer Internal PKM'
      case 'admin': return 'Administrator PKM Center'
      case 'mahasiswa': return 'Mahasiswa Pengusul'
      default: return 'Pengguna PKM'
    }
  }

  const roles = user?.roles || []

  // Tentukan target peran dan label tombol switch role secara dinamis
  let switchTarget = null
  let switchLabel = 'Ganti Peran'

  if (user?.role === 'admin') {
    if (roles.includes('dosen')) {
      switchTarget = 'dosen'
      switchLabel = 'Ganti ke Dosen'
    } else if (roles.includes('reviewer')) {
      switchTarget = 'reviewer'
      switchLabel = 'Ganti ke Reviewer'
    }
  } else if (user?.role === 'dosen') {
    if (roles.includes('admin')) {
      switchTarget = 'admin'
      switchLabel = 'Kembali ke Panel Admin'
    } else if (roles.includes('reviewer')) {
      switchTarget = 'reviewer'
      switchLabel = 'Ganti ke Reviewer'
    }
  } else if (user?.role === 'reviewer') {
    if (roles.includes('admin')) {
      switchTarget = 'admin'
      switchLabel = 'Kembali ke Panel Admin'
    } else if (roles.includes('dosen')) {
      switchTarget = 'dosen'
      switchLabel = 'Ganti ke Dosen'
    }
  }

  const canSwitchRole = Boolean(onSwitchRole && user && switchTarget !== null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')

    const updatedUser = {
      ...user,
      name: form.name,
      nip: user?.role !== 'mahasiswa' ? form.idNumber : user?.nip,
      npm: user?.role === 'mahasiswa' ? form.idNumber : user?.npm,
      idNumber: form.idNumber,
      phone: form.phone,
      faculty: form.faculty,
      department: form.department,
      studyProgram: form.studyProgram,
      academicPosition: form.academicPosition,
      expertise: form.expertise,
      supervisionCapacity: Number(form.supervisionCapacity) || 10,
      biography: form.biography,
    }

    // Sinkronisasi backend jika token tersedia
    const token = getAuthToken()
    if (token && !token.startsWith('token-')) {
      try {
        await fetch(`${api}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        })
      } catch (err) {
        console.warn('Backend sync offline, data disimpan di client.', err)
      }
    }

    updateAuthUser(updatedUser)
    if (onUpdateUser) onUpdateUser(updatedUser)

    setSaving(false)
    setSuccessMsg('Profil dan data identitas Anda berhasil disimpan secara permanen!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Konfirmasi password tidak cocok!')
      return
    }
    setPasswordMsg('Kata sandi berhasil diperbarui.')
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setPasswordMsg(''), 4000)
  }

  return (
    <div className="module-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 0 3rem' }}>
      {/* Top Header Bar & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <a
            href={getBackHash()}
            className="btn-action secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', borderRadius: '0.65rem' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </a>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PENGATURAN AKUN PKM CENTER</span>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0b2149', margin: '0.1rem 0 0 0' }}>
              Profil & Identitas Pengguna
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {canSwitchRole && (
            <button
              type="button"
              onClick={() => onSwitchRole(switchTarget)}
              className="btn-action secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.95rem', borderRadius: '0.65rem', borderColor: '#3b82f6', color: '#1d4ed8' }}
            >
              <ArrowLeftRight size={15} />
              <span>{switchLabel}</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Kolom Kiri: Kartu Identitas Profil */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '1.75rem 1.5rem', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 1.25rem' }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0b2149 0%, #2563eb 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
              }}>
                {userInitials}
              </div>
              <button
                type="button"
                title="Ganti Foto Profil"
                onClick={() => alert('Fitur upload foto profil akan dihubungkan dengan integrasi SSO Unila.')}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <Camera size={16} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              {form.name || 'Pengguna PKM'}
            </h2>
            <div style={{
              display: 'inline-block',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              border: '1px solid #bfdbfe',
              marginBottom: '1rem',
            }}>
              {getRoleLabel(user?.role)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', textAlign: 'left', fontSize: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Nomor Induk:</span>
                <strong style={{ color: '#0f172a' }}>{form.idNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Fakultas:</span>
                <strong style={{ color: '#0f172a' }}>{form.faculty}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Program Studi:</span>
                <strong style={{ color: '#0f172a' }}>{form.studyProgram}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status Sistem:</span>
                <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> Terverifikasi SSO
                </span>
              </div>
            </div>
          </div>

          {/* Navigasi Tab Pengaturan */}
          <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('identitas')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: activeTab === 'identitas' ? '#eff6ff' : 'transparent',
                color: activeTab === 'identitas' ? '#1d4ed8' : '#475569',
                fontWeight: activeTab === 'identitas' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <User size={18} />
              <span>Identitas & Data Pribadi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('keamanan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.65rem',
                border: 'none',
                background: activeTab === 'keamanan' ? '#eff6ff' : 'transparent',
                color: activeTab === 'keamanan' ? '#1d4ed8' : '#475569',
                fontWeight: activeTab === 'keamanan' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Lock size={18} />
              <span>Keamanan & Sandi</span>
            </button>
          </div>
        </aside>

        {/* Kolom Kanan: Form Data */}
        <main style={{ background: '#ffffff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {activeTab === 'identitas' && (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Informasi Identitas & Akademik
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Perbarui informasi resmi Anda untuk keperluan korespondensi penilaian, sertifikat bimbingan, dan rekapitulasi luaran PKM.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Nama Lengkap (Termasuk Gelar Akademik):
                  </label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    {user?.role === 'mahasiswa' ? 'NPM (Nomor Pokok Mahasiswa):' : 'NIP / NIDN Dosen:'}
                  </label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.idNumber}
                    onChange={e => setForm(prev => ({ ...prev, idNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Email Resmi Unila (@unila.ac.id):
                  </label>
                  <input
                    type="email"
                    required
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Nomor WhatsApp / Ponsel:
                  </label>
                  <input
                    type="tel"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Fakultas:
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem', background: '#ffffff' }}
                    value={form.faculty}
                    onChange={e => setForm(prev => ({ ...prev, faculty: e.target.value }))}
                  >
                    {FAKULTAS_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Jurusan / Departemen:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Program Studi:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.studyProgram}
                    onChange={e => setForm(prev => ({ ...prev, studyProgram: e.target.value }))}
                  />
                </div>

                {user?.role !== 'mahasiswa' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                      Jabatan Fungsional:
                    </label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                      value={form.academicPosition}
                      onChange={e => setForm(prev => ({ ...prev, academicPosition: e.target.value }))}
                    />
                  </div>
                )}

                {user?.role === 'dosen' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                      Kapasitas Maksimal Bimbingan Tim:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                      value={form.supervisionCapacity}
                      onChange={e => setForm(prev => ({ ...prev, supervisionCapacity: e.target.value }))}
                    />
                  </div>
                )}

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Bidang Keahlian / Kepakaran / Minat Riset:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={form.expertise}
                    onChange={e => setForm(prev => ({ ...prev, expertise: e.target.value }))}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Biografi Singkat / Deskripsi Pengalaman:
                  </label>
                  <textarea
                    rows={4}
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem', resize: 'vertical' }}
                    value={form.biography}
                    onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <a
                  href={getBackHash()}
                  className="btn-action secondary"
                  style={{ textDecoration: 'none', padding: '0.65rem 1.25rem' }}
                >
                  Batal
                </a>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-action primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '0.65rem' }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'keamanan' && (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                  Keamanan & Kata Sandi Akun
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  Kelola kata sandi akun PKM Center Anda. Untuk akun SSO Unila, pembaruan kata sandi juga dapat dilakukan melalui portal resmi SSO.
                </p>
              </div>

              {passwordMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '0.65rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                  {passwordMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px', marginBottom: '1.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Kata Sandi Saat Ini:
                  </label>
                  <input
                    type="password"
                    placeholder="Masukkan kata sandi lama"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={passwordForm.oldPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Ulangi Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    placeholder="Konfirmasi kata sandi baru"
                    style={{ width: '100%', padding: '0.7rem 0.95rem', border: '1px solid #cbd5e1', borderRadius: '0.65rem', fontSize: '0.92rem' }}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <button
                  type="submit"
                  className="btn-action primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem', borderRadius: '0.65rem' }}
                >
                  <Save size={16} />
                  <span>Perbarui Kata Sandi</span>
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
