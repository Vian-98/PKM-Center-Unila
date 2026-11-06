import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NewsIndex, NewsDetail } from './pages/News'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { PedomanIndex } from './pages/Pedoman'
import { PortofolioIndex } from './pages/Portofolio'
import { KontakPage } from './pages/Kontak'
import { AdminPanel } from './pages/AdminPanel'
import { AdminAkunDashboard } from './pages/AdminAkunDashboard'
import { DosenDashboard } from './pages/DosenDashboard'
import { ReviewerDashboard } from './pages/ReviewerDashboard'
import { PesanFeedback } from './pages/PesanFeedback'
import { MahasiswaDashboard } from './pages/MahasiswaDashboard'
import { AjukanProposal } from './pages/AjukanProposal'
import { LogbookPKM } from './pages/LogbookPKM'
import { CekStatusUsulan } from './pages/CekStatusUsulan'
import { IdeaLab } from './pages/IdeaLab'
import { CariTim } from './pages/CariTim'
import { TeamManagement } from './pages/TeamManagement'
import { AppleMobileDock } from './components/AppleMobileDock'
import { DesktopSidebarLayout } from './components/DesktopSidebarLayout'
import { ProfilePage } from './pages/ProfilePage'
import { api } from './lib/content'
import {
  getAuthToken,
  getAuthUser,
  setAuthSession,
  updateAuthUser,
  updateAuthToken,
  clearAuthSession,
  recordAuthActivity,
  checkAuthInactivity,
} from './lib/authSession'
import './styles.css'
import './ref.css'
import './modules.css'

// Bersihkan seluruh riwayat chat & pesan di semua akun (Mahasiswa, Dosen, Reviewer, Admin)
try {
  const PURGE_KEY = 'pkm_chat_purge_2026_v5_clean'
  if (localStorage.getItem(PURGE_KEY) !== 'done') {
    localStorage.setItem(PURGE_KEY, 'done')
    localStorage.setItem('pkm_master_direct_messages', '[]')
    localStorage.setItem('pkm_proposal_feedback', '[]')
    localStorage.removeItem('pkm_custom_contacts')
    localStorage.removeItem('pkm_target_chat_contact')
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('pkmate_chat_history_') || k.startsWith('pkm_master_direct_messages')) {
        localStorage.removeItem(k)
      }
    })
  }
} catch (e) {
  console.warn('Gagal membersihkan cache chat:', e)
}

function Brand({ dark = false }) {
  return (
    <a className={`brand ${dark ? 'brand-dark' : ''}`} href="#beranda" aria-label="PKM Center Universitas Lampung">
      <img className="brand-logo brand-logo-unila" src="/Logo-2016-Unila.png" alt="Logo Universitas Lampung" />
      <img className="brand-logo" src="/logo-pkm-center.png" alt="Logo PKM Center Universitas Lampung" />
      <span className="brand-text">PKM CENTER<small>UNIVERSITAS LAMPUNG</small></span>
    </a>
  )
}

// Navigasi Publik untuk Pengunjung yang Belum Login
const NAV_GUEST = [
  ['beranda', 'Beranda'],
  ['tentang', 'Tentang PKM'],
  ['timeline', 'Timeline'],
  ['pkmate', 'PKMATE (AI)'],
  ['berita', 'Berita'],
  ['pedoman', 'Panduan'],
  ['galeri', 'Galeri'],
  ['kontak', 'Kontak'],
]

// Navigasi Setelah Login: selalu menampilkan menu publik (guest) seperti sebelum login,
// ditambah opsi "Portal" di ujung kanan yang mengarahkan ke dashboard sesuai role pengguna.
function getNavItems(user) {
  if (!user) return NAV_GUEST

  const portalByRole = {
    admin: ['admin', 'Portal Administrator'],
    admin_akun: ['admin-akun', 'Portal Admin Akun'],
    dosen: ['dosen', 'Portal Dosen'],
    reviewer: ['reviewer', 'Portal Reviewer'],
    mahasiswa: ['mahasiswa', 'Portal Mahasiswa'],
  }

  const portal = portalByRole[user.role] || ['beranda', 'Portal']

  return [...NAV_GUEST, portal]
}

function getRoleLabel(role) {
  switch (role) {
    case 'admin_akun': return 'Admin Akun'
    case 'dosen': return 'Dosen Pembimbing'
    case 'reviewer': return 'Reviewer PKM'
    case 'admin': return 'Administrator'
    case 'mahasiswa': return 'Mahasiswa'
    default: return 'Pengguna'
  }
}

