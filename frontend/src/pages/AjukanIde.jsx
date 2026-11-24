import { useCallback, useEffect, useState } from 'react'
import { authFetch } from '../lib/studentApi'
import { api } from '../lib/content'
import { IDEA_STATUS } from '../components/ReviewerIdeaSelection'

// Tahap 2 "Seleksi Ide": mahasiswa mengajukan ide awal ke bidang tertentu,
// lalu reviewer sebidang menyeleksinya sebelum pembentukan tim dan pencarian pembimbing.
const SCHEMES = ['PKM-RE', 'PKM-RSH', 'PKM-K', 'PKM-PM', 'PKM-PI', 'PKM-KC', 'PKM-KI', 'PKM-VGK', 'PKM-GFT', 'PKM-AI']

const emptyForm = { fieldId: '', schemeCode: '', title: '', problem: '', solution: '', novelty: '', targetOutput: '' }

export function AjukanIde() {
  const [fields, setFields] = useState([])
  const [ideas, setIdeas] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadIdeas = useCallback(async () => {
    try {
      const res = await authFetch('/student/ideas')
      setIdeas(res.data || [])
    } catch (err) {
      setMessage({ type: 'error', text: `Gagal memuat riwayat ide: ${err.message}` })
    }
  }, [])

  useEffect(() => {
    fetch(`${api}/fields`).then(r => r.json()).then(r => setFields(r.data || [])).catch(() => {})
    loadIdeas()
  }, [loadIdeas])

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const startRevision = (idea) => {
    setEditingId(idea.id)
    setForm({
      fieldId: String(idea.fieldId), schemeCode: idea.schemeCode || '', title: idea.title, problem: idea.problem,
      solution: idea.solution, novelty: idea.novelty || '', targetOutput: idea.targetOutput || '',
    })
    setMessage({ type: '', text: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const body = JSON.stringify({ ...form, fieldId: Number(form.fieldId) })
      if (editingId) await authFetch(`/student/ideas/${editingId}`, { method: 'PUT', body })
      else await authFetch('/student/ideas', { method: 'POST', body })
      setMessage({ type: 'success', text: editingId ? 'Ide diperbarui dan diajukan ulang ke reviewer.' : 'Ide berhasil diajukan. Tunggu hasil seleksi dari reviewer bidang.' })
      setEditingId(null)
      setForm(emptyForm)
      loadIdeas()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="module-container ideaform-page">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">TAHAP 2 · SELEKSI IDE</div>
            <h1 className="module-title">Ajukan Ide PKM</h1>
            <p className="module-subtitle">
              Ajukan gagasan awalmu sebelum membentuk tim. Reviewer dari bidang yang sesuai akan menyeleksi ide, dan ide yang lolos lanjut ke pembentukan tim serta pencarian dosen pembimbing.
            </p>
          </div>
        </div>
      </section>

      <div className="ideaform-layout">
        <form className="ideaform-card" onSubmit={submit}>
          <h2>{editingId ? 'Perbaiki Ide' : 'Form Pengajuan Ide'}</h2>
          {message.text && <div className={`ideaform-alert ${message.type}`}>{message.text}</div>}

          <div className="ideaform-grid">
            <label className="idea-field">
              <span>Bidang ide *</span>
              <select value={form.fieldId} onChange={update('fieldId')} required>
                <option value="">Pilih bidang</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
            <label className="idea-field">
              <span>Rencana skema (opsional)</span>
              <select value={form.schemeCode} onChange={update('schemeCode')}>
                <option value="">Belum tahu</option>
                {SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <label className="idea-field">
            <span>Judul ide *</span>
            <input type="text" maxLength={255} value={form.title} onChange={update('title')} required placeholder="Contoh: Sensor kelembapan tanah murah untuk petani lada" />
          </label>
          <label className="idea-field">
            <span>Permasalahan yang diangkat *</span>
            <textarea rows={4} value={form.problem} onChange={update('problem')} required placeholder="Masalah nyata apa yang ingin diselesaikan, dan siapa yang mengalaminya?" />
          </label>
          <label className="idea-field">
            <span>Solusi yang ditawarkan *</span>
            <textarea rows={4} value={form.solution} onChange={update('solution')} required placeholder="Bagaimana idemu menyelesaikan masalah itu?" />
          </label>
          <label className="idea-field">
            <span>Kebaruan dibanding solusi yang sudah ada</span>
            <textarea rows={3} value={form.novelty} onChange={update('novelty')} />
          </label>
          <label className="idea-field">
            <span>Target luaran</span>
            <textarea rows={2} value={form.targetOutput} onChange={update('targetOutput')} placeholder="Contoh: prototipe alat, artikel ilmiah, HKI" />
          </label>

          <div className="ideaform-actions">
            {editingId && <button type="button" className="btn-action secondary" onClick={cancelEdit} disabled={saving}>Batal</button>}
            <button type="submit" className="btn-action primary" disabled={saving}>
              {saving ? 'Mengirim...' : editingId ? 'Ajukan Ulang' : 'Ajukan Ide'}
            </button>
          </div>
        </form>

        <section className="ideaform-history">
          <h2>Riwayat Ide</h2>
          {ideas.length === 0 ? (
            <div className="idea-empty">Belum ada ide yang diajukan.</div>
          ) : (
            ideas.map(idea => {
              const st = IDEA_STATUS[idea.status] || IDEA_STATUS.submitted
              return (
                <article key={idea.id} className="idea-card">
                  <div className="idea-card-head">
                    <span className="idea-tag">{idea.fieldName}</span>
                    <span className={`status-pill ${st.pill}`}>{st.label}</span>
                  </div>
                  <h3 className="idea-title">{idea.title}</h3>
                  <p className="idea-meta">Diajukan {new Date(idea.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  {idea.status !== 'submitted' && (idea.reviewerNote || idea.score != null) && (
                    <div className="idea-review-note">
                      <strong>Catatan reviewer</strong>
                      {idea.score != null && <span> · Skor {Number(idea.score)}</span>}
                      {idea.reviewerNote && <p>{idea.reviewerNote}</p>}
                    </div>
                  )}
                  {idea.status === 'accepted' && (
                    <div className="idea-card-actions">
                      <a className="btn-action primary" href="#mahasiswa/tim" style={{ textDecoration: 'none' }}>Lanjut Bentuk Tim</a>
                    </div>
                  )}
                  {idea.status === 'revision' && (
                    <div className="idea-card-actions">
                      <button type="button" className="btn-action primary" onClick={() => startRevision(idea)}>Perbaiki Ide</button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
