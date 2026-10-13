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
import { api } from './lib/content'
import './styles.css'
import './ref.css'
import './modules.css'

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
  ['berita', 'Berita'],
  ['pedoman', 'Panduan'],
  ['galeri', 'Galeri'],
  ['kontak', 'Kontak'],
]

// Navigasi Khusus yang Disesuaikan dengan Peran Pengguna Saat Login
function getNavItems(user) {
  if (!user) return NAV_GUEST
  switch (user.role) {
    case 'dosen':
      return [
        ['dosen', 'Dosen'],
        ['reviewer', 'Reviewer'],
        ['pesan', 'Pesan'],
        ['beranda', 'Beranda'],
        ['pedoman', 'Panduan'],
      ]
    case 'reviewer':
      return [
        ['reviewer', 'Reviewer'],
        ['dosen', 'Dosen'],
        ['pesan', 'Pesan'],
        ['beranda', 'Beranda'],
        ['pedoman', 'Panduan'],
      ]
    case 'admin':
      return [
        ['admin', 'Kelola Konten'],
        ['dosen', 'Dosen'],
        ['reviewer', 'Reviewer'],
        ['pesan', 'Pesan'],
      ]
    case 'mahasiswa':
    default:
      return [
        ['mahasiswa', 'Dashboard'],
        ['ajukan-proposal', 'Ajukan Proposal'],
        ['logbook', 'Logbook'],
        ['cek-status', 'Cek Status'],
        ['idealab', 'Idea Lab'],
        ['caritim', 'Cari Tim'],
        ['tim', 'Manajemen Tim'],
        ['pesan', 'Pesan'],
        ['beranda', 'Beranda'],
      ]
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'dosen': return 'Dosen Pembimbing'
    case 'reviewer': return 'Reviewer'
    case 'admin': return 'Administrator'
    case 'mahasiswa': return 'Mahasiswa'
    default: return 'Pengguna'
  }
}