function TopNavbar({ active, user, isDashboard, onLogin, onLogout, onSwitchRole, onOpenProfile }) {
  const navItems = getNavItems(user)
  const isActive = (id) => {
    if (id === active) return true
    if (id === 'pedoman' && active === 'pedoman') return true
    if (id === 'mahasiswa' && active === 'mahasiswa') return true
    if (id === 'dosen' && active === 'dosen') return true
    if (id === 'reviewer' && active === 'reviewer') return true
    if (id === 'admin' && active === 'admin') return true
    if ((id === 'admin-akun' || id === 'admin_akun') && (active === 'admin-akun' || active === 'admin_akun')) return true
    return false
  }

  // Inisial avatar pengguna
  const userInitials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  // Periksa apakah pengguna memiliki hak akses multi-peran (misal Dosen yang juga Reviewer)
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

  return (
    <header className="site-header topnav apple-topnav">
      <Brand />

      {/* Navigasi Desktop Penuh: Hanya muncul di Halaman Publik Non-Dashboard (Di Dashboard, navigasi terpusat di Sidebar) */}
      {!isDashboard ? (
        <nav className="topnav-links" aria-label="Navigasi utama">
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={`topnav-link ${isActive(id) ? 'active' : ''}`}
              aria-current={isActive(id) ? 'page' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      ) : (
        <div className="dashboard-topnav-badge-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#0071e3',
            background: 'rgba(0, 113, 227, 0.08)',
            border: '1px solid rgba(0, 113, 227, 0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {user?.role === 'admin_akun' ? 'Portal Admin Akun' : user?.role === 'dosen' ? 'Portal Dosen Pembimbing' : user?.role === 'reviewer' ? 'Portal Reviewer PKM' : user?.role === 'admin' ? 'Portal Administrator' : 'Portal Mahasiswa PKM'}
          </span>
        </div>
      )}

      {/* Aksi Akun di Kanan */}
      <div className="topnav-actions">
        {user ? (
          <div className="account-actions">
            {/* Chip Profil Pengguna Interaktif (Dapat Diklik untuk Membuka & Mengedit Profil) */}
            <button
              type="button"
              className="nav-user-chip"
              onClick={onOpenProfile}
              title={`Klik untuk melihat & mengedit profil akun (${user.name})`}
              aria-label="Buka Profil Pengguna"
            >
              <div className="nav-user-avatar">{userInitials}</div>
              <div className="nav-user-meta">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-role-badge">{getRoleLabel(user.role)}</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ marginLeft: '0.1rem', flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Tombol Switch Role - Hanya muncul bagi pengguna dengan multi-peran */}
            {canSwitchRole && (
              <button
                type="button"
                onClick={() => onSwitchRole(switchTarget)}
                className={`nav-switch-role-btn ${switchTarget === 'dosen' ? 'to-reviewer' : 'to-dosen'}`}
                title={switchLabel}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
                <span>{switchLabel}</span>
              </button>
            )}

            <button
              type="button"
              className="nav-logout-btn"
              onClick={onLogout}
              title="Keluar dari akun"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <button className="btn-masuk" onClick={onLogin}>Masuk <b>&rarr;</b></button>
        )}
      </div>
    </header>
  )
}

const DEMO_ACCOUNTS = [
  { label: 'Admin Akun (Verifikasi KTM)', email: 'admin.akun@pkm.unila.ac.id', pass: 'adminakun123', desc: 'Verifikasi & ACC Akun Mahasiswa Baru' },
  { label: 'Mhs Baru (Pending ACC)', email: 'dimas.aditya@student.unila.ac.id', pass: 'mhs12345', desc: 'Dimas Aditya • Menunggu Validasi KTM' },
  { label: 'Mhs (KTM Ditolak)', email: 'riko.prasetyo@student.unila.ac.id', pass: 'mhs12345', desc: 'Riko Prasetyo • Ditolak: KTM Buram' },
  { label: 'Mahasiswa (Nadia - Demo)', email: 'mahasiswa@pkm.unila.ac.id', pass: 'mahasiswa123', desc: 'Nadia Putri • S1 Teknik Elektro (NPM 2117051001)' },
  { label: 'Mahasiswa 1 (FMIPA)', email: 'mhs1@pkm.unila.ac.id', pass: 'mahasiswa123', desc: 'Favian Pratama • Ilmu Komputer (NPM 2217051001)' },
  { label: 'Mahasiswa 2 (Teknik)', email: 'mhs2@pkm.unila.ac.id', pass: 'mahasiswa123', desc: 'Ahmad Fauzi • Teknik Informatika (NPM 2215061002)' },
  { label: 'Mahasiswa 3 (Pertanian)', email: 'mhs3@pkm.unila.ac.id', pass: 'mahasiswa123', desc: 'Siti Nurhaliza • Agribisnis (NPM 2114131003)' },
  { label: 'Dosen Pembimbing (Saja)', email: 'dosen@pkm.unila.ac.id', pass: 'dosen123', desc: 'Hanya Bimbingan (Bukan Reviewer)' },
  { label: 'Dosen & Reviewer (Multi-Peran)', email: 'dosen.reviewer@pkm.unila.ac.id', pass: 'dosen123', desc: 'Bisa Switch Role Dosen ⇄ Reviewer' },
  { label: 'Reviewer (Khusus)', email: 'reviewer@pkm.unila.ac.id', pass: 'reviewer123', desc: 'Penilai Proposal PKM' },
  { label: 'Admin Kampus', email: 'admin@pkm.unila.ac.id', pass: 'admin123', desc: 'Pengelola PKM Center' },
]

function LoginModal({ close, complete }) {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [state, setState] = useState({ loading: false, error: null }) // error can be { type: 'pending'|'rejected'|'general', message, reason }

  // State untuk form registrasi mahasiswa baru
  const [regForm, setRegForm] = useState({
    name: '',
    npm: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    faculty: 'FMIPA',
    studyProgram: '',
    entryYear: '2024',
    ktmFile: null,
    ktmPreview: null,
  })
  const [regLoading, setRegLoading] = useState(false)
  const [regLoadingText, setRegLoadingText] = useState('')
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState(false)

  // Handle file KTM change
  const handleKtmChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setRegError('Berkas KTM harus berupa file gambar (JPG, PNG, atau WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setRegError('Ukuran berkas KTM maksimal 5 MB.')
      return
    }
    setRegError('')
    const previewUrl = URL.createObjectURL(file)
    setRegForm(prev => ({ ...prev, ktmFile: file, ktmPreview: previewUrl }))
  }

  // Handle register submit
  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')

    if (!regForm.name || !regForm.npm || !regForm.email || !regForm.password || !regForm.phone || !regForm.studyProgram) {
      setRegError('Harap lengkapi semua data wajib pada formulir.')
      return
    }

    if (regForm.password.length < 6) {
      setRegError('Kata sandi minimal 6 karakter.')
      return
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    if (!regForm.ktmFile) {
      setRegError('Foto Kartu Tanda Mahasiswa (KTM) wajib diunggah untuk verifikasi Admin Akun.')
      return
    }

    setRegLoading(true)
    let ktmUrl = ''

    try {
      // Step 1: Upload Foto KTM ke server
      setRegLoadingText('Mengunggah foto KTM...')
      const formData = new FormData()
      formData.append('ktm', regForm.ktmFile)

      const uploadRes = await fetch(`${api}/auth/upload-ktm`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json().catch(() => ({}))
      const ktmUrl = uploadData?.ktm_url || uploadData?.url || uploadData?.ktmUrl || ''
      if (!uploadRes.ok || !ktmUrl) {
        throw new Error(uploadData?.message || 'Gagal mengunggah foto KTM ke server.')
      }

      // Step 2: Kirim data registrasi ke backend & database
      setRegLoadingText('Menyimpan data pendaftaran ke database...')
      const regRes = await fetch(`${api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name.trim(),
          npm: regForm.npm.trim(),
          student_number: regForm.npm.trim(),
          email: regForm.email.trim(),
          password: regForm.password,
          phone: regForm.phone.trim(),
          faculty: regForm.faculty,
          department: regForm.studyProgram.trim(),
          studyProgram: regForm.studyProgram.trim(),
          study_program: regForm.studyProgram.trim(),
          entryYear: parseInt(regForm.entryYear, 10) || 2024,
          entry_year: parseInt(regForm.entryYear, 10) || 2024,
          ktmUrl: ktmUrl,
          ktm_url: ktmUrl,
        }),
      })

      const regResult = await regRes.json().catch(() => ({}))
      if (regRes.ok) {
        setRegSuccess(true)
      } else {
        throw new Error(regResult?.message || 'Gagal menyimpan pendaftaran ke database.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setRegError(err.message || 'Terjadi kesalahan saat pendaftaran. Silakan periksa kembali data Anda.')
    } finally {
      setRegLoading(false)
      setRegLoadingText('')
    }
  }

  // Handle login submit
  const login = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      setState({ loading: false, error: { type: 'general', message: 'Harap isi akun dan kata sandi.' } })
      return
    }
    setState({ loading: true, error: null })
    let loggedUser = null
    let authToken = ''

    try {
      const response = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      })
      const result = await response.json()

      if (response.ok && result?.user) {
        loggedUser = result.user
        authToken = result.token
      } else if (response.status === 403 && (result?.status === 'pending' || (result?.message && result.message.includes('verifikasi')))) {
        // Akun belum di-ACC oleh Admin Akun
        setState({
          loading: false,
          error: {
            type: 'pending',
            message: result?.message || 'Akun Anda masih dalam proses verifikasi KTM oleh Admin Akun PKM Center. Mohon tunggu hingga akun Anda di-ACC.'
          }
        })
        return
      } else if (response.status === 403 && (result?.status === 'rejected' || (result?.message && result.message.includes('ditolak')))) {
        // Akun ditolak oleh Admin Akun
        setState({
          loading: false,
          error: {
            type: 'rejected',
            message: result?.message || 'Pendaftaran akun Anda ditolak oleh Admin Akun.',
            reason: result?.rejection_reason || 'Foto KTM tidak valid / data tidak sesuai.'
          }
        })
        return
      } else {
        throw new Error(result?.message || 'Identitas atau kata sandi tidak sesuai.')
      }
    } catch (networkErr) {
      // Periksa jika ini pesan penolakan / pending dari error langsung
      if (networkErr.message && networkErr.message.includes('verifikasi')) {
        setState({
          loading: false,
          error: { type: 'pending', message: networkErr.message }
        })
        return
      }
      if (networkErr.message && networkErr.message.includes('ditolak')) {
        setState({
          loading: false,
          error: { type: 'rejected', message: networkErr.message }
        })
        return
      }

      // Deteksi otomatis peran pengguna berdasarkan akun login (fallback offline)
      const raw = form.email.trim()
      const e = raw.toLowerCase()

      // Demo akun pending
      if (e.includes('dimas.aditya') || e === '2217051050') {
        setState({
          loading: false,
          error: {
            type: 'pending',
            message: 'Akun Anda masih dalam proses verifikasi KTM oleh Admin Akun PKM Center. Mohon tunggu hingga akun Anda di-ACC sebelum dapat masuk.'
          }
        })
        return
      }

      // Demo akun ditolak
      if (e.includes('riko.prasetyo') || e === '2215061099') {
        setState({
          loading: false,
          error: {
            type: 'rejected',
            message: 'Pendaftaran akun Anda ditolak oleh Admin Akun PKM Center.',
            reason: 'Foto KTM buram dan nomor pokok mahasiswa tidak terbaca jelas. Harap unggah ulang dengan foto KTM asli.'
          }
        })
        return
      }

      let role = 'mahasiswa'
      let name = 'Mahasiswa Unila'
      let roles = ['mahasiswa']
      let studentNumber = ''

      if (e.includes('admin.akun') || e.includes('adminakun')) {
        role = 'admin_akun'
        name = 'Admin Akun PKM Center'
        roles = ['admin_akun']
      } else if (e.includes('dosen.reviewer') || e.includes('sri') || (e.includes('dosen') && e.includes('reviewer'))) {
        role = 'dosen'
        name = 'Dr. Ir. Sri Mulyani, M.T.'
        roles = ['dosen', 'reviewer']
      } else if (e.includes('dosen') || e.includes('budi') || /^19\d{8,}/.test(e)) {
        role = 'dosen'
        name = 'Dr. Budi Santoso, S.T., M.T.'
        roles = ['dosen']
      } else if (e.includes('reviewer') || e.includes('hendri') || e.startsWith('rev')) {
        role = 'reviewer'
        name = 'Dr. Hendri Reviewer, M.Kom.'
        roles = ['reviewer']
      } else if (e.includes('admin')) {
        role = 'admin'
        name = 'Admin PKM Center'
        roles = ['admin', 'dosen', 'reviewer']
      } else if (e.includes('mhs1') || e.includes('favian') || e === '2217051001') {
        role = 'mahasiswa'
        name = 'Favian Rifqi Pratama'
        roles = ['mahasiswa']
        studentNumber = '2217051001'
      } else if (e.includes('mhs2') || e.includes('ahmad') || e === '2215061002') {
        role = 'mahasiswa'
        name = 'Ahmad Fauzi'
        roles = ['mahasiswa']
        studentNumber = '2215061002'
      } else if (e.includes('mhs3') || e.includes('siti') || e === '2114131003') {
        role = 'mahasiswa'
        name = 'Siti Nurhaliza'
        roles = ['mahasiswa']
        studentNumber = '2114131003'
      } else if (e.includes('mahasiswa') || e.includes('nadia') || e === '2117051001') {
        role = 'mahasiswa'
        name = 'Nadia Putri Maharani'
        roles = ['mahasiswa']
        studentNumber = '2117051001'
      } else {
        role = 'mahasiswa'
        name = raw.includes('@') ? raw.split('@')[0].replace(/[._-]/g, ' ').toUpperCase() : `Mahasiswa (${raw})`
        roles = ['mahasiswa']
        studentNumber = /^\d+$/.test(raw) ? raw : ''
      }

      const safeId = e.replace(/[^a-z0-9]/gi, '_')
      loggedUser = {
        id: `user-${safeId}`,
        name,
        email: form.email.includes('@') ? form.email : `${form.email}@pkm.unila.ac.id`,
        studentNumber,
        role,
        roles,
      }
      authToken = `token-${safeId}`
    }

    if (loggedUser) {
      if (!loggedUser.roles) {
        loggedUser.roles = [loggedUser.role]
      }
      setAuthSession(loggedUser, authToken, remember)
      complete(loggedUser)
      close()

      // Redirect otomatis ke modul dashboard sesuai role akun
      if (loggedUser.role === 'admin_akun') window.location.hash = '#admin-akun'
      else if (loggedUser.role === 'admin') window.location.hash = '#admin'
      else if (loggedUser.role === 'dosen') window.location.hash = '#dosen'
      else if (loggedUser.role === 'reviewer') window.location.hash = '#reviewer'
      else window.location.hash = '#mahasiswa'
    } else {
      setState({
        loading: false,
        error: { type: 'general', message: 'Identitas atau kata sandi tidak sesuai.' }
      })
    }
  }

  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={close}>
      <section
        className="login-card apple-card-glass"
        style={{
          width: tab === 'register' ? 'min(100%, 34rem)' : 'min(100%, 28rem)',
          transition: 'width 0.2s ease',
          maxWidth: '94vw'
        }}
        onMouseDown={event => event.stopPropagation()}
        aria-label="Masuk ke PKM Center"
      >
        <div className="login-head">
          <div className="login-brand">
            <img src="/Logo-2016-Unila.png" alt="Logo Universitas Lampung" />
            <img src="/logo-pkm-center.png" alt="Logo PKM Center" />
            <span>PKM CENTER<small>UNIVERSITAS LAMPUNG</small></span>
          </div>
          <button className="login-x" onClick={close} aria-label="Tutup">x</button>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Mahasiswa */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          marginTop: '1rem',
          marginBottom: '1rem',
          background: '#f1f5f9',
          padding: '0.25rem',
          borderRadius: '0.65rem',
          border: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setState({ loading: false, error: null }); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: tab === 'login' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: tab === 'login' ? '#ffffff' : 'transparent',
              color: tab === 'login' ? '#0f172a' : '#64748b',
              boxShadow: tab === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Masuk ke Akun
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setRegError(''); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: tab === 'register' ? 700 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: tab === 'register' ? '#ffffff' : 'transparent',
              color: tab === 'register' ? '#0071e3' : '#64748b',
              boxShadow: tab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <span>Daftar Mahasiswa</span>
            <span style={{
              fontSize: '0.62rem',
              background: tab === 'register' ? '#e0f2fe' : '#e2e8f0',
              color: tab === 'register' ? '#0284c7' : '#64748b',
              padding: '0.1rem 0.35rem',
              borderRadius: '999px',
              fontWeight: 700
            }}>
              KTM
            </span>
          </button>
        </div>

        {/* ── TAB 1: FORM MASUK (LOGIN) ────────────────────────── */}
        {tab === 'login' && (
          <>
            <p className="login-eyebrow">PORTAL DIGITAL</p>
            <h2>Masuk ke Akun PKM</h2>
            <p className="login-sub">
              Sistem memvalidasi status akun secara otomatis. Akun mahasiswa baru harus diverifikasi dan di-ACC oleh Admin Akun terlebih dahulu.
            </p>

            {/* Banner Peringatan Akun Pending (Menunggu ACC) */}
            {state.error?.type === 'pending' && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                margin: '0.85rem 0',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.9rem'
                }}>
                  ⏳
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                    Akun Menunggu Verifikasi Admin
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350f', lineHeight: 1.45 }}>
                    {state.error.message}
                  </p>
                </div>
              </div>
            )}

            {/* Banner Peringatan Akun Ditolak */}
            {state.error?.type === 'rejected' && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                margin: '0.85rem 0',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.9rem'
                }}>
                  ✕
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', fontWeight: 700, color: '#991b1b' }}>
                    Pendaftaran Akun Ditolak
                  </h4>
                  <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.45 }}>
                    {state.error.message}
                  </p>
                  {state.error.reason && (
                    <div style={{
                      background: 'rgba(255,255,255,0.7)',
                      borderLeft: '3px solid #dc2626',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.74rem',
                      color: '#991b1b'
                    }}>
                      <strong>Alasan:</strong> {state.error.reason}
                    </div>
                  )}
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.72rem', color: '#b91c1c' }}>
                    Silakan daftar ulang dengan foto KTM asli yang jelas atau hubungi Admin Akun PKM Center.
                  </p>
                </div>
              </div>
            )}

            {/* Error General */}
            {state.error?.type === 'general' && (
              <p className="error" style={{ margin: '0.5rem 0 0.75rem' }}>{state.error.message}</p>
            )}

            <form onSubmit={login}>
              <label>NPM / NIP / Email Akun
                <input
                  type="text"
                  placeholder="nama@pkm.unila.ac.id atau NPM"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>
              <label>Kata Sandi
                <input
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={form.password}
                  onChange={event => setForm({ ...form, password: event.target.value })}
                  required
                />
              </label>
              <div className="login-row">
                <label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat saya</label>
                <button type="button" className="link" onClick={() => window.alert('Fitur pemulihan kata sandi dapat menghubungi admin PKM Center.')}>Lupa kata sandi?</button>
              </div>
              <button className="btn-primary login-submit" disabled={state.loading}>
                {state.loading ? 'Memeriksa Status Akun...' : 'Masuk ke Sistem'} <b>&rarr;</b>
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pilih Cepat Akun Demo (Uji Coba Sistem):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => {
                      setForm({ email: acc.email, password: acc.pass })
                      setState({ loading: false, error: null })
                    }}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.74rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${form.email === acc.email ? '#2563eb' : '#cbd5e1'}`,
                      background: form.email === acc.email ? '#eff6ff' : '#f8fafc',
                      color: form.email === acc.email ? '#1e40af' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem'
                    }}
                  >
                    <strong style={{ fontSize: '0.76rem' }}>{acc.label}</strong>
                    <span style={{ fontSize: '0.67rem', color: '#64748b' }}>{acc.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="login-sso" style={{ marginTop: '1rem' }}>INTEGRASI SSO UNIVERSITAS LAMPUNG</p>
          </>
        )}

        {/* ── TAB 2: REGISTRASI MAHASISWA BARU (UPLOAD KTM) ───── */}
        {tab === 'register' && (
          <div>
            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1.8rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Pendaftaran Berhasil Terkirim!
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                  Akun mahasiswa atas nama <strong>{regForm.name}</strong> ({regForm.npm}) telah berhasil didaftarkan ke sistem PKM Center.
                </p>

                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>⏳</span>
                    <strong style={{ fontSize: '0.84rem', color: '#92400e' }}>
                      Status: Menunggu Verifikasi Foto KTM
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#78350f', margin: 0, lineHeight: 1.45 }}>
                    Admin Akun akan memvalidasi keaslian data akademik dan foto KTM yang Anda unggah. Anda baru dapat melakukan login setelah akun disetujui (di-ACC).
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setTab('login')
                    setForm({ email: regForm.email, password: regForm.password })
                    setRegSuccess(false)
                  }}
                >
                  Masuk ke Form Login &rarr;
                </button>
              </div>
            ) : (
              <div>
                <p className="login-eyebrow">PENDAFTARAN MAHASISWA</p>
                <h2>Daftar Akun PKM</h2>
                <p className="login-sub">
                  Isi data akademik dan unggah foto Kartu Tanda Mahasiswa (KTM) asli untuk diverifikasi oleh Admin Akun PKM Center.
                </p>

                {regError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.6rem',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.85rem',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span>⚠️</span>
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  {/* Grid 2 Kolom: Nama & NPM */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <label>Nama Lengkap
                      <input
                        type="text"
                        placeholder="Contoh: Dimas Aditya"
                        value={regForm.name}
                        onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                        required
                      />
                    </label>
                    <label>NPM (Nomor Pokok Mahasiswa)
                      <input
                        type="text"
                        placeholder="Contoh: 2317051050"
                        value={regForm.npm}
                        onChange={e => setRegForm({ ...regForm, npm: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  {/* Grid 2 Kolom: Email & No WA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <label>Email Mahasiswa / Akun
                      <input
                        type="email"
                        placeholder="nama@student.unila.ac.id"
                        value={regForm.email}
                        onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                        required
                      />
                    </label>
                    <label>No. WhatsApp / HP
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={regForm.phone}
                        onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  {/* Grid 2 Kolom: Fakultas & Prodi */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <label>Fakultas
                      <select
                        value={regForm.faculty}
                        onChange={e => setRegForm({ ...regForm, faculty: e.target.value })}
                        style={{
                          border: '1px solid rgba(18,59,102,.15)',
                          background: 'rgba(255,255,255,.75)',
                          borderRadius: '12px',
                          padding: '0.7rem 0.95rem',
                          fontSize: '0.85rem',
                          width: '100%'
                        }}
                      >
                        <option value="FMIPA">FMIPA (MIPA)</option>
                        <option value="Fakultas Teknik">Fakultas Teknik (FT)</option>
                        <option value="Fakultas Pertanian">Fakultas Pertanian (FP)</option>
                        <option value="Fakultas Kedokteran">Fakultas Kedokteran (FK)</option>
                        <option value="Fakultas Ekonomi dan Bisnis">FEB (Ekonomi & Bisnis)</option>
                        <option value="Fakultas Hukum">Fakultas Hukum (FH)</option>
                        <option value="Fakultas Ilmu Sosial dan Ilmu Politik">FISIP (Sosial & Politik)</option>
                        <option value="Fakultas Keguruan dan Ilmu Pendidikan">FKIP (Keguruan & Pendidikan)</option>
                        <option value="Pascasarjana">Pascasarjana</option>
                      </select>
                    </label>
                    <label>Program Studi
                      <input
                        type="text"
                        placeholder="Contoh: S1 Ilmu Komputer"
                        value={regForm.studyProgram}
                        onChange={e => setRegForm({ ...regForm, studyProgram: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  {/* Grid 3 Kolom: Angkatan, Password, Konfirmasi */}
                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.1fr 1.1fr', gap: '0.65rem' }}>
                    <label>Angkatan
                      <select
                        value={regForm.entryYear}
                        onChange={e => setRegForm({ ...regForm, entryYear: e.target.value })}
                        style={{
                          border: '1px solid rgba(18,59,102,.15)',
                          background: 'rgba(255,255,255,.75)',
                          borderRadius: '12px',
                          padding: '0.7rem 0.5rem',
                          fontSize: '0.85rem',
                          width: '100%'
                        }}
                      >
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                      </select>
                    </label>
                    <label>Kata Sandi
                      <input
                        type="password"
                        placeholder="Min. 6 digit"
                        value={regForm.password}
                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                    </label>
                    <label>Ulangi Sandi
                      <input
                        type="password"
                        placeholder="Ulangi sandi"
                        value={regForm.confirmPassword}
                        onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  {/* UPLOAD FOTO KTM (WAJIB) */}
                  <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#102a43', marginBottom: '0.35rem' }}>
                      Foto Kartu Tanda Mahasiswa (KTM) <span style={{ color: '#ef4444' }}>*Wajib</span>
                    </label>

                    {regForm.ktmPreview ? (
                      <div style={{
                        position: 'relative',
                        border: '2px solid #2563eb',
                        borderRadius: '0.75rem',
                        padding: '0.5rem',
                        background: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <img
                          src={regForm.ktmPreview}
                          alt="Pratinjau KTM"
                          style={{ width: '80px', height: '52px', objectFit: 'cover', borderRadius: '0.4rem', border: '1px solid #bfdbfe' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 0.15rem 0', fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {regForm.ktmFile?.name}
                          </p>
                          <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
                            {regForm.ktmFile ? `${(regForm.ktmFile.size / 1024).toFixed(1)} KB` : ''} • Siap diverifikasi Admin Akun
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRegForm(prev => ({ ...prev, ktmFile: null, ktmPreview: null }))}
                          style={{
                            border: 'none',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '0.4rem',
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Ganti
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #93c5fd',
                        borderRadius: '0.75rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}>
                        <div style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>🪪</div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8' }}>
                          Pilih / Unggah Foto KTM Asli
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          Format JPG, PNG, atau WEBP (Maksimal 5 MB). Pastikan Nama & NPM terbaca jelas.
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleKtmChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    className="btn-primary login-submit"
                    disabled={regLoading}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {regLoading ? (regLoadingText || 'Mendaftarkan...') : 'Kirim Pendaftaran & Foto KTM'} <b>&rarr;</b>
                  </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '0.85rem' }}>
                  Sudah memiliki akun terverifikasi?{' '}
                  <button
                    type="button"
                    className="link"
                    onClick={() => { setTab('login'); setState({ loading: false, error: null }); }}
                    style={{ fontWeight: 700, color: '#0071e3', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Brand dark />
          <p>Platform digital manajemen Program Kreativitas Mahasiswa Universitas Lampung.</p>
        </div>
        <p className="footer-copy">(c) 2025 Universitas Lampung</p>
      </div>
    </footer>
  )
}

function App() {
  const [hash, setHash] = useState(window.location.hash || '#beranda')
  const [modal, setModal] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      // Pengecekan inaktivitas 30 menit saat aplikasi dimuat
      if (checkAuthInactivity(30)) {
        clearAuthSession()
        return null
      }
      // Ambil user dari sessionStorage (jika tidak ingat saya) atau localStorage (jika ingat saya dicentang)
      const parsed = getAuthUser()
      if (!parsed) return null
      if (!parsed.roles) {
        if (parsed.role === 'dosen') {
          parsed.roles = (parsed.email?.includes('dosen.reviewer') || parsed.email?.includes('sri'))
            ? ['dosen', 'reviewer']
            : ['dosen']
        } else if (parsed.role === 'reviewer') {
          parsed.roles = ['reviewer']
        } else if (parsed.role === 'admin') {
          parsed.roles = ['admin', 'dosen', 'reviewer']
        } else {
          parsed.roles = [parsed.role || 'mahasiswa']
        }
      }
      return parsed
    } catch {
      return null
    }
  })

  // Daftar rute portal berdasarkan role, semua sub-halaman sekarang berada di bawah prefix role
  const ROLE_ROUTE_MAP = {
    mahasiswa: 'mahasiswa',
    dosen: 'dosen',
    reviewer: 'reviewer',
    admin: 'admin',
    admin_akun: 'admin-akun',
    'admin-akun': 'admin-akun',
  }

  useEffect(() => {
    const listen = () => {
      setHash(window.location.hash || '#beranda')
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    window.addEventListener('hashchange', listen)
    return () => window.removeEventListener('hashchange', listen)
  }, [])

  // Session guard: Proteksi halaman portal, setiap role hanya bisa mengakses portal miliknya
  useEffect(() => {
    const currentRoute = (window.location.hash || '#beranda').replace('#', '').split('/')[0].toLowerCase()
    const protectedRoles = ['mahasiswa', 'dosen', 'reviewer', 'admin', 'admin-akun', 'admin_akun']
    if (protectedRoles.includes(currentRoute)) {
      if (!user) {
        // Belum login → redirect ke beranda dan tampilkan peringatan
        window.location.hash = '#beranda'
        setTimeout(() => {
          alert('⚠️ Anda harus login terlebih dahulu untuk mengakses halaman ini.')
        }, 100)
        return
      }
      const allowedRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role]
      const targetRoleKey = (currentRoute === 'admin-akun' || currentRoute === 'admin_akun') ? 'admin_akun' : currentRoute
      const userHasAccess = allowedRoles.includes(targetRoleKey) || user.role === targetRoleKey || (targetRoleKey === 'admin_akun' && (allowedRoles.includes('admin') || user.role === 'admin'))

      if (!userHasAccess) {
        // Sudah login tapi bukan role yang sesuai → redirect ke beranda
        window.location.hash = '#beranda'
        setTimeout(() => {
          alert('⚠️ Halaman ini hanya dapat diakses oleh akun ' + getRoleLabel(targetRoleKey) + '. Anda login sebagai ' + getRoleLabel(user.role) + '.')
        }, 100)
        return
      }
    }
  }, [hash, user])

  // Selalu pastikan posisi halaman reset ke paling atas setiap rute berubah
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [hash])

  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('pkm_theme', 'light')
  }, [])

  // Universal Spotlight Tracking Effect (Apple / Linear interactive mouse-follow on cards)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!mq.matches) return

    const handlePointerMove = (e) => {
      const card = e.target.closest(
        '.spotlight-card, [data-glow], .bento-hero-tile, .bento-widget-tile, .stat-box, .proposal-card-item, .student-panel, .student-form-card, .student-log-card, .caritim-card, .news-card-new, .eco-card, .guidance-card'
      )
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left).toFixed(1)
      const y = (e.clientY - rect.top).toFixed(1)
      card.style.setProperty('--x', `${x}px`)
      card.style.setProperty('--y', `${y}px`)
      card.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
      card.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2))
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  const logout = () => {
    clearAuthSession()
    setUser(null)
    window.location.hash = '#beranda'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  // Timer inaktivitas 30 menit otomatis logout jika pengguna menganggur
  useEffect(() => {
    if (!user) return

    recordAuthActivity()

    const checkTimer = () => {
      if (checkAuthInactivity(30)) {
        clearAuthSession()
        setUser(null)
        window.location.hash = '#beranda'
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.')
      }
    }

    // Interval cek setiap 30 detik
    const interval = setInterval(checkTimer, 30 * 1000)

    const handleActivity = () => {
      recordAuthActivity()
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }))

    return () => {
      clearInterval(interval)
      events.forEach(evt => window.removeEventListener(evt, handleActivity))
    }
  }, [user])

  // Fungsi beralih peran aktif pengguna (Switch Role)
  const switchRole = async (targetRole) => {
    if (!user || user.role === targetRole) return
    const token = getAuthToken()
    const updatedUser = { ...user, role: targetRole }

    try {
      if (token && !token.startsWith('token-')) {
        const response = await fetch(`${api}/auth/switch-role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: targetRole }),
        })
        const result = await response.json()
        if (response.ok && result?.token) {
          updateAuthToken(result.token)
          if (result.user?.role) updatedUser.role = result.user.role
          if (result.user?.roles) {
            // Jangan biarkan backend mengurangi roles admin/multi-role menjadi satu role saja,
            // agar tombol "Ganti Peran" tetap tampil saat admin beralih ke dosen/reviewer.
            const originalHasAdmin = (user.roles || []).includes('admin')
            const backendHasAdmin = result.user.roles.includes('admin')
            if (originalHasAdmin && !backendHasAdmin) {
              // Pertahankan roles asli admin (multi-role)
            } else {
              updatedUser.roles = result.user.roles
            }
          }
        }
      }
    } catch (err) {
      console.warn('Sinkronisasi switch-role online tidak tersedia, beralih secara lokal:', err)
    }

    updateAuthUser(updatedUser)
    setUser(updatedUser)

    if (targetRole === 'dosen') window.location.hash = '#dosen'
    else if (targetRole === 'reviewer') window.location.hash = '#reviewer'
    else if (targetRole === 'admin') window.location.hash = '#admin'
    else if (targetRole === 'admin_akun') window.location.hash = '#admin-akun'
    else window.location.hash = '#beranda'
  }

  const route = hash.replace('#', '').split('/')
  const raw = (route[0] || 'beranda').toLowerCase()
  const sub = (route[1] || '').toLowerCase()  // Sub-route di bawah prefix role (misal: ajukan-proposal, logbook, dll)
  const active = ['beranda', 'tentang', 'timeline', 'berita', 'pedoman', 'portofolio', 'galeri', 'kontak', 'admin', 'admin-akun', 'admin_akun', 'dosen', 'reviewer', 'mahasiswa', 'pkmate', 'idealab'].includes(raw) ? raw : 'beranda'

  const fallbackHome = <Home anchor="beranda" user={user} onLogin={() => setModal(true)} />

  let view
  // ── Portal Admin Akun (Verifikasi KTM) ────────────────────────────
  if (raw === 'admin-akun' || raw === 'admin_akun') {
    if (user && (user.role === 'admin_akun' || user.role === 'admin' || (user.roles || []).includes('admin_akun'))) {
      if (sub === 'pesan') view = <PesanFeedback user={user} onLogin={() => setModal(true)} onSwitchUser={setUser} />
      else if (sub === 'profil') view = <ProfilePage user={user} onUpdateUser={setUser} onSwitchRole={switchRole} onLogout={logout} />
      else if (sub === 'pedoman') view = <PedomanIndex />
      else view = <AdminAkunDashboard user={user} />
    } else {
      view = fallbackHome
    }
  }
  // ── Portal Mahasiswa ──────────────────────────────────────────────
  else if (raw === 'mahasiswa') {
    if (user && user.role === 'mahasiswa') {
      if (sub === 'ajukan-proposal') view = <AjukanProposal user={user} />
      else if (sub === 'logbook') view = <LogbookPKM user={user} />
      else if (sub === 'cek-status') view = <CekStatusUsulan user={user} />
      else if (sub === 'idealab' || sub === 'pkmate') view = <IdeaLab user={user} onLogin={() => setModal(true)} />
      else if (sub === 'caritim') view = <TeamManagement user={user} initialTab="dosen" />
      else if (sub === 'tim') view = <TeamManagement user={user} initialTab="tim" />
      else if (sub === 'pesan') view = <PesanFeedback user={user} onLogin={() => setModal(true)} onSwitchUser={setUser} />
      else if (sub === 'profil') view = <ProfilePage user={user} onUpdateUser={setUser} onSwitchRole={switchRole} onLogout={logout} />
      else if (sub === 'pedoman') view = <PedomanIndex />
      else view = <MahasiswaDashboard user={user} />
    } else if (sub === 'idealab' || sub === 'pkmate') {
      view = <IdeaLab user={null} onLogin={() => setModal(true)} />
    } else {
      view = fallbackHome
    }
  }
  // ── Portal Dosen ──────────────────────────────────────────────────
  else if (raw === 'dosen') {
    if (user && (user.role === 'dosen' || user.role === 'admin' || (user.roles || []).includes('dosen'))) {
      if (sub === 'pesan') view = <PesanFeedback user={user} onLogin={() => setModal(true)} onSwitchUser={setUser} />
      else if (sub === 'profil') view = <ProfilePage user={user} onUpdateUser={setUser} onSwitchRole={switchRole} onLogout={logout} />
      else if (sub === 'pedoman') view = <PedomanIndex />
      else view = <DosenDashboard user={user} onSwitchRole={switchRole} />
    } else {
      view = fallbackHome
    }
  }
  // ── Portal Reviewer ───────────────────────────────────────────────
  else if (raw === 'reviewer') {
    if (user && (user.role === 'reviewer' || user.role === 'admin' || (user.roles || []).includes('reviewer'))) {
      if (sub === 'pesan') view = <PesanFeedback user={user} onLogin={() => setModal(true)} onSwitchUser={setUser} />
      else if (sub === 'profil') view = <ProfilePage user={user} onUpdateUser={setUser} onSwitchRole={switchRole} onLogout={logout} />
      else if (sub === 'pedoman') view = <PedomanIndex />
      else view = <ReviewerDashboard user={user} onSwitchRole={switchRole} />
    } else {
      view = fallbackHome
    }
  }
  // ── Portal Admin ──────────────────────────────────────────────────
  else if (raw === 'admin') {
    if (user && user.role === 'admin') {
      if (sub === 'pesan') view = <PesanFeedback user={user} onLogin={() => setModal(true)} onSwitchUser={setUser} />
      else if (sub === 'profil') view = <ProfilePage user={user} onUpdateUser={setUser} onSwitchRole={switchRole} onLogout={logout} />
      else if (sub === 'pedoman') view = <PedomanIndex />
      else view = <AdminPanel user={user} />
    } else {
      view = fallbackHome
    }
  }
  // ── Halaman Publik ─────────────────────────────────────────────────
  else if (raw === 'pkmate' || raw === 'idealab') view = <IdeaLab user={user} onLogin={() => setModal(true)} />
  else if (raw === 'berita') view = route[1] ? <NewsDetail id={route[1]} /> : <NewsIndex />
  else if (raw === 'galeri') view = <Gallery />
  else if (raw === 'pedoman') view = <PedomanIndex />
  else if (route[0] === 'portofolio') view = <PortofolioIndex />
  else if (route[0] === 'kontak') view = <KontakPage />
  else view = <Home anchor={['tentang', 'timeline'].includes(route[0]) ? route[0] : 'beranda'} user={user} onLogin={() => setModal(true)} />

  // Render collapsible desktop sidebar for authenticated dashboard routes
  const isDashboardRoute = ['mahasiswa', 'dosen', 'reviewer', 'admin', 'admin-akun', 'admin_akun'].includes(raw)

  // Akses Panduan dari portal sidebar (hash #role/pedoman) tetap pakai sidebar layout
  const isPedomanSidebar = sub === 'pedoman'

  const handleOpenProfile = () => {
    // Navigasi profil sekarang di bawah prefix role aktif
    const rolePrefix = user?.role || 'mahasiswa'
    window.location.hash = `#${rolePrefix}/profil`
  }

  // Untuk sidebar layout, pass sub-route sebagai active item agar sidebar bisa highlight item yang benar
  const sidebarActive = sub || raw

  const pageContent = (isDashboardRoute || isPedomanSidebar) && user ? (
    <DesktopSidebarLayout user={user} active={sidebarActive} routePrefix={raw} onLogout={logout} onSwitchRole={switchRole} onOpenProfile={handleOpenProfile}>
      {view}
    </DesktopSidebarLayout>
  ) : (
    view
  )

  return (
    <>
      {/* TopNavbar Hanya Muncul untuk Halaman Publik Non-Dashboard / Tamu (Di Dashboard, layout sidebar penuh langsung nyambung ke atas) */}
      {!((isDashboardRoute || isPedomanSidebar) && Boolean(user)) && (
        <TopNavbar
          active={active}
          user={user}
          isDashboard={false}
          onLogin={() => setModal(true)}
          onLogout={logout}
          onSwitchRole={switchRole}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {pageContent}

      {/* Footer hanya tampil di Beranda / Portal Utama, tidak tampil di dashboard atau modul sistem internal */}
      {!isDashboardRoute && ['beranda', 'tentang', 'timeline'].includes(raw) && <SiteFooter />}

      {/* Floating Apple-Style Bottom Dock (iOS Tab Bar for Mobile) */}
      <AppleMobileDock
        active={active}
        user={user}
        onLogin={() => setModal(true)}
        onLogout={logout}
        onSwitchRole={switchRole}
        onOpenProfile={handleOpenProfile}
      />

      {modal && <LoginModal close={() => setModal(false)} complete={setUser} />}
    </>
  )
}

const container = document.getElementById('root')
if (!container._reactRoot) {
  container._reactRoot = createRoot(container)
}
container._reactRoot.render(<App />)
