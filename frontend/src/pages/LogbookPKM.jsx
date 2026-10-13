import { useState, useEffect, useRef } from 'react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'
import { authFetch, uploadFile, resolveAssetUrl, statusTone, formatDateID } from '../lib/studentApi'

const EMPTY_ENTRY = {
  activityDate: new Date().toISOString().slice(0, 10),
  title: '',
  activityDescription: '',
  progressPercentage: 0,
  progressResult: '',
  obstacle: '',
  nextPlan: '',
  attachmentUrl: '',
  attachmentName: '',
}

function clampPercent(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

export function LogbookPKM({ user }) {
  const [entries, setEntries] = useState(() => loadStore('pkm_mhs_logbook', []))
  const [form, setForm] = useState(EMPTY_ENTRY)
  const [proposal, setProposal] = useState(() => loadStore('pkm_mhs_proposal', null))
  const [state, setState] = useState({ loading: false, uploading: false, error: '', success: '' })
  const fileRef = useRef(null)

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const loadEntries = async () => {
    try {
      const result = await authFetch('/student/logbook')
      if (result?.data) {
        setEntries(result.data)
        saveStore('pkm_mhs_logbook', result.data)
      }
    } catch {
      /* gunakan data lokal bila backend belum terjangkau */
    }
  }

  useEffect(() => {
    loadEntries()
    authFetch('/student/dashboard')
      .then(res => { if (res?.data?.proposal) { setProposal(res.data.proposal); saveStore('pkm_mhs_proposal', res.data.proposal) } })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setState(s => ({ ...s, uploading: true, error: '', success: '' }))
    try {
      const data = await uploadFile(file)
      update({ attachmentUrl: data.url, attachmentName: data.name })
      setState(s => ({ ...s, uploading: false, success: 'Bukti kegiatan berhasil diunggah.' }))
    } catch (err) {
      setState(s => ({ ...s, uploading: false, error: `Gagal mengunggah bukti: ${err.message}` }))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addEntry = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.activityDate) {
      setState(s => ({ ...s, error: 'Judul dan tanggal kegiatan wajib diisi.', success: '' }))
      return
    }
    setState(s => ({ ...s, loading: true, error: '', success: '' }))
    const payload = { ...form, progressPercentage: clampPercent(form.progressPercentage) }
    try {
      const result = await authFetch('/student/logbook', { method: 'POST', body: JSON.stringify(payload) })
      const saved = result?.data
      setEntries(prev => {
        const next = [{ ...payload, id: saved?.id || Date.now(), verificationStatus: 'pending', comments: [], createdAt: new Date().toISOString() }, ...prev]
        saveStore('pkm_mhs_logbook', next)
        return next
      })
      setForm(EMPTY_ENTRY)
      setState({ loading: false, uploading: false, error: '', success: 'Catatan logbook berhasil disimpan.' })
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: `Gagal menyimpan: ${err.message}` }))
    }
  }

  const percent = clampPercent(form.progressPercentage)

  return (
    <div className="module-container">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">LOGBOOK KEGIATAN PKM</div>
            <h1 className="module-title">Logbook Progres PKM</h1>
            <p className="module-subtitle">
              Catat kegiatan harian, persentase capaian, kendala, dan rencana tindak lanjut. Dosen pembimbing dapat memberi catatan pada setiap entri.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Pengusul</span>
            <span className="student-name">{user?.name || 'Mahasiswa'}</span>
            <span className="student-sub">{proposal?.title ? proposal.title.slice(0, 52) : 'Belum ada proposal'}</span>
          </div>
        </div>
      </section>

      <div className="student-log-grid">
        <form className="student-panel" onSubmit={addEntry}>
          <h3 className="student-panel-title">Tambah Catatan</h3>

          <div className="student-field">
            <label className="student-label">Tanggal Kegiatan</label>
            <input className="student-input" type="date" value={form.activityDate} onChange={e => update({ activityDate: e.target.value })} required />
          </div>

          <div className="student-field">
            <label className="student-label">Judul Kegiatan</label>
            <input className="student-input" type="text" value={form.title} onChange={e => update({ title: e.target.value })}
              placeholder="contoh: Pengambilan data lapangan" required />
          </div>

          <div className="student-field">
            <label className="student-label">Uraian Kegiatan</label>
            <textarea className="student-textarea" rows={3} value={form.activityDescription} onChange={e => update({ activityDescription: e.target.value })} />
          </div>

          <div className="student-field">
            <label className="student-label">Persentase Capaian: {percent}%</label>
            <input type="range" min="0" max="100" step="5" value={percent}
              onChange={e => update({ progressPercentage: Number(e.target.value) })} />
            <div className="student-progress">
              <div className="student-progress-track">
                <div className="student-progress-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="student-field">
            <label className="student-label">Hasil / Capaian</label>
            <textarea className="student-textarea" rows={2} value={form.progressResult} onChange={e => update({ progressResult: e.target.value })} />
          </div>

          <div className="student-field">
            <label className="student-label">Kendala</label>
            <textarea className="student-textarea" rows={2} value={form.obstacle} onChange={e => update({ obstacle: e.target.value })} />
          </div>

          <div className="student-field">
            <label className="student-label">Rencana Selanjutnya</label>
            <textarea className="student-textarea" rows={2} value={form.nextPlan} onChange={e => update({ nextPlan: e.target.value })} />
          </div>

          <div className="student-field">
            <label className="student-label">Bukti Kegiatan (Foto/Nota/Dokumen)</label>
            <div className="student-upload-box">
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={handleUpload} disabled={state.uploading} />
              <p className="student-hint" style={{ marginTop: '0.5rem' }}>
                {state.uploading ? 'Mengunggah bukti...' : 'Maks 10 MB (PDF/gambar/dokumen).'}
              </p>
              {form.attachmentUrl && (
                <span className="student-file-chip">
                  {form.attachmentName || 'Bukti kegiatan'} &mdash;{' '}
                  <a href={resolveAssetUrl(form.attachmentUrl)} target="_blank" rel="noreferrer" style={{ color: '#047857' }}>lihat</a>
                </span>
              )}
            </div>
          </div>

          {state.error && <p style={{ color: '#b91c1c', fontSize: '0.85rem', margin: 0 }}>{state.error}</p>}
          {state.success && <p style={{ color: '#047857', fontSize: '0.85rem', margin: 0 }}>{state.success}</p>}

          <button type="submit" className="btn-action primary" disabled={state.loading} style={{ marginTop: '0.5rem' }}>
            {state.loading ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </form>

        <div>
          <h3 className="student-section-title" style={{ marginTop: 0 }}>Riwayat Logbook ({entries.length})</h3>
          {entries.length === 0 ? (
            <div className="student-empty">
              <h4>Belum ada catatan</h4>
              <p>Mulai catat progres kegiatan tim pada formulir di samping.</p>
            </div>
          ) : (
            <div className="feedback-timeline">
              {entries.map((entry, idx) => {
                const pct = clampPercent(entry.progressPercentage)
                return (
                  <article key={entry.id || idx} className="student-log-card">
                    <div className="student-log-head">
                      <div className="guidance-card-date">{formatDateID(entry.activityDate || entry.date)}</div>
                      <span className={`status-pill ${statusTone(entry.verificationStatus)}`}>
                        {entry.verificationStatus === 'approved' ? 'Tervalidasi' : (entry.verificationStatus === 'rejected' ? 'Ditolak' : 'Menunggu Validasi')}
                      </span>
                    </div>
                    <h4 className="student-log-title">{entry.title || entry.activity}</h4>
                    {entry.activityDescription && <p className="student-log-desc">{entry.activityDescription}</p>}
                    <div className="student-log-meta">
                      {entry.studentName && <span>Oleh: {entry.studentName}</span>}
                      {entry.progressResult && <span>Capaian: {entry.progressResult}</span>}
                      {entry.obstacle && <span>Kendala: {entry.obstacle}</span>}
                      {entry.nextPlan && <span>Rencana: {entry.nextPlan}</span>}
                    </div>
                    {pct > 0 && (
                      <div className="student-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="student-percent-chip">Capaian {pct}%</span>
                        </div>
                        <div className="student-progress-track" style={{ marginTop: '0.4rem' }}>
                          <div className="student-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    {entry.attachmentUrl && (
                      <a href={resolveAssetUrl(entry.attachmentUrl)} target="_blank" rel="noreferrer"
                        style={{ fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 700, display: 'inline-block', marginTop: '0.6rem' }}>
                        Lihat bukti kegiatan
                      </a>
                    )}
                    {entry.comments?.length > 0 && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {entry.comments.map((c, i) => (
                          <div key={c.id || i} className="student-log-comment">
                            <strong>{c.authorName || 'Dosen Pembimbing'}:</strong> {c.comment}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
