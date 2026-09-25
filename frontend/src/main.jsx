import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GlassNavbar } from './components/GlassNavbar'
import { NewsIndex, NewsDetail } from './pages/News'
import { Gallery } from './pages/Gallery'
import { Home } from './pages/Home'
import { PedomanIndex } from './pages/Pedoman'
import { PortofolioIndex } from './pages/Portofolio'
import { KontakPage } from './pages/Kontak'
import { AdminPanel } from './pages/AdminPanel'
import { api } from './lib/content'
import './styles.css'

function Brand() { return <a className="brand" href="#beranda" aria-label="PKM Center Universitas Lampung"><img className="brand-logo" src="/logo-pkm-center.png" alt="Logo PKM Center Universitas Lampung" /><span>PKM <i>Center</i><small>UNIVERSITAS LAMPUNG</small></span></a> }
function Header({ user, onLogin, onLogout }) { return <header className="site-header"><Brand />{user ? <div className="account-actions">{user.role === 'admin' && <a className="admin-link" href="#admin">Kelola konten</a>}<button className="profile" onClick={onLogout}>Keluar <span>{user.role}</span></button></div> : <button className="login-trigger" onClick={onLogin}>Masuk <b>→</b></button>}</header> }

function LoginModal({ close, complete }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '' })
  const login = async (event) => {
    event.preventDefault()
    setState({ loading: true, error: '' })
    try {
      const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      localStorage.setItem('pkm_user', JSON.stringify(result.user))
      localStorage.setItem('pkm_token', result.token)
      complete(result.user); close()
    } catch (error) { setState({ loading: false, error: error.message }) }
  }
  return <div className="modal-backdrop" onMouseDown={close}><section className="modal" onMouseDown={event => event.stopPropagation()}><button className="close" onClick={close}>×</button><p className="eyebrow">SELAMAT DATANG KEMBALI</p><h2>Masuk ke ruangmu.</h2><form onSubmit={login}><label>Email<input type="email" placeholder="nama@pkm.unila.ac.id" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label><label>Kata sandi<input type="password" placeholder="••••••••" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required /></label>{state.error && <p className="error">{state.error}</p>}<button className="button dark" disabled={state.loading}>{state.loading ? 'Memeriksa…' : 'Masuk ke PKM Center'} <b>→</b></button></form><p className="hint">Akun demo: admin@pkm.unila.ac.id / admin123</p></section></div>
}
function App() {
  const [hash, setHash] = useState(window.location.hash || '#beranda')
  const [modal, setModal] = useState(false)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('pkm_user') || 'null'))
  const [theme, setTheme] = useState(localStorage.getItem('pkm_theme') || 'light')
  useEffect(() => {
    const listen = () => setHash(window.location.hash || '#beranda')
    window.addEventListener('hashchange', listen)
    return () => window.removeEventListener('hashchange', listen)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('pkm_theme', theme)
  }, [theme])
  const logout = () => { localStorage.clear(); setUser(null) }
  const route = hash.replace('#', '').split('/')
  const active = ['berita', 'galeri', 'tentang', 'pedoman', 'portofolio', 'kontak'].includes(route[0]) ? route[0] : 'beranda'
  const view = route[0] === 'admin' ? <AdminPanel user={user} /> : route[0] === 'berita' ? (route[1] ? <NewsDetail id={route[1]} /> : <NewsIndex />) : route[0] === 'galeri' ? <Gallery /> : route[0] === 'pedoman' ? <PedomanIndex /> : route[0] === 'portofolio' ? <PortofolioIndex /> : route[0] === 'kontak' ? <KontakPage /> : <Home />
  return <><Header user={user} onLogin={() => setModal(true)} onLogout={logout} /><GlassNavbar active={active} theme={theme} onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />{view}<footer><span>PKM CENTER · UNIVERSITAS LAMPUNG</span><span>2026 — Dibuat untuk ide yang tak mau diam.</span></footer>{modal && <LoginModal close={() => setModal(false)} complete={setUser} />}</>
}
createRoot(document.getElementById('root')).render(<App />)