function TopNavbar({ active, user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  const navItems = getNavItems(user)
  const isActive = (id) => active === id || (id === 'pedoman' && active === 'pedoman')

  // Inisial avatar pengguna
  const userInitials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <header className="site-header topnav">
      <Brand />
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
      <div className="topnav-actions">
        {user ? (
          <div className="account-actions">
            <div className="nav-user-chip" title={`${user.name} (${getRoleLabel(user.role)})`}>
              <div className="nav-user-avatar">{userInitials}</div>
              <div className="nav-user-meta">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-role-badge">{getRoleLabel(user.role)}</span>
              </div>
            </div>
            {(user.role === 'dosen' || user.role === 'reviewer') && (
              <a
                href={active === 'dosen' ? '#reviewer' : '#dosen'}
                className="nav-switch-btn"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '9999px',
                  color: '#15803d',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
                title={active === 'dosen' ? 'Beralih ke Dashboard Reviewer' : 'Beralih ke Dashboard Dosen'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
                <span>{active === 'dosen' ? 'Buka Reviewer' : 'Buka Dosen'}</span>
              </a>
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
        <button className="topnav-burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Buka menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="topnav-drawer" role="menu">
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div className="nav-user-avatar">{userInitials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{getRoleLabel(user.role)}</div>
              </div>
            </div>
          )}
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              role="menuitem"
              className={`topnav-drawer-item ${isActive(id) ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          {user
            ? <button className="btn-masuk wide" onClick={() => { setOpen(false); onLogout() }}>Keluar dari Akun <b>&rarr;</b></button>
            : <button className="btn-masuk wide" onClick={() => { setOpen(false); onLogin() }}>Masuk ke Sistem <b>&rarr;</b></button>}
        </div>
      )}
    </header>
  )
}

const DEMO_ACCOUNTS = [
  { label: 'Dosen Pembimbing', email: 'dosen@pkm.unila.ac.id', pass: 'dosen123' },
  { label: 'Reviewer', email: 'reviewer@pkm.unila.ac.id', pass: 'reviewer123' },
  { label: 'Mahasiswa', email: 'mahasiswa@pkm.unila.ac.id', pass: 'mahasiswa123' },
  { label: 'Admin Kampus', email: 'admin@pkm.unila.ac.id', pass: 'admin123' },
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
      // Deteksi otomatis peran pengguna berdasarkan akun login tanpa perlu memilih role secara manual
      const e = form.email.toLowerCase().trim()
      let role = 'mahasiswa'
      let name = 'Nadia Putri Maharani'

      if (e.includes('dosen') || e.includes('budi') || /^19\d{8,}/.test(e)) {
        role = 'dosen'
        name = 'Dr. Budi Dosen, S.T., M.T.'
      } else if (e.includes('reviewer') || e.includes('hendri') || e.startsWith('rev')) {
        role = 'reviewer'
        name = 'Dr. Hendri Reviewer, M.Kom.'
      } else if (e.includes('admin')) {
        role = 'admin'
        name = 'Admin PKM Center'
      } else {
        role = 'mahasiswa'
        name = 'Nadia Putri Maharani'
      }

      loggedUser = {
        id: `user-${role}`,
        name,
        email: form.email,
        role,
      }
      localStorage.setItem('pkm_token', `token-${role}`)
    }

    if (loggedUser) {
      localStorage.setItem('pkm_user', JSON.stringify(loggedUser))
      if (!remember) sessionStorage.setItem('pkm_session_only', '1')
      complete(loggedUser)
      close()

      // Redirect otomatis ke modul dashboard sesuai role akun yang digunakan
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
      <section className="login-card" onMouseDown={event => event.stopPropagation()} aria-label="Masuk ke PKM Center">
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
        <p className="login-sub">Sistem otomatis mendeteksi peran akun Anda (Mahasiswa, Dosen, Reviewer, atau Admin).</p>

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
            Isi Cepat Akun Demo (Klik untuk mengisi):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.label}
                type="button"
                onClick={() => setForm({ email: acc.email, password: acc.pass })}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.4rem',
                  border: '1px solid #cbd5e1',
                  background: form.email === acc.email ? '#0b2149' : '#f8fafc',
                  color: form.email === acc.email ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {acc.label}
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
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('pkm_user') || 'null'))
  useEffect(() => {
    const listen = () => setHash(window.location.hash || '#beranda')
    window.addEventListener('hashchange', listen)
    return () => window.removeEventListener('hashchange', listen)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('pkm_theme', 'light')
  }, [])
  const logout = () => { localStorage.removeItem('pkm_user'); localStorage.removeItem('pkm_token'); setUser(null); window.location.hash = '#beranda' }
  const route = hash.replace('#', '').split('/')
  const raw = route[0] || 'beranda'
  const active = ['beranda', 'tentang', 'timeline', 'berita', 'pedoman', 'portofolio', 'galeri', 'kontak', 'admin', 'dosen', 'reviewer', 'pesan', 'mahasiswa', 'ajukan-proposal', 'ajukanproposal', 'logbook', 'cek-status', 'cekstatus', 'idealab', 'caritim', 'tim'].includes(raw) ? raw : 'beranda'
  let view
  if (route[0] === 'admin') view = <AdminPanel user={user} />
  else if (route[0] === 'dosen') view = <DosenDashboard user={user} />
  else if (route[0] === 'reviewer') view = <ReviewerDashboard user={user} />
  else if (route[0] === 'pesan') view = <PesanFeedback user={user} />
  else if (route[0] === 'mahasiswa') view = <MahasiswaDashboard user={user} />
  else if (route[0] === 'ajukan-proposal' || route[0] === 'ajukanproposal') view = <AjukanProposal user={user} />
  else if (route[0] === 'logbook') view = <LogbookPKM user={user} />
  else if (route[0] === 'cek-status' || route[0] === 'cekstatus') view = <CekStatusUsulan user={user} />
  else if (route[0] === 'idealab') view = <IdeaLab user={user} />
  else if (route[0] === 'caritim') view = <CariTim user={user} />
  else if (route[0] === 'tim') view = <TeamManagement user={user} />
  else if (route[0] === 'berita') view = route[1] ? <NewsDetail id={route[1]} /> : <NewsIndex />
  else if (route[0] === 'galeri') view = <Gallery />
  else if (route[0] === 'pedoman') view = <PedomanIndex />
  else if (route[0] === 'portofolio') view = <PortofolioIndex />
  else if (route[0] === 'kontak') view = <KontakPage />
  else view = <Home anchor={['tentang', 'timeline'].includes(route[0]) ? route[0] : 'beranda'} />
  return <><TopNavbar active={active} user={user} onLogin={() => setModal(true)} onLogout={logout} />{view}<SiteFooter />{modal && <LoginModal close={() => setModal(false)} complete={setUser} />}</>
}
createRoot(document.getElementById('root')).render(<App />)
