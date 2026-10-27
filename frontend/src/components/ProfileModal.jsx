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
  X,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
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

export function ProfileModal({ user, onUpdateUser, onSwitchRole, onLogout, close }) {
  const [activeTab, setActiveTab] = useState('identitas') // 'identitas' | 'akademik'
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Form state initialized with user data or defaults
  const [form, setForm] = useState({
    name: user?.name || '',
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

  const canSwitchRole = Boolean(
    onSwitchRole &&
    user &&
    ((user.roles && user.roles.length > 1) || user.role === 'admin')
  )

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

    // Coba simpan ke backend jika token tersedia
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
        console.warn('Sync profil backend offline, menyimpan ke penyimpanan lokal:', err)
      }
    }

    // Simpan ke storage aktif & React state
    updateAuthUser(updatedUser)
    if (onUpdateUser) onUpdateUser(updatedUser)

    setSaving(false)
    setSuccessMsg('Profil dan identitas Anda berhasil diperbarui!')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  return (
    <div className="modal-backdrop" onMouseDown={close} style={{ zIndex: 9999 }}>
      <div
        className="profile-modal-card"
        onMouseDown={e => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          maxWidth: '680px',
          width: '94%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Profil */}
        <div style={{
          padding: '1.4rem 1.6rem 1.1rem',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.6), rgba(248, 250, 252, 0.8))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0b2149, #1e40af)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(11, 33, 73, 0.25)',
              flexShrink: 0,
            }}>
              {userInitials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {form.name || 'Profil Pengguna'}
                </h3>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                }}>
                  <ShieldCheck size={12} /> SSO Unila Aktif
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  Peran Aktif: {user?.role === 'dosen' ? 'Dosen Pembimbing' : user?.role === 'reviewer' ? 'Reviewer PKM' : user?.role}
                </span>
                {user?.roles && user.roles.length > 1 && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    (Hak akses: {user.roles.join(', ')})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="apple-sheet-close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              flexShrink: 0,
            }}
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Banner Switch Role Jika Akun Punya Hak Akses Ganda */}
        {canSwitchRole && (
          <div style={{
            background: user?.role === 'dosen' ? '#f5f3ff' : '#eff6ff',
            borderBottom: `1px solid ${user?.role === 'dosen' ? '#ede9fe' : '#dbeafe'}`,
            padding: '0.65rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: user?.role === 'dosen' ? '#6d28d9' : '#1d4ed8' }}>
              <ArrowLeftRight size={14} />
              <span>
                Akun ini memiliki hak akses <strong>Dosen</strong> dan <strong>Reviewer</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = user?.role === 'dosen' ? 'reviewer' : 'dosen'
                onSwitchRole(next)
              }}
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: user?.role === 'dosen' ? '#7c3aed' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              Beralih ke {user?.role === 'dosen' ? 'Reviewer' : 'Dosen'}
            </button>
          </div>
        )}

        {/* Tab Navigasi Modal */}
        <div style={{
          display: 'flex',
          padding: '0 1.6rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          gap: '1.25rem',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('identitas')}
            style={{
              padding: '0.75rem 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'identitas' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'identitas' ? '#1e40af' : '#64748b',
              fontWeight: activeTab === 'identitas' ? 700 : 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <User size={15} /> Identitas &amp; Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('akademik')}
            style={{
              padding: '0.75rem 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'akademik' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'akademik' ? '#1e40af' : '#64748b',
              fontWeight: activeTab === 'akademik' ? 700 : 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <GraduationCap size={15} /> Data Akademik &amp; Keahlian
          </button>
        </div>

        {/* Form Isi Profil */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{
            padding: '1.4rem 1.6rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}>
            {successMsg && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
              }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {activeTab === 'identitas' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Nama Lengkap (dengan Gelar) *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder="Contoh: Dr. Budi Santoso, S.T., M.T."
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>{user?.role === 'mahasiswa' ? 'NPM (Nomor Pokok Mahasiswa) *' : 'NIP / NIDN Pegawai *'}</span>
                    <input
                      type="text"
                      value={form.idNumber}
                      onChange={e => setForm({ ...form, idNumber: e.target.value })}
                      required
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder="Contoh: 197508122001121002"
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Email Akun Unila (@unila.ac.id)</span>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.88rem',
                        color: '#64748b',
                        background: '#f8fafc',
                        cursor: 'not-allowed',
                      }}
                    />
                    <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Email terhubung dengan SSO Unila dan tidak dapat diubah bebas.</small>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Nomor WhatsApp / Kontak Aktif *</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder="0812-xxxx-xxxx"
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  <span>Biodata / Pengantar Profil Singkat</span>
                  <textarea
                    rows={3}
                    value={form.biography}
                    onChange={e => setForm({ ...form, biography: e.target.value })}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                    placeholder="Tuliskan ringkasan pengalaman atau pengantar singkat Anda..."
                  />
                </label>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Fakultas *</span>
                    <select
                      value={form.faculty}
                      onChange={e => setForm({ ...form, faculty: e.target.value })}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      {FAKULTAS_OPTIONS.map(fak => (
                        <option key={fak} value={fak}>{fak}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Jurusan / Departemen *</span>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      required
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder="Contoh: Teknik Elektro"
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>Program Studi *</span>
                    <input
                      type="text"
                      value={form.studyProgram}
                      onChange={e => setForm({ ...form, studyProgram: e.target.value })}
                      required
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder="Contoh: S1 Teknik Elektro"
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    <span>{user?.role === 'mahasiswa' ? 'Status Akademik' : 'Jabatan Akademik / Fungsional'}</span>
                    <input
                      type="text"
                      value={form.academicPosition}
                      onChange={e => setForm({ ...form, academicPosition: e.target.value })}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        outline: 'none',
                      }}
                      placeholder={user?.role === 'mahasiswa' ? 'Contoh: Mahasiswa Aktif 2021' : 'Contoh: Lektor Kepala / Guru Besar'}
                    />
                  </label>
                </div>

                {user?.role !== 'mahasiswa' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      <span>Kapasitas Kuota Bimbingan (Maksimal Tim)</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={form.supervisionCapacity}
                        onChange={e => setForm({ ...form, supervisionCapacity: e.target.value })}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Batas maksimal tim yang dapat disetujui dalam periode PKM 2026.</small>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      <span>Fokus Bidang Keahlian / Minat Riset PKM</span>
                      <input
                        type="text"
                        value={form.expertise}
                        onChange={e => setForm({ ...form, expertise: e.target.value })}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                        placeholder="Contoh: IoT, Energi Terbarukan, AI"
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Aksi Modal */}
          <div style={{
            padding: '1rem 1.6rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.4rem 0',
              }}
            >
              Keluar dari Akun
            </button>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={close}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn-masuk"
                style={{
                  minHeight: '2.4rem',
                  padding: '0 1.3rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Save size={15} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
