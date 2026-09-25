import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GlassNavbar } from './components/GlassNavbar'
import { PageIntro } from './components/PageIntro'
import { NewsIndex, NewsDetail } from './pages/News'
import { Gallery } from './pages/Gallery'
import { api } from './lib/content'
import './styles.css'

function Brand() { return <a className="brand" href="#beranda" aria-label="PKM Center Universitas Lampung"><img className="brand-logo" src="/logo-pkm-center.png" alt="Logo PKM Center Universitas Lampung" /><span>PKM <i>Center</i><small>UNIVERSITAS LAMPUNG</small></span></a> }
function Header({ user, onLogin, onLogout }) { return <header className="site-header"><Brand />{user ? <div className="account-actions">{user.role === 'admin' && <a className="admin-link" href="#admin">Kelola konten</a>}<button className="profile" onClick={onLogout}>Keluar <span>{user.role}</span></button></div> : <button className="login-trigger" onClick={onLogin}>Masuk <b>→</b></button>}</header> }
function Home() { return <main id="beranda"><section className="hero"><div className="hero-copy"><p className="eyebrow">RUANG TUMBUH IDE MAHASISWA</p><h1>Gagasan kecil.<br /><em>Dampak besar.</em></h1><p className="intro">PKM Center Unila adalah titik temu bagi rasa ingin tahu, riset yang berani, dan karya yang memberi arti.</p><div className="actions"><a className="button dark" href="#berita">Lihat kabar terbaru <b>↗</b></a><a className="text-link" href="#tentang">Kenali PKM <b>↓</b></a></div></div><div className="hero-art"><div className="sun" /><div className="arch arch-one" /><div className="arch arch-two" /><div className="orb orb-one" /><div className="orb orb-two" /><div className="note">IDE<br />TUMBUH</div><p className="art-caption">UNILA<br /><i>CREATIVE<br />ECOSYSTEM</i></p></div></section><section className="ticker"><span>BERPIKIR</span><b>✦</b><span>BERKARYA</span><b>✦</b><span>BERDAMPAK</span><b>✦</b><span>BERSAMA UNILA</span></section><section className="journey" id="tentang"><div><p className="eyebrow">SATU IDE, BANYAK KEMUNGKINAN</p><h2>Temukan lintasanmu.</h2></div><div className="path-grid"><article><span>01</span><h3>Jelajahi</h3><p>Temukan bentuk PKM yang paling dekat dengan kegelisahanmu.</p></article><article><span>02</span><h3>Racik</h3><p>Ubah pertanyaan menjadi proposal yang kuat dan terarah.</p></article><article><span>03</span><h3>Wujudkan</h3><p>Bawa gagasanmu keluar kelas untuk menciptakan perubahan.</p></article></div></section></main> }
function AdminPanel({ user }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(blankContent)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const token = localStorage.getItem('pkm_token')
  const load = () => fetch(`${api}/admin/content`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(r => setItems(r.data || []))
  useEffect(() => { if (user?.role === 'admin') load() }, [user])
  if (user?.role !== 'admin') return <main><PageIntro eyebrow="AKSES TERBATAS" title={<>Halaman ini<br /><em>untuk admin.</em></>} copy="Silakan masuk memakai akun admin untuk mengelola konten publik." /></main>
  const submit = async (event) => {
    event.preventDefault()
    setMessage('Menyimpan…')
    const response = await fetch(`${api}/admin/content${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) { setMessage(result.message || 'Gagal menyimpan'); return }
    setMessage('Konten tersimpan.'); setForm(blankContent); setEditing(null); load()
  }
  const edit = (item) => {
    setEditing(item.id)
    setForm({ type: item.type, title: item.title, category: item.category || '', description: item.description || '', body: item.body || '', mediaUrl: item.mediaUrl || '', thumbnailUrl: item.thumbnailUrl || '', color: item.color || 'gold' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const remove = async (id) => {
    if (!window.confirm('Hapus konten ini?')) return
    await fetch(`${api}/admin/content/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }
  return (
    <main className="admin-page">
      <PageIntro eyebrow="DASHBOARD ADMIN" title={<>Kelola ruang<br /><em>dan cerita.</em></>} copy="Tambah, ubah, atau hapus konten yang tampil pada halaman Berita dan Galeri." />
      <section className="admin-layout">
        <form className="content-form" onSubmit={submit}>
          <div className="form-heading"><h2>{editing ? 'Ubah konten' : 'Tambah konten'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blankContent) }}>Batal</button>}</div>
          <label>Jenis konten<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="news">Berita</option><option value="video">Video</option><option value="gallery">Galeri</option></select></label>
          <label>Judul<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Kategori / label<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Pengumuman" /></label>
          <label>Ringkasan<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
          {form.type === 'news' && <label>Isi artikel (paragraf dipisah baris kosong)<textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Paragraf pertama.&#10;&#10;Paragraf kedua." /></label>}
          <label>URL gambar sampul / tautan media (opsional)<input type="url" value={form.thumbnailUrl} onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://...jpg (dipakai untuk sampul berita)" /></label>
          {form.type === 'video' && <label>URL video / media (opsional)<input type="url" value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} placeholder="YouTube atau https://...mp4" /></label>}
          {form.type === 'video' && <label>URL thumbnail video (opsional)<input type="url" value={form.thumbnailUrl} onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="Otomatis bila URL YouTube" /></label>}
          {form.type === 'gallery' && <label>URL foto (opsional)<input type="url" value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} placeholder="https://...jpg" /></label>}
          <label>Warna kartu<select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}><option value="gold">Emas</option><option value="blue">Biru</option><option value="red">Merah</option><option value="green">Hijau</option></select></label>
          <button className="button dark" type="submit">{editing ? 'Simpan perubahan' : 'Terbitkan konten'} <b>→</b></button>
          {message && <p className="form-message">{message}</p>}
        </form>
        <section className="content-list">
          <div className="form-heading"><h2>Konten terbit</h2><span>{items.length} item</span></div>
          {items.map(item => (
            <article className="admin-item" key={item.id}>
              <div className={`admin-swatch ${item.color}`} />
              <div><p className="card-meta">{item.type} · {item.category || 'Tanpa kategori'}</p><h3>{item.title}</h3><p>{item.description}</p></div>
              <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
            </article>
          ))}
        </section>
      </section>
    </main>
  )
}
const blankContent = { type: 'news', title: '', category: '', description: '', body: '', mediaUrl: '', thumbnailUrl: '', color: 'gold' }
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
  const active = route[0] === 'berita' ? 'berita' : route[0] === 'galeri' ? 'galeri' : route[0] === 'tentang' ? 'tentang' : 'beranda'
  const view = route[0] === 'admin' ? <AdminPanel user={user} /> : route[0] === 'berita' ? (route[1] ? <NewsDetail id={route[1]} /> : <NewsIndex />) : route[0] === 'galeri' ? <Gallery /> : <Home />
  return <><Header user={user} onLogin={() => setModal(true)} onLogout={logout} /><GlassNavbar active={active} theme={theme} onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} />{view}<footer><span>PKM CENTER · UNIVERSITAS LAMPUNG</span><span>2026 — Dibuat untuk ide yang tak mau diam.</span></footer>{modal && <LoginModal close={() => setModal(false)} complete={setUser} />}</>
}
createRoot(document.getElementById('root')).render(<App />)