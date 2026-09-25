import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { api, schemeNames } from '../lib/content'

const blankContent = { type: 'news', title: '', category: '', description: '', body: '', mediaUrl: '', thumbnailUrl: '', color: 'gold' }

function useAdminList(path) {
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const token = localStorage.getItem('pkm_token')
  const load = () => fetch(`${api}/admin${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async (response) => {
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status === 401) { localStorage.clear(); window.location.reload(); return }
        setMessage(result?.message || 'Gagal memuat.')
        return
      }
      setItems(result?.data || [])
    })
  useEffect(() => { if (token) load() }, [path]) // eslint-disable-line react-hooks/exhaustive-deps
  return { items, setItems, message, setMessage, load, token }
}

async function adminRequest(token, path, method, body) {
  const response = await fetch(`${api}/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Gagal menyimpan.')
  return result.data
}

/* ---------------- Konten (Berita / Video / Galeri) ---------------- */

function ContentView() {
  const { items, message, setMessage, load, token } = useAdminList('/content')
  const [form, setForm] = useState(blankContent)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(editing ? 'update' : 'create')
    try {
      await adminRequest(token, `/content${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', form)
      setMessage('Konten tersimpan.'); setForm(blankContent); setEditing(null); load()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
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
    <section className="admin-layout">
      <form className="content-form" onSubmit={submit}>
        <div className="form-heading"><h2>{editing ? 'Ubah konten' : 'Tambah konten'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blankContent) }}>Batal</button>}</div>
        <label>Jenis konten<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="news">Berita</option><option value="video">Video</option><option value="gallery">Galeri</option></select></label>
        <label>Judul<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Kategori / label<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Contoh: Pengumuman" /></label>
        <label>Ringkasan<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
        {form.type === 'news' && <label>Isi artikel (paragraf dipisah baris kosong)<textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Paragraf pertama.&#10;&#10;Paragraf kedua." /></label>}
        <label>URL gambar sampul / tautan media (opsional)<input type="url" value={form.thumbnailUrl} onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://...jpg" /></label>
        {form.type === 'video' && <label>URL video / media (opsional)<input type="url" value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} placeholder="YouTube atau https://...mp4" /></label>}
        {form.type === 'video' && <label>URL thumbnail video (opsional)<input type="url" value={form.thumbnailUrl} onChange={e => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="Otomatis bila URL YouTube" /></label>}
        {form.type === 'gallery' && <label>URL foto (opsional)<input type="url" value={form.mediaUrl} onChange={e => setForm({ ...form, mediaUrl: e.target.value })} placeholder="https://...jpg" /></label>}
        <label>Warna kartu<select value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}><option value="gold">Emas</option><option value="blue">Biru</option><option value="red">Merah</option><option value="green">Hijau</option></select></label>
        <button className="button dark" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : (editing ? 'Simpan perubahan' : 'Terbitkan konten')} <b>→</b></button>
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
  )
}

/* ---------------- Timeline ---------------- */

function TimelineView() {
  const { items, message, setMessage, load, token } = useAdminList('/timeline')
  const [form, setForm] = useState({ year: new Date().getFullYear(), stage: '', label: '', note: '', order: 0 })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await adminRequest(token, `/timeline${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', form)
      setMessage('Tahapan timeline tersimpan.'); setForm({ year: new Date().getFullYear(), stage: '', label: '', note: '', order: 0 }); setEditing(null); load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const edit = (item) => { setEditing(item.id); setForm({ year: item.year, stage: item.stage, label: item.label || '', note: item.note || '', order: item.order || 0 }) }
  const remove = async (id) => {
    if (!window.confirm('Hapus tahapan ini?')) return
    await fetch(`${api}/admin/timeline/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <section className="admin-layout">
      <form className="content-form" onSubmit={submit}>
        <div className="form-heading"><h2>{editing ? 'Ubah tahapan' : 'Tambah tahapan'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm({ year: new Date().getFullYear(), stage: '', label: '', note: '', order: 0 }) }}>Batal</button>}</div>
        <label>Tahun<input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} required /></label>
        <label>Tahapan<input value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} placeholder="Contoh: Pengusulan proposal (submit)" required /></label>
        <label>Tanggal / jadwal<input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Contoh: Akhir Maret 2026" /></label>
        <label>Catatan<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
        <label>Urutan (1 = paling awal)<input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></label>
        <button className="button dark" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : (editing ? 'Simpan perubahan' : 'Tambah tahapan')} <b>→</b></button>
        {message && <p className="form-message">{message}</p>}
      </form>
      <section className="content-list">
        <div className="form-heading"><h2>Timeline PKM</h2><span>{items.length} tahapan</span></div>
        {[...items].sort((a, b) => b.year - a.year || a.order - b.order).map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch gold" />
            <div><p className="card-meta">{item.year} · urutan {item.order || 0}</p><h3>{item.stage}</h3><p>{item.label}{item.note ? ` — ${item.note}` : ''}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
      </section>
    </section>
  )
}

/* ---------------- Pedoman ---------------- */

function PedomanView() {
  const { items, message, setMessage, load, token } = useAdminList('/pedoman')
  const [form, setForm] = useState({ year: new Date().getFullYear(), title: '', fileUrl: '', source: '', note: '' })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await adminRequest(token, `/pedoman${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', form)
      setMessage('Pedoman tersimpan.'); setForm({ year: new Date().getFullYear(), title: '', fileUrl: '', source: '', note: '' }); setEditing(null); load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const edit = (item) => { setEditing(item.id); setForm({ year: item.year, title: item.title, fileUrl: item.fileUrl || '', source: item.source || '', note: item.note || '' }) }
  const remove = async (id) => {
    if (!window.confirm('Hapus pedoman ini?')) return
    await fetch(`${api}/admin/pedoman/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <section className="admin-layout">
      <form className="content-form" onSubmit={submit}>
        <div className="form-heading"><h2>{editing ? 'Ubah pedoman' : 'Tambah pedoman'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm({ year: new Date().getFullYear(), title: '', fileUrl: '', source: '', note: '' }) }}>Batal</button>}</div>
        <label>Tahun<input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} required /></label>
        <label>Judul dokumen<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Buku Panduan PKM 2026" required /></label>
        <label>URL file PDF / tautan unduhan<input type="url" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…pdf atau halaman unduhan" /></label>
        <label>Sumber / penerbit<input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Contoh: SIMBELMAWA" /></label>
        <label>Catatan<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
        <button className="button dark" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : (editing ? 'Simpan perubahan' : 'Tambah pedoman')} <b>→</b></button>
        {message && <p className="form-message">{message}</p>}
      </form>
      <section className="content-list">
        <div className="form-heading"><h2>Daftar pedoman</h2><span>{items.length} dokumen</span></div>
        {[...items].sort((a, b) => b.year - a.year).map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch blue" />
            <div><p className="card-meta">{item.year} · {item.source || 'Dokumen resmi'}</p><h3>{item.title}</h3><p>{item.note}{item.fileUrl ? ` — ${item.fileUrl}` : ' (belum ada tautan)'}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
      </section>
    </section>
  )
}

/* ---------------- Portofolio ---------------- */

function PortfolioView() {
  const { items, message, setMessage, load, token } = useAdminList('/portfolio')
  const [form, setForm] = useState({ year: new Date().getFullYear(), title: '', team: '', scheme: 'PKM-K', faculty: '', prodi: '', description: '', link: '' })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await adminRequest(token, `/portfolio${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', form)
      setMessage('Proposal tersimpan.'); setForm({ year: new Date().getFullYear(), title: '', team: '', scheme: 'PKM-K', faculty: '', prodi: '', description: '', link: '' }); setEditing(null); load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const edit = (item) => { setEditing(item.id); setForm({ year: item.year, title: item.title, team: item.team || '', scheme: item.scheme || 'PKM-K', faculty: item.faculty || '', prodi: item.prodi || '', description: item.description || '', link: item.link || '' }) }
  const remove = async (id) => {
    if (!window.confirm('Hapus proposal ini?')) return
    await fetch(`${api}/admin/portfolio/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <section className="admin-layout">
      <form className="content-form" onSubmit={submit}>
        <div className="form-heading"><h2>{editing ? 'Ubah proposal' : 'Tambah proposal'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm({ year: new Date().getFullYear(), title: '', team: '', scheme: 'PKM-K', faculty: '', prodi: '', description: '', link: '' }) }}>Batal</button>}</div>
        <label>Tahun pendanaan<input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} required /></label>
        <label>Judul proposal<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
        <label>Skema<select value={form.scheme} onChange={e => setForm({ ...form, scheme: e.target.value })}>{Object.keys(schemeNames).map(s => <option key={s} value={s}>{s} — {schemeNames[s]}</option>)}</select></label>
        <label>Tim (dipisah koma)<input value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} placeholder="Nama anggota tim" /></label>
        <label>Fakultas<input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="Contoh: FMIPA" /></label>
        <label>Prodi<input value={form.prodi} onChange={e => setForm({ ...form, prodi: e.target.value })} placeholder="Contoh: Ilmu Komputer" /></label>
        <label>Ringkasan proposal<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label>Tautan luaran (opsional)<input type="url" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://…" /></label>
        <button className="button dark" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : (editing ? 'Simpan perubahan' : 'Tambah proposal')} <b>→</b></button>
        {message && <p className="form-message">{message}</p>}
      </form>
      <section className="content-list">
        <div className="form-heading"><h2>Arsip proposal</h2><span>{items.length} proposal</span></div>
        {[...items].sort((a, b) => b.year - a.year).map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch green" />
            <div><p className="card-meta">{item.year} · {item.scheme || 'PKM'} · {item.faculty || '—'}</p><h3>{item.title}</h3><p>{item.team}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
      </section>
    </section>
  )
}

/* ---------------- Masukan (Kritik & Saran / Kontak) ---------------- */

function FeedbackView() {
  const { items, setItems, load, token } = useAdminList('/feedback')

  const markRead = async (id) => {
    await fetch(`${api}/admin/feedback/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    load()
  }
  const remove = async (id) => {
    if (!window.confirm('Hapus pesan ini?')) return
    await fetch(`${api}/admin/feedback/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }
  const unread = items.filter((item) => !item.read).length

  return (
    <section className="admin-feedback">
      <div className="form-heading"><h2>Masukan dari pengunjung</h2><span>{unread} belum dibaca</span></div>
      {items.length === 0 && <p className="empty-state">Belum ada masukan masuk.</p>}
      {items.map((item) => (
        <article className={`admin-item feedback-item ${item.read ? 'read' : 'unread'}`} key={item.id}>
          <div className={`admin-swatch ${item.kind === 'saran' ? 'gold' : 'blue'}`} />
          <div>
            <p className="card-meta">{item.kind === 'saran' ? 'Kritik & Saran' : 'Form Kontak'}{!item.read && ' · BARU'}</p>
            <h3>{item.name || 'Anonim'}{item.email ? ` — ${item.email}` : ''}</h3>
            <p className="feedback-message">{item.message}</p>
            <p className="feedback-date">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="admin-actions">
            {!item.read && <button onClick={() => markRead(item.id)}>Tandai dibaca</button>}
            <button onClick={() => remove(item.id)}>Hapus</button>
          </div>
        </article>
      ))}
    </section>
  )
}

/* ---------------- Statistik skema ---------------- */

function StatsView() {
  const { items, setItems, message, setMessage, token } = useAdminList('/stats')
  const [busy, setBusy] = useState(false)

  const update = (index, value) => {
    const next = [...items]
    next[index] = { ...next[index], count: Math.max(0, Number(value) || 0) }
    setItems(next)
  }
  const save = async () => {
    setBusy(true)
    try {
      await adminRequest(token, '/stats', 'PUT', items)
      setMessage('Statistik tersimpan.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  return (
    <section className="admin-stats">
      <div className="form-heading"><h2>Usulan per skema PKM</h2><span>{items.length} skema</span></div>
      <p className="section-copy">Angka ini ditampilkan pada halaman beranda (bagian "Angka per skema").</p>
      <div className="stats-editor">
        {items.map((item, index) => (
          <label className="stat-input" key={item.id ?? item.scheme}>
            <span><b>{item.scheme}</b><small>{schemeNames[item.scheme] || 'Skema PKM'}</small></span>
            <input type="number" min="0" value={item.count} onChange={(e) => update(index, e.target.value)} aria-label={`Jumlah usulan ${item.scheme}`} />
          </label>
        ))}
      </div>
      <button className="button dark" type="button" onClick={save} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan statistik'} <b>→</b></button>
      {message && <p className="form-message">{message}</p>}
    </section>
  )
}

/* ---------------- Kontak ---------------- */

function ContactView() {
  const token = localStorage.getItem('pkm_token')
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`${api}/admin/contact`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json().catch(() => null)
        if (!response.ok) {
          if (response.status === 401) { localStorage.clear(); window.location.reload(); return }
          return
        }
        setForm(result?.data || {})
      })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await adminRequest(token, '/contact', 'PUT', form)
      setMessage('Informasi kontak tersimpan.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  if (!form) return <section className="admin-feedback"><p className="form-message">Memuat…</p></section>

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  return (
    <section className="admin-layout">
      <form className="content-form" onSubmit={save}>
        <div className="form-heading"><h2>Informasi kontak</h2></div>
        <label>Alamat<textarea value={form.address || ''} onChange={set('address')} /></label>
        <label>Email<input type="email" value={form.email || ''} onChange={set('email')} /></label>
        <label>Telepon<input value={form.phone || ''} onChange={set('phone')} placeholder="(0721) 000 000" /></label>
        <label>WhatsApp<input value={form.whatsApp || ''} onChange={set('whatsApp')} placeholder="+62 812 0000 0000" /></label>
        <label>Instagram (dengan @)<input value={form.instagram || ''} onChange={set('instagram')} placeholder="@pkmcenter.unila" /></label>
        <label>Facebook<input value={form.facebook || ''} onChange={set('facebook')} /></label>
        <label>URL peta (embed)<input value={form.mapEmbed || ''} onChange={set('mapEmbed')} placeholder="https://maps.google.com/maps?q=…&output=embed" /></label>
        <button className="button dark" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan kontak'} <b>→</b></button>
        {message && <p className="form-message">{message}</p>}
      </form>
      <section className="content-list"><div className="form-heading"><h2>Pratinjau</h2></div><p className="section-copy">Data ini tampil pada halaman Kontak (#kontak). Peta menggunakan URL embed tanpa API key.</p></section>
    </section>
  )
}

/* ---------------- Panel utama ---------------- */

const TABS = [
  ['konten', 'Konten'],
  ['timeline', 'Timeline'],
  ['pedoman', 'Pedoman'],
  ['portofolio', 'Portofolio'],
  ['masukan', 'Masukan'],
  ['statistik', 'Statistik'],
  ['kontak', 'Kontak'],
]

export function AdminPanel({ user }) {
  const [view, setView] = useState('konten')

  if (user?.role !== 'admin') {
    return (
      <main>
        <PageIntro
          eyebrow="AKSES TERBATAS"
          title={<>Halaman ini<br /><em>untuk admin.</em></>}
          copy="Silakan masuk memakai akun admin untuk mengelola konten publik."
        />
      </main>
    )
  }

  return (
    <main className="admin-page">
      <PageIntro
        eyebrow="DASHBOARD ADMIN"
        title={<>Kelola ruang<br /><em>dan cerita.</em></>}
        copy="Tambah, ubah, atau hapus konten, timeline, pedoman, portofolio, dan pantau masukan pengunjung."
      />
      <div className="admin-tabs" role="tablist" aria-label="Bagian panel admin">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={view === key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>
        ))}
      </div>
      {view === 'konten' && <ContentView />}
      {view === 'timeline' && <TimelineView />}
      {view === 'pedoman' && <PedomanView />}
      {view === 'portofolio' && <PortfolioView />}
      {view === 'masukan' && <FeedbackView />}
      {view === 'statistik' && <StatsView />}
      {view === 'kontak' && <ContactView />}
    </main>
  )
}