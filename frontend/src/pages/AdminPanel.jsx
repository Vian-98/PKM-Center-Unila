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
  const { items, message } = useAdminList('/stats')
  const total = items.reduce((sum, item) => sum + (item.count || 0), 0)

  return (
    <section className="admin-stats">
      <div className="form-heading"><h2>Usulan per skema PKM</h2><span>{items.length} skema</span></div>
      <p className="section-copy">Dihitung otomatis dari data proposal (status bukan draf) melalui view <code>v_scheme_stats</code> — tidak dapat diubah manual. Total {total} usulan.</p>
      <div className="stats-editor">
        {items.map((item) => (
          <div className="stat-input" key={item.scheme}>
            <span><b>{item.scheme}</b><small>{schemeNames[item.scheme] || 'Skema PKM'}</small></span>
            <strong className="stat-value">{item.count ?? 0}</strong>
          </div>
        ))}
      </div>
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

/* ---------------- AI Gateway (9Router & PKMATE) ---------------- */

function AIGatewayView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const token = localStorage.getItem('pkm_token')

  const fetchStatus = () => {
    setRefreshing(true)
    fetch(`${api}/admin/ai/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        setData(res)
        setLoading(false)
        setRefreshing(false)
      })
      .catch(() => {
        fetch(`${api}/ai/status`)
          .then(r => r.json())
          .then(res => {
            setData({
              gatewayStatus: res.gatewayStatus,
              gatewayCode: res.gatewayCode,
              gatewayUrl: res.gatewayUrl,
              activeModel: res.activeModel,
              totalAnalyses: 0,
              recentAnalyses: []
            })
            setLoading(false)
            setRefreshing(false)
          })
          .catch(() => {
            setData({ gatewayStatus: 'offline', gatewayCode: 503 })
            setLoading(false)
            setRefreshing(false)
          })
      })
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <section className="admin-ai-gateway" style={{ padding: '2.5rem 5.5vw 5rem', maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box' }}>
        <p className="section-copy">Memeriksa konektivitas dan status AI Gateway 9Router…</p>
      </section>
    )
  }

  const isOnline = data?.gatewayStatus === 'online'

  return (
    <section className="admin-ai-gateway" style={{ padding: '2.5rem 5.5vw 5rem', maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div className="form-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>

        <div>
          <h2>Monitoring AI Gateway (9Router & PKMATE)</h2>
          <p className="section-copy">Pemantauan infrastruktur AI lokal, status koneksi 9Router, dan statistik penggunaan PKMATE.</p>
        </div>
        <button
          className="button dark"
          onClick={fetchStatus}
          disabled={refreshing}
          style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
        >
          {refreshing ? 'Memeriksa…' : 'Segarkan Status'} <b>↻</b>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1rem', marginBottom: '2rem' }}>
        {/* Card 1: Status Gateway */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Status 9Router Gateway</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isOnline ? '#10b981' : '#ef4444',
              boxShadow: isOnline ? '0 0 10px rgba(16, 185, 129, 0.7)' : 'none'
            }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isOnline ? '#059669' : '#dc2626' }}>
              {isOnline ? 'Online & Terhubung' : 'Terputus (Offline)'}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.6rem' }}>
            Endpoint: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#0f172a' }}>{data?.gatewayUrl || 'http://9router:20128/v1'}</code>
          </div>
        </div>

        {/* Card 2: Model Aktif */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Combo / Model Aktif</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {data?.activeModel || 'pkm-brainstorming'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.6rem' }}>
            Model Engine: <span style={{ color: '#0071e3', fontWeight: 600 }}>Claude Sonnet 4.6 / Gemini Flash</span>
          </div>
        </div>

        {/* Card 3: Total Konsultasi */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Total Konsultasi PKMATE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0071e3' }}>
            {data?.totalAnalyses ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            Tersimpan di tabel <code>ai_analyses</code>
          </div>
        </div>
      </div>

      {/* Akses Cepat Dashboard 9Router */}
      <div style={{ background: 'linear-gradient(135deg, #071938, #0f2e5c)', color: '#fff', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Dashboard Internal 9Router (Port 20128)</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Kelola API key, pantau token usage, atur prioritas model (Tier 1-3), atau ganti provider LLM.
          </p>
        </div>
        <a
          href={import.meta.env.VITE_9ROUTER_URL || `${window.location.protocol}//${window.location.hostname}:20128`}
          target="_blank"
          rel="noreferrer"
          className="button"
          style={{ background: '#0071e3', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' }}
        >
          Buka 9Router UI ↗
        </a>
      </div>

      {/* Log Analisis Terbaru */}
      <div className="content-list">
        <div className="form-heading">
          <h2>Log Konsultasi AI Terakhir</h2>
          <p className="section-copy">Daftar sesi konsultasi ide mahasiswa yang diproses oleh PKMATE.</p>
        </div>
        {(!data?.recentAnalyses || data.recentAnalyses.length === 0) ? (
          <p className="section-copy">Belum ada riwayat aktivitas brainstorming.</p>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>Waktu</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>Model</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>Pertanyaan / Ide</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#475569' }}>Ringkasan Hasil</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAnalyses.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                        {item.modelName || '9router'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b' }}>
                      {item.inputText}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>
                      {item.outputText?.replace(/#/g, '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  ['ai-gateway', 'AI Gateway (9Router)'],
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
        copy="Tambah, ubah, atau hapus konten, timeline, pedoman, portofolio, dan pantau masukan pengunjung serta AI Gateway."
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
      {view === 'ai-gateway' && <AIGatewayView />}
    </main>
  )
}