import { useEffect, useMemo, useRef, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { api, schemeNames } from '../lib/content'
import { getAuthToken } from '../lib/authSession'

const blankContent = { type: 'news', title: '', category: '', description: '', body: '', mediaUrl: '', thumbnailUrl: '', color: 'gold' }

function useAdminList(path) {
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const token = getAuthToken()
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

/* ---------------- Pagination & pencarian daftar ---------------- */

const PAGE_SIZE = 6

// usePaged memotong daftar per halaman dan menyaring dengan kata kunci.
// fieldsOf(item) mengembalikan teks yang ikut dicari.
function usePaged(items, fieldsOf, size = PAGE_SIZE) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(item => fieldsOf(item).filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [items, query]) // eslint-disable-line react-hooks/exhaustive-deps
  const pageCount = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, pageCount)
  const pageItems = filtered.slice((current - 1) * size, current * size)
  const search = (value) => { setQuery(value); setPage(1) }
  return { query, search, page: current, setPage, pageCount, pageItems, total: filtered.length, size }
}

function ListSearch({ paged, placeholder = 'Cari...' }) {
  return (
    <div className="admin-list-search">
      <input type="search" value={paged.query} onChange={e => paged.search(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  )
}

function Pager({ paged }) {
  const { page, pageCount, setPage, total, size } = paged
  if (total === 0) return null
  const from = (page - 1) * size + 1
  const to = Math.min(page * size, total)
  const pages = []
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  const go = (n) => { setPage(n) }
  return (
    <nav className="admin-pager" aria-label="Halaman daftar">
      <span className="admin-pager-info">{from}-{to} dari {total}</span>
      {pageCount > 1 && (
        <div className="admin-pager-buttons">
          <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya">‹</button>
          {pages.map((n, i) => n === '...'
            ? <span key={`gap-${i}`} className="admin-pager-gap">...</span>
            : <button type="button" key={n} className={n === page ? 'active' : ''} aria-current={n === page ? 'page' : undefined} onClick={() => go(n)}>{n}</button>)}
          <button type="button" onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="Halaman berikutnya">›</button>
        </div>
      )}
    </nav>
  )
}

/* ---------------- Konten (Berita / Video / Galeri) ---------------- */

function ContentView() {
  const { items, message, setMessage, load, token } = useAdminList('/content')
  const [form, setForm] = useState(blankContent)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const typed = useMemo(() => typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter), [items, typeFilter])
  const paged = usePaged(typed, i => [i.title, i.category, i.description])

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
    document.querySelector('.admin-layout .content-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        <div className="admin-list-tools">
          <ListSearch paged={paged} placeholder="Cari judul atau kategori..." />
          <div className="admin-chip-group" role="group" aria-label="Saring jenis konten">
            {[['all', 'Semua'], ['news', 'Berita'], ['video', 'Video'], ['gallery', 'Galeri']].map(([key, label]) => (
              <button type="button" key={key} className={typeFilter === key ? 'active' : ''} onClick={() => { setTypeFilter(key); paged.setPage(1) }}>{label}</button>
            ))}
          </div>
        </div>
        {paged.total === 0 && <p className="empty-state">Tidak ada konten yang cocok.</p>}
        {paged.pageItems.map(item => (
          <article className="admin-item" key={item.id}>
            <div className={`admin-swatch ${item.color}`} />
            <div><p className="card-meta">{item.type} · {item.category || 'Tanpa kategori'}</p><h3>{item.title}</h3><p>{item.description}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
        <Pager paged={paged} />
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
  const sorted = useMemo(() => [...items].sort((a, b) => b.year - a.year || a.order - b.order), [items])
  const paged = usePaged(sorted, i => [String(i.year), i.stage, i.label, i.note])

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
        <ListSearch paged={paged} placeholder="Cari tahun atau tahapan..." />
        {paged.total === 0 && <p className="empty-state">Tidak ada tahapan yang cocok.</p>}
        {paged.pageItems.map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch gold" />
            <div><p className="card-meta">{item.year} · urutan {item.order || 0}</p><h3>{item.stage}</h3><p>{item.label}{item.note ? ` · ${item.note}` : ''}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
        <Pager paged={paged} />
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
  const sorted = useMemo(() => [...items].sort((a, b) => b.year - a.year), [items])
  const paged = usePaged(sorted, i => [String(i.year), i.title, i.source, i.note])

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
        <ListSearch paged={paged} placeholder="Cari judul atau tahun..." />
        {paged.total === 0 && <p className="empty-state">Tidak ada pedoman yang cocok.</p>}
        {paged.pageItems.map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch blue" />
            <div><p className="card-meta">{item.year} · {item.source || 'Dokumen resmi'}</p><h3>{item.title}</h3><p>{item.note}{item.fileUrl ? ` · ${item.fileUrl}` : ' (belum ada tautan)'}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
        <Pager paged={paged} />
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
  const sorted = useMemo(() => [...items].sort((a, b) => b.year - a.year), [items])
  const paged = usePaged(sorted, i => [String(i.year), i.title, i.team, i.scheme, i.faculty, i.prodi])

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
        <label>Skema<select value={form.scheme} onChange={e => setForm({ ...form, scheme: e.target.value })}>{Object.keys(schemeNames).map(s => <option key={s} value={s}>{s} · {schemeNames[s]}</option>)}</select></label>
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
        <ListSearch paged={paged} placeholder="Cari judul, tim, skema, fakultas..." />
        {paged.total === 0 && <p className="empty-state">Tidak ada proposal yang cocok.</p>}
        {paged.pageItems.map(item => (
          <article className="admin-item" key={item.id}>
            <div className="admin-swatch green" />
            <div><p className="card-meta">{item.year} · {item.scheme || 'PKM'} · {item.faculty || '-'}</p><h3>{item.title}</h3><p>{item.team}</p></div>
            <div className="admin-actions"><button onClick={() => edit(item)}>Ubah</button><button onClick={() => remove(item.id)}>Hapus</button></div>
          </article>
        ))}
        <Pager paged={paged} />
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
  const [readFilter, setReadFilter] = useState('all')
  const shown = useMemo(() => readFilter === 'unread' ? items.filter(i => !i.read) : items, [items, readFilter])
  const paged = usePaged(shown, i => [i.name, i.email, i.message])

  return (
    <section className="admin-feedback">
      <div className="form-heading"><h2>Masukan dari pengunjung</h2><span>{unread} belum dibaca</span></div>
      {items.length === 0 && <p className="empty-state">Belum ada masukan masuk.</p>}
      {items.length > 0 && (
        <div className="admin-list-tools">
          <ListSearch paged={paged} placeholder="Cari nama, email, atau isi pesan..." />
          <div className="admin-chip-group" role="group" aria-label="Saring masukan">
            {[['all', 'Semua'], ['unread', 'Belum dibaca']].map(([key, label]) => (
              <button type="button" key={key} className={readFilter === key ? 'active' : ''} onClick={() => { setReadFilter(key); paged.setPage(1) }}>{label}</button>
            ))}
          </div>
        </div>
      )}
      {items.length > 0 && paged.total === 0 && <p className="empty-state">Tidak ada masukan yang cocok.</p>}
      {paged.pageItems.map((item) => (
        <article className={`admin-item feedback-item ${item.read ? 'read' : 'unread'}`} key={item.id}>
          <div className={`admin-swatch ${item.kind === 'saran' ? 'gold' : 'blue'}`} />
          <div>
            <p className="card-meta">{item.kind === 'saran' ? 'Kritik & Saran' : 'Form Kontak'}{!item.read && ' · BARU'}</p>
            <h3>{item.name || 'Anonim'}{item.email ? ` · ${item.email}` : ''}</h3>
            <p className="feedback-message">{item.message}</p>
            <p className="feedback-date">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="admin-actions">
            {!item.read && <button onClick={() => markRead(item.id)}>Tandai dibaca</button>}
            <button onClick={() => remove(item.id)}>Hapus</button>
          </div>
        </article>
      ))}
      <Pager paged={paged} />
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
      <p className="section-copy">Dihitung otomatis dari data proposal (status bukan draf) melalui view <code>v_scheme_stats</code>, tidak dapat diubah manual. Total {total} usulan.</p>
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
  const token = getAuthToken()
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
  const token = getAuthToken()

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

/* ---------------- Bidang reviewer (akses seleksi ide & proposal) ---------------- */

function ReviewerFieldsView() {
  const { items, load, token, message } = useAdminList('/reviewers')
  const [fields, setFields] = useState([])
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState('')
  const [notice, setNotice] = useState('')
  const paged = usePaged(items, r => [r.name, r.email])

  useEffect(() => {
    fetch(`${api}/fields`).then(r => r.json()).then(r => setFields(r.data || [])).catch(() => {})
  }, [])

  const selected = (reviewer) => draft[reviewer.id] ?? reviewer.fieldIds ?? []
  const toggle = (reviewer, fieldId) => {
    const current = selected(reviewer)
    const next = current.includes(fieldId) ? current.filter(id => id !== fieldId) : [...current, fieldId]
    setDraft(d => ({ ...d, [reviewer.id]: next }))
  }
  const save = async (reviewer) => {
    setSaving(reviewer.id)
    try {
      await adminRequest(token, `/reviewers/${reviewer.id}/fields`, 'PUT', { fieldIds: selected(reviewer) })
      setDraft(d => { const n = { ...d }; delete n[reviewer.id]; return n })
      setNotice(`Bidang ${reviewer.name} tersimpan.`)
      load()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setSaving('')
    }
  }

  return (
    <section className="admin-reviewer-fields">
      <div className="form-heading"><h2>Bidang reviewer</h2><span>Reviewer hanya melihat ide dan proposal dari bidang yang dicentang</span></div>
      {(notice || message) && <p className="form-message">{notice || message}</p>}
      {items.length === 0 && <p className="empty-state">Belum ada akun dengan peran reviewer.</p>}
      {items.length > 0 && <ListSearch paged={paged} placeholder="Cari nama atau email reviewer..." />}
      {items.length > 0 && paged.total === 0 && <p className="empty-state">Tidak ada reviewer yang cocok.</p>}
      {paged.pageItems.map((reviewer) => (
        <article className="admin-item reviewer-field-item" key={reviewer.id}>
          <div>
            <h3>{reviewer.name}</h3>
            <p className="card-meta">{reviewer.email}</p>
            <div className="reviewer-field-options">
              {fields.map((field) => (
                <label key={field.id} className={selected(reviewer).includes(field.id) ? 'checked' : ''}>
                  <input type="checkbox" checked={selected(reviewer).includes(field.id)} onChange={() => toggle(reviewer, field.id)} />
                  {field.name}
                </label>
              ))}
            </div>
          </div>
          <div className="admin-actions">
            <button onClick={() => save(reviewer)} disabled={saving === reviewer.id || !draft[reviewer.id]}>
              {saving === reviewer.id ? 'Menyimpan...' : 'Simpan bidang'}
            </button>
          </div>
        </article>
      ))}
      <Pager paged={paged} />
    </section>
  )
}

/* ---------------- Periode PKM ---------------- */

const PERIOD_STATUS = {
  draft: ['Draf', 'Belum terlihat oleh mahasiswa'],
  open: ['Dibuka', 'Periode aktif: tim dan usulan baru masuk ke sini'],
  closed: ['Ditutup', 'Pendaftaran selesai, data tetap tersimpan'],
  archived: ['Diarsipkan', 'Periode lama'],
}
const blankPeriod = () => {
  const year = new Date().getFullYear() + 1
  return { name: `PKM ${year}`, year, registrationStart: '', registrationEnd: '', status: 'draft' }
}
const dateInput = (value) => (value ? String(value).slice(0, 10) : '')
const dateLabel = (value) => (value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null)

function PeriodView() {
  const { items, message, setMessage, load, token } = useAdminList('/periods')
  const [form, setForm] = useState(blankPeriod)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState('')
  const paged = usePaged(items, i => [i.name, String(i.year), PERIOD_STATUS[i.status]?.[0]])
  const openPeriod = items.find(i => i.status === 'open')

  const reset = () => { setEditing(null); setForm(blankPeriod()) }
  const submit = async (event) => {
    event.preventDefault()
    if (form.status === 'open' && openPeriod && openPeriod.id !== editing &&
      !window.confirm(`${openPeriod.name} sedang dibuka dan akan otomatis ditutup. Lanjutkan?`)) return
    setBusy('form')
    try {
      await adminRequest(token, `/periods${editing ? `/${editing}` : ''}`, editing ? 'PUT' : 'POST', form)
      setMessage(editing ? 'Periode tersimpan.' : 'Periode baru dibuat beserta tahapannya.')
      reset(); load()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }
  const edit = (item) => {
    setEditing(item.id)
    setForm({ name: item.name, year: item.year, registrationStart: dateInput(item.registrationStart), registrationEnd: dateInput(item.registrationEnd), status: item.status })
    document.querySelector('.admin-layout .content-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const setStatus = async (item, status) => {
    if (status === 'open' && openPeriod && openPeriod.id !== item.id &&
      !window.confirm(`Buka ${item.name}? ${openPeriod.name} akan otomatis ditutup.`)) return
    setBusy(item.id)
    try {
      await adminRequest(token, `/periods/${item.id}`, 'PUT', { name: item.name, year: item.year, registrationStart: dateInput(item.registrationStart), registrationEnd: dateInput(item.registrationEnd), status })
      setMessage(`${item.name} sekarang ${PERIOD_STATUS[status][0].toLowerCase()}.`)
      load()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }
  const remove = async (item) => {
    if (!window.confirm(`Hapus ${item.name}? Tindakan ini tidak bisa dibatalkan.`)) return
    setBusy(item.id)
    try {
      await adminRequest(token, `/periods/${item.id}`, 'DELETE')
      setMessage('Periode dihapus.'); if (editing === item.id) reset(); load()
    } catch (error) { setMessage(error.message) } finally { setBusy('') }
  }

  return (
    <section className="admin-layout">
      <form className="content-form" onSubmit={submit}>
        <div className="form-heading"><h2>{editing ? 'Ubah periode' : 'Periode baru'}</h2>{editing && <button type="button" onClick={reset}>Batal</button>}</div>
        <p className="section-copy admin-form-note">Tim, usulan, dan pilihan rencana mahasiswa dihitung per periode. Buka periode baru tiap tahun supaya mahasiswa bisa mulai lagi, termasuk yang tahun lalu jadi anggota dan kini ingin jadi ketua.</p>
        <label>Nama periode<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: PKM 2027" required /></label>
        <label>Tahun<input type="number" min="2000" max="2100" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} required /></label>
        <div className="admin-form-row">
          <label>Mulai pendaftaran<input type="date" value={form.registrationStart} onChange={e => setForm({ ...form, registrationStart: e.target.value })} /></label>
          <label>Akhir pendaftaran<input type="date" value={form.registrationEnd} min={form.registrationStart || undefined} onChange={e => setForm({ ...form, registrationEnd: e.target.value })} /></label>
        </div>
        <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {Object.entries(PERIOD_STATUS).map(([key, [label]]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <p className="admin-form-hint">{PERIOD_STATUS[form.status]?.[1]}. Hanya satu periode yang bisa dibuka sekaligus.</p>
        <button className="button dark" type="submit" disabled={busy === 'form'}>{busy === 'form' ? 'Menyimpan...' : (editing ? 'Simpan perubahan' : 'Buat periode')} <b>→</b></button>
        {message && <p className="form-message">{message}</p>}
      </form>
      <section className="content-list">
        <div className="form-heading"><h2>Periode PKM</h2><span>{openPeriod ? `Aktif: ${openPeriod.name}` : 'Belum ada yang dibuka'}</span></div>
        {items.length > 4 && <ListSearch paged={paged} placeholder="Cari nama atau tahun..." />}
        {items.length === 0 && <p className="empty-state">Belum ada periode.</p>}
        {paged.pageItems.map(item => {
          const range = [dateLabel(item.registrationStart), dateLabel(item.registrationEnd)].filter(Boolean).join(' s.d. ')
          const used = item.teamCount > 0 || item.proposalCount > 0
          return (
            <article className={`admin-item period-item status-${item.status}`} key={item.id}>
              <div className={`admin-swatch ${item.status === 'open' ? 'green' : item.status === 'draft' ? 'gold' : 'blue'}`} />
              <div>
                <p className="card-meta">{item.year} · <span className={`period-badge ${item.status}`}>{PERIOD_STATUS[item.status]?.[0] || item.status}</span></p>
                <h3>{item.name}</h3>
                <p>{range ? `Pendaftaran ${range}` : 'Jadwal pendaftaran belum diisi'}</p>
                <p className="period-counts">{item.teamCount} tim · {item.proposalCount} usulan · {item.stageCount} tahapan</p>
              </div>
              <div className="admin-actions">
                {item.status !== 'open' && <button type="button" className="primary" disabled={busy === item.id} onClick={() => setStatus(item, 'open')}>Buka periode</button>}
                {item.status === 'open' && <button type="button" disabled={busy === item.id} onClick={() => setStatus(item, 'closed')}>Tutup</button>}
                <button type="button" onClick={() => edit(item)}>Ubah</button>
                {!used && <button type="button" className="danger" disabled={busy === item.id} onClick={() => remove(item)}>Hapus</button>}
              </div>
            </article>
          )
        })}
        <Pager paged={paged} />
      </section>
    </section>
  )
}

const TABS = [
  ['periode', 'Periode PKM'],
  ['konten', 'Konten'],
  ['timeline', 'Timeline'],
  ['pedoman', 'Pedoman'],
  ['portofolio', 'Portofolio'],
  ['masukan', 'Masukan'],
  ['reviewer', 'Bidang Reviewer'],
  ['statistik', 'Statistik'],
  ['kontak', 'Kontak'],
  ['ai-gateway', 'AI Gateway'],
]

// Bar tab satu baris yang bisa digeser: roda mouse menggeser ke samping, tombol panah
// muncul di tepi bila masih ada tab tersembunyi, dan tab aktif selalu digulir agar terlihat.
function AdminTabs({ active, onChange }) {
  const scrollerRef = useRef(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const update = () => setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    const btn = el?.querySelector('button.active')
    if (!el || !btn) return
    const left = btn.offsetLeft - el.offsetLeft
    if (left < el.scrollLeft || left + btn.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: left - el.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' })
    }
  }, [active])

  const nudge = (dir) => {
    const el = scrollerRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' })
  }

  return (
    <div className={['admin-tabs-bar', edges.left && 'can-left', edges.right && 'can-right'].filter(Boolean).join(' ')}>
      {edges.left && <button type="button" className="admin-tabs-arrow left" onClick={() => nudge(-1)} aria-label="Geser tab ke kiri">‹</button>}
      <div className="admin-tabs" ref={scrollerRef} role="tablist" aria-label="Bagian panel admin">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={active === key} className={active === key ? 'active' : ''} onClick={() => onChange(key)}>{label}</button>
        ))}
      </div>
      {edges.right && <button type="button" className="admin-tabs-arrow right" onClick={() => nudge(1)} aria-label="Geser tab ke kanan">›</button>}
    </div>
  )
}

export function AdminPanel({ user }) {
  const [view, setView] = useState(() => {
    try { return sessionStorage.getItem('pkm_admin_tab') || 'periode' } catch { return 'periode' }
  })
  const changeView = (key) => {
    setView(key)
    try { sessionStorage.setItem('pkm_admin_tab', key) } catch { /* abaikan */ }
  }
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
      <header className="admin-head">
        <p className="eyebrow">DASHBOARD ADMIN</p>
        <h1>Panel <em>PKM Center</em></h1>
        <p>Kelola periode PKM, konten publik, timeline, pedoman, portofolio, masukan pengunjung, dan AI Gateway.</p>
      </header>
      <AdminTabs active={view} onChange={changeView} />
      {view === 'periode' && <PeriodView />}
      {view === 'konten' && <ContentView />}
      {view === 'timeline' && <TimelineView />}
      {view === 'pedoman' && <PedomanView />}
      {view === 'portofolio' && <PortfolioView />}
      {view === 'masukan' && <FeedbackView />}
      {view === 'reviewer' && <ReviewerFieldsView />}
      {view === 'statistik' && <StatsView />}
      {view === 'kontak' && <ContactView />}
      {view === 'ai-gateway' && <AIGatewayView />}
    </main>
  )
}