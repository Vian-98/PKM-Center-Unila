import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { NewsIndex, NewsDetail } from './pages/News'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { PedomanIndex } from './pages/Pedoman'
import { PortofolioIndex } from './pages/Portofolio'
import { KontakPage } from './pages/Kontak'
import { AdminPanel } from './pages/AdminPanel'
import { api } from './lib/content'
import './styles.css'
import './ref.css'

function Brand({ dark = false }) {
  return (
    <a className={`brand ${dark ? 'brand-dark' : ''}`} href="#beranda" aria-label="PKM Center Universitas Lampung">
      <img className="brand-logo brand-logo-unila" src="/Logo-2016-Unila.png" alt="Logo Universitas Lampung" />
      <img className="brand-logo" src="/logo-pkm-center.png" alt="Logo PKM Center Universitas Lampung" />
      <span className="brand-text">PKM CENTER<small>UNIVERSITAS LAMPUNG</small></span>
    </a>
  )
}

const NAV_MAIN = [
  ['beranda', 'Beranda'],
  ['tentang', 'Tentang PKM'],
  ['timeline', 'Timeline'],
  ['berita', 'Berita'],
  ['pedoman', 'Panduan'],
]

const NAV_MORE = [
  ['portofolio', 'Portofolio'],
  ['galeri', 'Galeri'],
  ['kontak', 'Kontak'],
]

function TopNavbar({ active, user, onLogin, onLogout }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])
  const isActive = (id) => active === id || (id === 'pedoman' && active === 'pedoman')
  return (
    <header className="site-header topnav">
      <Brand />
      <nav className="topnav-links" aria-label="Navigasi utama">
        {NAV_MAIN.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={`topnav-link ${isActive(id) ? 'active' : ''}`} aria-current={isActive(id) ? 'page' : undefined}>{label}</a>
        ))}
      </nav>
      <div className="topnav-actions">
        {user ? (
          <div className="account-actions">
            {user.role === 'admin' && <a className="admin-link" href="#admin">Kelola konten</a>}
            <button className="profile" onClick={onLogout}>Keluar <span>{user.role}</span></button>
          </div>
        ) : (
          <button className="btn-masuk" onClick={onLogin}>Masuk <b>→</b></button>
        )}
        <button className="topnav-burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Buka menu">☰</button>
      </div>
      {open && (
        <div className="topnav-drawer" role="menu">
          {[...NAV_MAIN, ...NAV_MORE].map(([id, label]) => (
            <a key={id} href={`#${id}`} role="menuitem" className={`topnav-drawer-item ${active === id ? 'active' : ''}`} onClick={() => setOpen(false)}>{label}</a>
          ))}
          {user?.role === 'admin' && <a href="#admin" role="menuitem" className="topnav-drawer-item" onClick={() => setOpen(false)}>Kelola konten</a>}
          {user
            ? <button className="btn-masuk wide" onClick={() => { setOpen(false); onLogout() }}>Keluar <b>→</b></button>
            : <button className="btn-masuk wide" onClick={() => { setOpen(false); onLogin() }}>Masuk <b>→</b></button>}
        </div>
      )}
    </header>
  )
}

const LOGIN_ROLES = [
  { id: 'Mahasiswa', demo: 'mahasiswa@pkm.unila.ac.id / mahasiswa123' },
  { id: 'Dosen', demo: 'dosen@pkm.unila.ac.id / dosen123' },
  { id: 'Reviewer', demo: 'admin@pkm.unila.ac.id / admin123' },
]

function LoginModal({ close, complete }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [role, setRole] = useState('Mahasiswa')
  const [remember, setRemember] = useState(false)
  const [state, setState] = useState({ loading: false, error: '' })
  const login = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '' })
    try {
      const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Gagal masuk.')
      localStorage.setItem('pkm_user', JSON.stringify(result.user))
      localStorage.setItem('pkm_token', result.token)
      if (!remember) sessionStorage.setItem('pkm_session_only', '1')
      complete(result.user); close()
    } catch (error) { setState({ loading: false, error: error.message }) }
  }
  const demo = LOGIN_ROLES.find((r) => r.id === role)?.demo
  return (
    <div className="modal-backdrop login-backdrop" onMouseDown={close}>
      <section className="login-card" onMouseDown={event => event.stopPropagation()} aria-label="Masuk ke PKM Center">
        <div className="login-head">
          <div className="login-brand">
            <img src="/Logo-2016-Unila.png" alt="Logo Universitas Lampung" />
            <img src="/logo-pkm-center.png" alt="Logo PKM Center" />
            <span>PKM CENTER<small>UNIVERSITAS LAMPUNG</small></span>
          </div>
          <button className="login-x" onClick={close} aria-label="Tutup">✕</button>
        </div>
        <p className="login-eyebrow">SELAMAT DATANG</p>
        <h2>Masuk ke PKM Center</h2>
        <p className="login-sub">Kelola perjalanan PKM-mu dalam satu tempat.</p>
        <div className="login-tabs" role="tablist" aria-label="Peran">
          {LOGIN_ROLES.map((r) => (
            <button key={r.id} role="tab" aria-selected={role === r.id} type="button" className={role === r.id ? 'active' : ''} onClick={() => setRole(r.id)}>{r.id}</button>
          ))}
        </div>
        <form onSubmit={login}>
          <label>NPM / NIP / Email<input type="email" placeholder="Masukkan identitas akun" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Kata sandi<input type="password" placeholder="Masukkan kata sandi" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required /></label>
          {state.error && <p className="error">{state.error}</p>}
          <div className="login-row">
            <label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Ingat saya</label>
            <button type="button" className="link" onClick={() => window.alert('Fitur lupa kata sandi segera hadir.')}>Lupa kata sandi?</button>
          </div>
          <button className="btn-primary login-submit" disabled={state.loading}>{state.loading ? 'Memeriksa…' : `Masuk sebagai ${role}`} <b>→</b></button>
        </form>
        <p className="login-register">Belum memiliki akun? <button type="button" className="link strong" onClick={() => window.alert('Pendaftaran akun segera hadir.')}>Daftar sekarang</button></p>
        <p className="login-demo">Akun demo {role.toLowerCase()}: {demo}</p>
        <p className="login-sso">INTEGRASI SSO UNILA SEGERA HADIR</p>
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
        <p className="footer-copy">© 2025 Universitas Lampung</p>
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
  const logout = () => { localStorage.removeItem('pkm_user'); localStorage.removeItem('pkm_token'); setUser(null) }
  const route = hash.replace('#', '').split('/')
  const raw = route[0] || 'beranda'
  const active = ['beranda', 'tentang', 'timeline', 'berita', 'pedoman', 'portofolio', 'galeri', 'kontak', 'admin'].includes(raw) ? raw : 'beranda'
  let view
  if (route[0] === 'admin') view = <AdminPanel user={user} />
  else if (route[0] === 'berita') view = route[1] ? <NewsDetail id={route[1]} /> : <NewsIndex />
  else if (route[0] === 'galeri') view = <Gallery />
  else if (route[0] === 'pedoman') view = <PedomanIndex />
  else if (route[0] === 'portofolio') view = <PortofolioIndex />
  else if (route[0] === 'kontak') view = <KontakPage />
  else view = <Home anchor={['tentang', 'timeline'].includes(route[0]) ? route[0] : 'beranda'} />
  return <><TopNavbar active={active} user={user} onLogin={() => setModal(true)} onLogout={logout} />{view}<SiteFooter />{modal && <LoginModal close={() => setModal(false)} complete={setUser} />}</>
}
createRoot(document.getElementById('root')).render(<App />)
