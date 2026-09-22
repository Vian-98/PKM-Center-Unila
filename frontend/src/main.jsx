import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const api = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

function App() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [state, setState] = useState({ loading: false, error: '', user: JSON.parse(localStorage.getItem('pkm_user') || 'null') })
  const login = async (event) => {
    event.preventDefault(); setState(s => ({ ...s, loading: true, error: '' }))
    try {
      const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message)
      localStorage.setItem('pkm_user', JSON.stringify(result.user)); localStorage.setItem('pkm_token', result.token)
      setState({ loading: false, error: '', user: result.user }); setOpen(false)
    } catch (error) { setState(s => ({ ...s, loading: false, error: error.message })) }
  }
  const logout = () => { localStorage.clear(); setState({ loading: false, error: '', user: null }) }
  return <>
    <header><a className="brand" href="#beranda" aria-label="PKM Center Universitas Lampung"><img className="brand-logo" src="/logo-pkm-center.png" alt="Logo PKM Center Universitas Lampung"/><span>PKM <i>Center</i><small>UNIVERSITAS LAMPUNG</small></span></a><nav><a href="#tentang">Tentang</a><a href="#lintasan">Lintasan PKM</a><a href="#karya">Karya</a></nav>{state.user ? <button className="profile" onClick={logout}>{state.user.name.split(' ')[0]} <span>{state.user.role}</span></button> : <button className="login-trigger" onClick={() => setOpen(true)}>Masuk <b>→</b></button>}</header>
    <main id="beranda">
      <section className="hero"><div className="hero-copy"><p className="eyebrow">RUANG TUMBUH IDE MAHASISWA</p><h1>Gagasan kecil.<br/><em>Dampak besar.</em></h1><p className="intro">PKM Center Unila adalah titik temu bagi rasa ingin tahu, riset yang berani, dan karya yang memberi arti.</p><div className="actions"><a className="button dark" href="#lintasan">Mulai perjalanan <b>↗</b></a><a className="text-link" href="#tentang">Kenali PKM <b>↓</b></a></div></div><div className="hero-art"><div className="sun"></div><div className="arch arch-one"></div><div className="arch arch-two"></div><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="note">IDE<br/>TUMBUH</div><p className="art-caption">UNILA<br/><i>CREATIVE<br/>ECOSYSTEM</i></p></div></section>
      <section className="ticker"><span>BERPIKIR</span><b>✦</b><span>BERKARYA</span><b>✦</b><span>BERDAMPAK</span><b>✦</b><span>BERSAMA UNILA</span></section>
      <section className="journey" id="lintasan"><div><p className="eyebrow">SATU IDE, BANYAK KEMUNGKINAN</p><h2>Temukan lintasanmu.</h2></div><div className="path-grid"><article><span>01</span><h3>Jelajahi</h3><p>Temukan bentuk PKM yang paling dekat dengan kegelisahanmu.</p></article><article><span>02</span><h3>Racik</h3><p>Ubah pertanyaan menjadi proposal yang kuat dan terarah.</p></article><article><span>03</span><h3>Wujudkan</h3><p>Bawa gagasanmu keluar kelas untuk menciptakan perubahan.</p></article></div></section>
    </main>
    <footer id="tentang"><span>PKM CENTER · UNIVERSITAS LAMPUNG</span><span>2026 — Dibuat untuk ide yang tak mau diam.</span></footer>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><section className="modal" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={() => setOpen(false)}>×</button><p className="eyebrow">SELAMAT DATANG KEMBALI</p><h2>Masuk ke ruangmu.</h2><form onSubmit={login}><label>Email<input type="email" placeholder="nama@pkm.unila.ac.id" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required/></label><label>Kata sandi<input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required/></label>{state.error && <p className="error">{state.error}</p>}<button className="button dark" disabled={state.loading}>{state.loading ? 'Memeriksa…' : 'Masuk ke PKM Center'} <b>→</b></button></form><p className="hint">Akun demo: admin@pkm.unila.ac.id / admin123</p></section></div>}
  </>
}
createRoot(document.getElementById('root')).render(<App />)
