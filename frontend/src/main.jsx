import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NewsIndex, NewsDetail } from './pages/News'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { PedomanIndex } from './pages/Pedoman'
import { PortofolioIndex } from './pages/Portofolio'
import { KontakPage } from './pages/Kontak'
import { AdminPanel } from './pages/AdminPanel'
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
    dosen: ['dosen', 'Portal Dosen'],
    reviewer: ['reviewer', 'Portal Reviewer'],
    mahasiswa: ['mahasiswa', 'Portal Mahasiswa'],
  }

  const portal = portalByRole[user.role] || ['beranda', 'Portal']

  return [...NAV_GUEST, portal]
}

function getRoleLabel(role) {
  switch (role) {
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
            {user?.role === 'dosen' ? 'Portal Dosen Pembimbing' : user?.role === 'reviewer' ? 'Portal Reviewer PKM' : user?.role === 'admin' ? 'Portal Administrator' : 'Portal Mahasiswa PKM'}
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
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [state, setState] = useState({ loading: false, error: '' })

  const login = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      setState({ loading: false, error: 'Harap isi akun dan kata sandi.' })
      return
    }
    setState({ loading: true, error: '' })
    let loggedUser = null

    try {
      const response = await fetch(`${api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const result = await response.json()
      if (response.ok && result?.user) {
        loggedUser = result.user
        localStorage.setItem('pkm_token', result.token)
      } else {
        throw new Error(result?.message || 'Login gagal')
      }
    } catch {
      // Deteksi otomatis peran pengguna berdasarkan akun login (fallback offline)
      const raw = form.email.trim()
      const e = raw.toLowerCase()
      let role = 'mahasiswa'
      let name = 'Mahasiswa Unila'
      let roles = ['mahasiswa']
      let studentNumber = ''

      if (e.includes('dosen.reviewer') || e.includes('sri') || (e.includes('dosen') && e.includes('reviewer'))) {
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
      localStorage.setItem('pkm_token', `token-${safeId}`)
    }

    if (loggedUser) {
      // Pastikan atribut roles selalu tersedia
      if (!loggedUser.roles) {
        loggedUser.roles = [loggedUser.role]
      }
      localStorage.setItem('pkm_user', JSON.stringify(loggedUser))
      if (!remember) sessionStorage.setItem('pkm_session_only', '1')
      complete(loggedUser)
      close()

      // Redirect otomatis ke modul dashboard sesuai role akun
      if (loggedUser.role === 'dosen') window.location.hash = '#dosen'
      else if (loggedUser.role === 'reviewer') window.location.hash = '#reviewer'
      else if (loggedUser.role === 'admin') window.location.hash = '#admin'
      else window.location.hash = '#mahasiswa'
    } else {
      setState({ loading: false, error: 'Identitas atau kata sandi tidak sesuai.' })
    }
  }

  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={close}>
      <section className="login-card apple-card-glass" onMouseDown={event => event.stopPropagation()} aria-label="Masuk ke PKM Center">
        <div className="login-head">
          <div className="login-brand">
            <img src="/Logo-2016-Unila.png" alt="Logo Universitas Lampung" />
            <img src="/logo-pkm-center.png" alt="Logo PKM Center" />
            <span>PKM CENTER<small>UNIVERSITAS LAMPUNG</small></span>
          </div>
          <button className="login-x" onClick={close} aria-label="Tutup">x</button>
        </div>
        <p className="login-eyebrow">PORTAL DIGITAL</p>
        <h2>Masuk ke Akun PKM</h2>
        <p className="login-sub">Sistem mendeteksi peran akun secara otomatis. Dosen dan Reviewer adalah peran berbeda yang dapat dialihkan jika akun memiliki hak akses ganda.</p>

        <form onSubmit={login}>
          <label>NPM / NIP / Email Akun
            <input
              type="text"
              placeholder="nama@pkm.unila.ac.id"
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
          {state.error && <p className="error">{state.error}</p>}
          <div className="login-row">
            <label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat saya</label>
            <button type="button" className="link" onClick={() => window.alert('Fitur pemulihan kata sandi dapat menghubungi admin PKM Center.')}>Lupa kata sandi?</button>
          </div>
          <button className="btn-primary login-submit" disabled={state.loading}>{state.loading ? 'Memeriksa...' : 'Masuk ke Sistem'} <b>&rarr;</b></button>
        </form>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pilih Cepat Akun Demo:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => setForm({ email: acc.email, password: acc.pass })}
                style={{
                  textAlign: 'left',
                  fontSize: '0.75rem',
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
                <strong style={{ fontSize: '0.78rem' }}>{acc.label}</strong>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{acc.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="login-sso" style={{ marginTop: '1rem' }}>INTEGRASI SSO UNIVERSITAS LAMPUNG</p>
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
      const saved = localStorage.getItem('pkm_user')
      if (!saved) return null
      const parsed = JSON.parse(saved)
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

  // Daftar rute portal berdasarkan role — semua sub-halaman sekarang berada di bawah prefix role
  const ROLE_ROUTE_MAP = {
    mahasiswa: 'mahasiswa',
    dosen: 'dosen',
    reviewer: 'reviewer',
    admin: 'admin',
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

  // Session guard: Proteksi halaman portal — setiap role hanya bisa mengakses portal miliknya
  useEffect(() => {
    const currentRoute = (window.location.hash || '#beranda').replace('#', '').split('/')[0].toLowerCase()
    const protectedRoles = ['mahasiswa', 'dosen', 'reviewer', 'admin']
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
      if (!allowedRoles.includes(currentRoute) && user.role !== currentRoute) {
        // Sudah login tapi bukan role yang sesuai → redirect ke beranda
        window.location.hash = '#beranda'
        setTimeout(() => {
          alert('⚠️ Halaman ini hanya dapat diakses oleh akun ' + getRoleLabel(currentRoute) + '. Anda login sebagai ' + getRoleLabel(user.role) + '.')
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
    localStorage.removeItem('pkm_user')
    localStorage.removeItem('pkm_token')
    setUser(null)
    window.location.hash = '#beranda'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  // Fungsi beralih peran aktif pengguna (Switch Role)
  const switchRole = async (targetRole) => {
    if (!user || user.role === targetRole) return
    const token = localStorage.getItem('pkm_token')
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
          localStorage.setItem('pkm_token', result.token)
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

    localStorage.setItem('pkm_user', JSON.stringify(updatedUser))
    setUser(updatedUser)

    if (targetRole === 'dosen') window.location.hash = '#dosen'
    else if (targetRole === 'reviewer') window.location.hash = '#reviewer'
    else if (targetRole === 'admin') window.location.hash = '#admin'
    else window.location.hash = '#beranda'
  }

  const route = hash.replace('#', '').split('/')
  const raw = (route[0] || 'beranda').toLowerCase()
  const sub = (route[1] || '').toLowerCase()  // Sub-route di bawah prefix role (misal: ajukan-proposal, logbook, dll)
  const active = ['beranda', 'tentang', 'timeline', 'berita', 'pedoman', 'portofolio', 'galeri', 'kontak', 'admin', 'dosen', 'reviewer', 'mahasiswa', 'pkmate', 'idealab'].includes(raw) ? raw : 'beranda'

  const fallbackHome = <Home anchor="beranda" user={user} onLogin={() => setModal(true)} />

  let view
  // ── Portal Mahasiswa ──────────────────────────────────────────────
  if (raw === 'mahasiswa') {
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
  const isDashboardRoute = ['mahasiswa', 'dosen', 'reviewer', 'admin'].includes(raw)

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
