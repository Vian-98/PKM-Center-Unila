import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud, CheckCircle2, FileText, Calendar, ArrowLeft, Plus, MessageSquare, TrendingUp
} from 'lucide-react'
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

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
              Catat kegiatan harian, persentase capaian, kendala, dan rencana tindak lanjut tim secara berkala.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Pengusul</span>
            <span className="student-name">{user?.name || 'Mahasiswa'}</span>
            <span className="student-sub">{proposal?.title ? proposal.title.slice(0, 52) : 'Belum ada proposal'}</span>
            <div className="student-header-actions" style={{ marginTop: '0.5rem' }}>
              <a className="student-cta ghost" href="#mahasiswa">
                <ArrowLeft size={13} style={{ marginRight: '0.25rem' }} /> Dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="student-log-grid">
        <form className="student-panel" onSubmit={addEntry}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 className="student-panel-title" style={{ margin: 0 }}>Tambah Catatan Baru</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Entri ke-{entries.length + 1}</span>
          </div>

          <div className="student-field">
            <label className="student-label">Tanggal Kegiatan</label>
            <input className="student-input" type="date" value={form.activityDate} onChange={e => update({ activityDate: e.target.value })} required />
          </div>

          <div className="student-field">
            <label className="student-label">Judul Kegiatan</label>
            <input className="student-input" type="text" value={form.title} onChange={e => update({ title: e.target.value })}
              placeholder="contoh: Pengujian modul prototipe di lab" required />
          </div>

          <div className="student-field">
            <label className="student-label">Uraian Kegiatan</label>
            <textarea className="student-textarea" rows={3} value={form.activityDescription} onChange={e => update({ activityDescription: e.target.value })}
              placeholder="Jelaskan aktivitas yang dilakukan tim secara rinci..." />
          </div>

          <div className="student-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="student-label" style={{ margin: 0 }}>Persentase Capaian</label>
              <span style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3', fontWeight: 800, fontSize: '0.82rem', padding: '0.2rem 0.65rem', borderRadius: '9999px' }}>
                {percent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percent}
              onChange={e => update({ progressPercentage: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
            />
          </div>

          <div className="student-field">
            <label className="student-label">Hasil / Capaian</label>
            <textarea className="student-textarea" rows={2} value={form.progressResult} onChange={e => update({ progressResult: e.target.value })}
              placeholder="Hasil konkret atau luaran sementara yang diperoleh..." />
          </div>

          <div className="student-field">
            <label className="student-label">Kendala (Bila Ada)</label>
            <textarea className="student-textarea" rows={2} value={form.obstacle} onChange={e => update({ obstacle: e.target.value })}
              placeholder="Tantangan atau hambatan yang dihadapi..." />
          </div>

          <div className="student-field">
            <label className="student-label">Rencana Selanjutnya</label>
            <textarea className="student-textarea" rows={2} value={form.nextPlan} onChange={e => update({ nextPlan: e.target.value })}
              placeholder="Langkah tindak lanjut berikutnya..." />
          </div>

          <div className="student-field">
            <label className="student-label">Bukti Kegiatan (Foto / Nota / Dokumen)</label>
            <div className="apple-upload-dropzone" onClick={() => !state.uploading && fileRef.current?.click()} style={{ padding: '1.25rem 1rem' }}>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={handleUpload} disabled={state.uploading} style={{ display: 'none' }} />
              <div className="apple-upload-icon" style={{ width: 38, height: 38, marginBottom: '0.35rem' }}>
                <UploadCloud size={20} />
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                {state.uploading ? 'Mengunggah bukti...' : 'Pilih Bukti Kegiatan'}
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                PDF, JPG, PNG, DOC (maksimal 10 MB)
              </p>
              {form.attachmentUrl && (
                <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.35rem 0.75rem', borderRadius: '12px' }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#065f46' }}>
                    {form.attachmentName || 'Bukti kegiatan'}
                  </span>
                  <a href={resolveAssetUrl(form.attachmentUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#0071e3', fontWeight: 700, marginLeft: '0.2rem' }} onClick={e => e.stopPropagation()}>
                    Lihat &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>

          {state.error && <p style={{ color: '#b91c1c', fontSize: '0.82rem', margin: '0.5rem 0' }}>{state.error}</p>}
          {state.success && <p style={{ color: '#047857', fontSize: '0.82rem', margin: '0.5rem 0' }}>{state.success}</p>}

          <button type="submit" className="btn-action primary" disabled={state.loading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
            {state.loading ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </form>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="student-section-title" style={{ margin: 0 }}>Riwayat Logbook</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
              {entries.length} Entri
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="student-empty">
              <h4>Belum ada catatan</h4>
              <p>Mulai catat progres kegiatan tim pada formulir di sebelah kiri.</p>
            </div>
          ) : (
            <div className="feedback-timeline">
              {entries.map((entry, idx) => {
                const pct = clampPercent(entry.progressPercentage)
                return (
                  <article key={entry.id || idx} className="student-log-card">
                    <div className="student-log-head">
                      <div className="guidance-card-date" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} />
                        <span>{formatDateID(entry.activityDate || entry.date)}</span>
                      </div>
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
                      <div className="student-progress" style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="student-percent-chip">Capaian {pct}%</span>
                        </div>
                        <div className="student-progress-track" style={{ marginTop: '0.35rem' }}>
                          <div className="student-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    {entry.attachmentUrl && (
                      <div style={{ marginTop: '0.65rem' }}>
                        <a href={resolveAssetUrl(entry.attachmentUrl)} target="_blank" rel="noreferrer"
                          style={{ fontSize: '0.82rem', color: '#0071e3', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <FileText size={13} />
                          <span>Lihat lampiran bukti kegiatan &rarr;</span>
                        </a>
                      </div>
                    )}

                    {entry.comments?.length > 0 && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '14px', border: '0.5px solid #e2e8f0' }}>
                        {entry.comments.map((c, i) => (
                          <div key={c.id || i} style={{ fontSize: '0.82rem', color: '#334155' }}>
                            <strong style={{ color: '#0f172a' }}>{c.authorName || 'Dosen Pembimbing'}:</strong> {c.comment}
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

