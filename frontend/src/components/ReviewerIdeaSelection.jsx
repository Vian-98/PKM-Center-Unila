import { useCallback, useEffect, useMemo, useState } from 'react'
import { authFetch } from '../lib/studentApi'

// Tahap 2 "Seleksi Ide": reviewer menyeleksi ide awal mahasiswa dari bidang yang dipegangnya.
export const IDEA_STATUS = {
  submitted: { label: 'Menunggu Seleksi', pill: 'pending' },
  accepted: { label: 'Lolos Seleksi Ide', pill: 'accepted' },
  revision: { label: 'Perlu Revisi', pill: 'in_progress' },
  rejected: { label: 'Tidak Lolos', pill: 'rejected' },
}

const DECISIONS = [
  { value: 'accepted', label: 'Lolos', hint: 'Mahasiswa lanjut ke pembentukan tim dan pencarian pembimbing.' },
  { value: 'revision', label: 'Perlu Revisi', hint: 'Mahasiswa memperbaiki ide lalu mengajukan ulang.' },
  { value: 'rejected', label: 'Tidak Lolos', hint: 'Ide tidak dilanjutkan ke tahap berikutnya.' },
]

const emptyDecision = { idea: null, decision: 'accepted', note: '', score: '' }

export function ReviewerIdeaSelection() {
  const [fields, setFields] = useState([])
  const [allFields, setAllFields] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [fieldFilter, setFieldFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(emptyDecision)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [fieldRes, ideaRes] = await Promise.all([authFetch('/reviewer/fields'), authFetch('/reviewer/ideas')])
      setFields(fieldRes.data || [])
      setAllFields(Boolean(fieldRes.allFields))
      setIdeas(ideaRes.data || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c = { all: ideas.length }
    Object.keys(IDEA_STATUS).forEach(s => { c[s] = ideas.filter(i => i.status === s).length })
    return c
  }, [ideas])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ideas.filter(i =>
      (statusFilter === 'all' || i.status === statusFilter) &&
      (fieldFilter === 'all' || String(i.fieldId) === fieldFilter) &&
      (!q || [i.title, i.studentName, i.studentNpm, i.faculty].some(v => (v || '').toLowerCase().includes(q)))
    )
  }, [ideas, statusFilter, fieldFilter, search])

  const openDecision = (idea) => setModal({
    idea,
    decision: idea.status === 'submitted' ? 'accepted' : idea.status,
    note: idea.reviewerNote || '',
    score: idea.score ?? '',
  })

  const submitDecision = async (e) => {
    e.preventDefault()
    const { idea, decision, note, score } = modal
    if (decision !== 'accepted' && !note.trim()) {
      alert('Tulis catatan agar mahasiswa tahu apa yang perlu diperbaiki.')
      return
    }
    setSaving(true)
    try {
      await authFetch(`/reviewer/ideas/${idea.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note: note.trim(), score: score === '' ? null : Number(score) }),
      })
      setModal(emptyDecision)
      await load()
    } catch (err) {
      alert(`Keputusan gagal disimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="idea-selection">
      <div className="idea-fields-bar">
        <span className="idea-fields-label">Bidang yang Anda pegang:</span>
        {allFields ? (
          <span className="idea-field-chip">Semua bidang (admin)</span>
        ) : fields.length === 0 ? (
          <span className="idea-field-chip warn">Belum ada bidang. Minta admin menetapkan bidang Anda.</span>
        ) : (
          fields.map(f => <span key={f.id} className="idea-field-chip">{f.name}</span>)
        )}
      </div>

      <div className="idea-toolbar">
        <div className="modern-tabs idea-status-tabs">
          {[['submitted', 'Menunggu'], ['accepted', 'Lolos'], ['revision', 'Revisi'], ['rejected', 'Tidak Lolos'], ['all', 'Semua']].map(([key, label]) => (
            <button key={key} type="button" className={`tab-btn ${statusFilter === key ? 'active' : ''}`} onClick={() => setStatusFilter(key)}>
              {label} ({counts[key] || 0})
            </button>
          ))}
        </div>
        <div className="idea-toolbar-row">
          {(allFields || fields.length > 1) && (
            <select className="idea-select" value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}>
              <option value="all">Semua bidang</option>
              {fields.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
            </select>
          )}
          <input className="idea-search" type="text" placeholder="Cari judul, nama, NPM, fakultas..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="idea-error">Gagal memuat data seleksi ide: {error}</div>}

      {loading ? (
        <div className="idea-empty">Memuat ide yang masuk...</div>
      ) : visible.length === 0 ? (
        <div className="idea-empty">
          {ideas.length === 0
            ? 'Belum ada ide yang masuk dari bidang Anda.'
            : 'Tidak ada ide yang sesuai dengan filter.'}
        </div>
      ) : (
        <div className="idea-list">
          {visible.map(idea => {
            const st = IDEA_STATUS[idea.status] || IDEA_STATUS.submitted
            return (
              <article key={idea.id} className="idea-card">
                <div className="idea-card-head">
                  <div className="idea-card-tags">
                    <span className="idea-tag">{idea.fieldName}</span>
                    {idea.schemeCode && <span className="idea-tag scheme">{idea.schemeCode}</span>}
                  </div>
                  <span className={`status-pill ${st.pill}`}>{st.label}</span>
                </div>
                <h3 className="idea-title">{idea.title}</h3>
                <p className="idea-meta">
                  {idea.studentName}{idea.studentNpm ? ` · ${idea.studentNpm}` : ''}{idea.faculty ? ` · ${idea.faculty}` : ''}
                  {' · '}{new Date(idea.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <dl className="idea-body">
                  <div><dt>Permasalahan</dt><dd>{idea.problem}</dd></div>
                  <div><dt>Solusi yang ditawarkan</dt><dd>{idea.solution}</dd></div>
                  {idea.novelty && <div><dt>Kebaruan</dt><dd>{idea.novelty}</dd></div>}
                  {idea.targetOutput && <div><dt>Target luaran</dt><dd>{idea.targetOutput}</dd></div>}
                </dl>
                {idea.status !== 'submitted' && (
                  <div className="idea-review-note">
                    <strong>{idea.reviewerName || 'Reviewer'}</strong>
                    {idea.score != null && <span> · Skor {Number(idea.score)}</span>}
                    {idea.reviewerNote && <p>{idea.reviewerNote}</p>}
                  </div>
                )}
                <div className="idea-card-actions">
                  <button type="button" className="btn-action primary" onClick={() => openDecision(idea)}>
                    {idea.status === 'submitted' ? 'Seleksi Ide' : 'Ubah Keputusan'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {modal.idea && (
        <div className="modal-overlay" onClick={() => !saving && setModal(emptyDecision)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <form onSubmit={submitDecision}>
              <div className="modal-dialog-header">
                <h3>Keputusan Seleksi Ide</h3>
                <button type="button" className="modal-close-btn" onClick={() => setModal(emptyDecision)} disabled={saving}>x</button>
              </div>
              <div className="modal-dialog-body idea-modal-body">
                <p className="idea-modal-title">{modal.idea.title}</p>
                <div className="idea-decision-grid">
                  {DECISIONS.map(d => (
                    <label key={d.value} className={`idea-decision ${d.value} ${modal.decision === d.value ? 'selected' : ''}`}>
                      <input type="radio" name="decision" value={d.value} checked={modal.decision === d.value} onChange={() => setModal(m => ({ ...m, decision: d.value }))} />
                      <strong>{d.label}</strong>
                      <span>{d.hint}</span>
                    </label>
                  ))}
                </div>
                <label className="idea-field">
                  <span>Skor ide (0-100, opsional)</span>
                  <input type="number" min="0" max="100" step="1" value={modal.score} onChange={e => setModal(m => ({ ...m, score: e.target.value }))} />
                </label>
                <label className="idea-field">
                  <span>Catatan untuk mahasiswa{modal.decision === 'accepted' ? ' (opsional)' : ''}</span>
                  <textarea rows={4} value={modal.note} placeholder="Contoh: rumusan masalah sudah tajam, perjelas target mitra." onChange={e => setModal(m => ({ ...m, note: e.target.value }))} />
                </label>
              </div>
              <div className="modal-dialog-footer">
                <button type="button" className="btn-action secondary" onClick={() => setModal(emptyDecision)} disabled={saving}>Batal</button>
                <button type="submit" className="btn-action primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Keputusan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
