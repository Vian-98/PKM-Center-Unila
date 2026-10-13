import { useState, useEffect, useRef } from 'react'
import { loadStore, saveStore } from '../lib/dosenReviewerData'
import { authFetch, uploadFile, resolveAssetUrl, statusTone, statusLabel, formatDateTimeID } from '../lib/studentApi'

const FALLBACK_SCHEMES = [
  { code: 'PKM-K', name: 'PKM Kewirausahaan' },
  { code: 'PKM-RE', name: 'PKM Riset Eksakta' },
  { code: 'PKM-RSH', name: 'PKM Riset Sosial Humaniora' },
  { code: 'PKM-PM', name: 'PKM Pengabdian kepada Masyarakat' },
  { code: 'PKM-KC', name: 'PKM Karsa Cipta' },
  { code: 'PKM-AI', name: 'PKM Artikel Ilmiah' },
  { code: 'PKM-GFT', name: 'PKM Gagasan Futuristik Tertulis' },
  { code: 'PKM-KI', name: 'PKM Karya Inovatif' },
  { code: 'PKM-VGK', name: 'PKM Video Gagasan Konstruktif' },
  { code: 'PKM-PI', name: 'PKM Penerapan Iptek' },
]

const EMPTY_FORM = {
  scheme: '', title: '', abstract: '', keywords: '', fieldOfStudy: '',
  supervisorLecturerId: '', supervisor: '', supervisorMessage: '',
  members: [{ npm: '', name: '', prodi: '' }],
  docUrl: '', docName: '',
}

const STEP_TITLES = ['Identitas Usulan', 'Tim & Pembimbing', 'Berkas Proposal']

export function AjukanProposal({ user }) {
  const [step, setStep] = useState(1)
  const [schemes, setSchemes] = useState(FALLBACK_SCHEMES)
  const [supervisors, setSupervisors] = useState([])
  const [form, setForm] = useState(() => loadStore('pkm_mhs_form', EMPTY_FORM))
  const [documents, setDocuments] = useState(() => loadStore('pkm_mhs_docs', []))
  const [state, setState] = useState({ loading: false, uploading: false, error: '', success: '' })
  const fileRef = useRef(null)

  useEffect(() => { saveStore('pkm_mhs_form', form) }, [form])

  useEffect(() => {
    let alive = true
    authFetch('/student/schemes')
      .then(res => { if (alive && res?.data?.length) setSchemes(res.data.map(s => ({ code: s.code, name: s.name }))) })
      .catch(() => {})
    authFetch('/student/supervisors')
      .then(res => { if (alive && res?.data) setSupervisors(res.data) })
      .catch(() => {})

    const stored = loadStore('pkm_mhs_proposal', null)
    if (stored?.id && stored.id !== 'draft-001') {
      authFetch(`/student/proposals/${stored.id}`)
        .then(res => {
          if (alive && res?.data?.documents) {
            setDocuments(res.data.documents)
            saveStore('pkm_mhs_docs', res.data.documents)
          }
        })
        .catch(() => {})
    }
    return () => { alive = false }
  }, [])

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const updateMember = (index, patch) => {
    setForm(prev => ({ ...prev, members: prev.members.map((m, i) => (i === index ? { ...m, ...patch } : m)) }))
  }
  const addMember = () => setForm(prev => ({ ...prev, members: [...prev.members, { npm: '', name: '', prodi: '' }] }))
  const removeMember = (index) => setForm(prev => ({ ...prev, members: prev.members.filter((_, i) => i !== index) }))

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setState({ loading: false, uploading: true, error: '', success: '' })
    try {
      const data = await uploadFile(file)
      update({ docUrl: data.url, docName: data.name })
      setState({ loading: false, uploading: false, error: '', success: 'Berkas berhasil diunggah.' })
    } catch (err) {
      setState({ loading: false, uploading: false, error: `Gagal mengunggah: ${err.message}`, success: '' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const validateStep = () => {
    if (step === 1 && (!form.scheme || !form.title.trim() || !form.abstract.trim())) {
      return 'Langkah 1: skema, judul, dan abstrak wajib diisi.'
    }
    return ''
  }

  const nextStep = () => {
    const error = validateStep()
    if (error) { setState(s => ({ ...s, error, success: '' })); return }
    setState(s => ({ ...s, error: '', success: '' }))
    setStep(s => Math.min(3, s + 1))
  }
  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const submit = async (asSubmit) => {
    const error = validateStep()
    if (error) { setState(s => ({ ...s, error, success: '' })); return }
    if (!form.scheme || !form.title.trim()) {
      setState(s => ({ ...s, error: 'Data usulan belum lengkap.', success: '' })); return
    }
    setState({ loading: true, uploading: false, error: '', success: '' })

    const payload = {
      schemeCode: form.scheme,
      title: form.title.trim(),
      abstract: form.abstract.trim(),
      keywords: form.keywords.trim(),
      fieldOfStudy: form.fieldOfStudy.trim(),
      supervisorLecturerId: form.supervisorLecturerId,
      supervisorMessage: form.supervisorMessage,
      members: form.members.filter(m => m.npm.trim() || m.name.trim()),
      docUrl: form.docUrl.trim(),
      docName: form.docName.trim(),
      submit: asSubmit,
    }

    try {
      const result = await authFetch('/student/proposals', { method: 'POST', body: JSON.stringify(payload) })
      const saved = result?.data
      saveStore('pkm_mhs_proposal', {
        ...saved, scheme: form.scheme, supervisor: form.supervisor,
        members: form.members, docUrl: form.docUrl,
        id: saved?.id || 'draft-001', status: saved?.status || 'draft',
      })
      if (form.docUrl) {
        const nextDocs = [{
          id: saved?.id || Date.now(), versionNumber: documents.length + 1,
          fileName: form.docName || 'Proposal.pdf', fileUrl: form.docUrl,
          changeNotes: 'Diunggah melalui portal mahasiswa', uploadedAt: new Date().toISOString(),
        }, ...documents]
        setDocuments(nextDocs)
        saveStore('pkm_mhs_docs', nextDocs)
      }
      setState({
        loading: false, uploading: false, error: '',
        success: asSubmit ? 'Proposal berhasil diajukan ke dosen pembimbing.' : 'Proposal berhasil disimpan sebagai draft.',
      })
      setTimeout(() => { window.location.hash = '#mahasiswa' }, 900)
    } catch (err) {
      saveStore('pkm_mhs_proposal', {
        ...form, id: 'draft-001', status: asSubmit ? 'submitted' : 'draft', createdAt: new Date().toISOString(),
      })
      setState({ loading: false, uploading: false, error: `Gagal menghubungi server: ${err.message}`, success: '' })
    }
  }

  const currentScheme = schemes.find(s => s.code === form.scheme)
  const filledMembers = form.members.filter(m => m.npm.trim() || m.name.trim())

  return (
    <div className="module-container">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">FORMULIR PENGAJUAN PROPOSAL PKM</div>
            <h1 className="module-title">Ajukan Proposal PKM</h1>
            <p className="module-subtitle">
              Lengkapi identitas usulan, susun tim bersama dosen pembimbing, lalu lampirkan berkas proposal. Dapat disimpan sebagai draft.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Pengusul</span>
            <span className="student-name">{user?.name || 'Mahasiswa'}</span>
            <div className="student-header-actions">
              <a className="student-cta ghost" href="#mahasiswa">&larr; Kembali ke Dashboard</a>
            </div>
          </div>
        </div>
      </section>

      <div className="student-form-card">
        <div className="student-stepbar">
          {STEP_TITLES.map((title, idx) => {
            const num = idx + 1
            const cls = step === num ? 'active' : step > num ? 'done' : ''
            return (
              <div key={title} className={`student-stepbar-item ${cls}`}>
                {step > num ? '\u2713 ' : `Langkah ${num}. `}{title}
              </div>
            )
          })}
        </div>

        {state.error && <div className="student-message-box" style={{ borderLeftColor: '#ef4444', color: '#991b1b' }}>{state.error}</div>}
        {state.success && <div className="student-message-box" style={{ borderLeftColor: '#10b981', color: '#047857' }}>{state.success}</div>}

        {step === 1 && (
          <div>
            <div className="student-field">
              <label className="student-label">Skema PKM</label>
              <select className="student-select" value={form.scheme} onChange={e => update({ scheme: e.target.value })}>
                <option value="">-- Pilih Skema --</option>
                {schemes.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
              </select>
              {currentScheme && <p className="student-hint">Skema terpilih: <strong>{currentScheme.name}</strong></p>}
            </div>

            <div className="student-field">
              <label className="student-label">Judul Usulan</label>
              <input className="student-input" type="text" value={form.title} onChange={e => update({ title: e.target.value })}
                placeholder="Tuliskan judul proposal yang spesifik dan aplikatif" />
            </div>

            <div className="student-field">
              <label className="student-label">Abstrak Ringkas</label>
              <textarea className="student-textarea" rows={6} value={form.abstract} onChange={e => update({ abstract: e.target.value })}
                placeholder="Ringkasan latar belakang, tujuan, metode, dan luaran yang ditargetkan" />
            </div>

            <div className="student-field">
              <label className="student-label">Kata Kunci</label>
              <input className="student-input" type="text" value={form.keywords} onChange={e => update({ keywords: e.target.value })}
                placeholder="contoh: IoT, pertanian presisi, sensor" />
            </div>

            <div className="student-field">
              <label className="student-label">Kriteria Bidang / Jurusan Pengusul</label>
              <input className="student-input" type="text" value={form.fieldOfStudy} onChange={e => update({ fieldOfStudy: e.target.value })}
                placeholder="contoh: Teknik Elektro / Fakultas Teknik" />
              <p className="student-hint">Digunakan panitia untuk memetakan kesesuaian bidang usulan dengan skema.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="student-field">
              <label className="student-label">Dosen Pembimbing (dari direktori)</label>
              <select className="student-select" value={form.supervisorLecturerId}
                onChange={e => {
                  const id = e.target.value
                  const found = supervisors.find(s => s.id === id)
                  update({ supervisorLecturerId: id, supervisor: found?.name || '' })
                }}>
                <option value="">-- Pilih Dosen Pembimbing --</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.studyProgram || s.department || 'Unila'}</option>
                ))}
              </select>
              {!supervisors.length && <p className="student-hint">Direktori dosen sedang dimuat atau belum tersedia.</p>}
            </div>

            <div className="student-field">
              <label className="student-label">Pesan Permohonan Bimbingan</label>
              <textarea className="student-textarea" rows={3} value={form.supervisorMessage} onChange={e => update({ supervisorMessage: e.target.value })}
                placeholder="Sampaikan gambaran singkat ide dan harapan bimbingan kepada dosen" />
            </div>

            <div className="student-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label className="student-label">Anggota Tim ({filledMembers.length})</label>
                <button type="button" className="btn-action secondary" onClick={addMember}>+ Tambah Anggota</button>
              </div>
              <p className="student-hint">
                Masukkan NPM anggota. Anggota yang sudah terdaftar akan menerima status undangan (pending) pada tim Anda.
              </p>
              {form.members.map((m, idx) => (
                <div key={idx} className="student-member-editor">
                  <input type="text" placeholder="NPM" value={m.npm} onChange={e => updateMember(idx, { npm: e.target.value })} />
                  <input type="text" placeholder="Nama Lengkap" value={m.name} onChange={e => updateMember(idx, { name: e.target.value })} />
                  <input type="text" placeholder="Prodi/Jurusan" value={m.prodi} onChange={e => updateMember(idx, { prodi: e.target.value })} />
                  <button type="button" className="btn-action danger" onClick={() => removeMember(idx)} disabled={form.members.length === 1}>Hapus</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="student-field">
              <label className="student-label">Unggah Berkas Proposal (PDF/DOCX, maks 10 MB)</label>
              <div className="student-upload-box">
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={state.uploading} />
                <p className="student-hint" style={{ marginTop: '0.5rem' }}>
                  {state.uploading ? 'Mengunggah berkas...' : 'Pilih berkas proposal, atau tempelkan tautan Google Drive di bawah.'}
                </p>
                {form.docUrl && (
                  <span className="student-file-chip">
                    {form.docName || 'Berkas proposal'} &mdash;{' '}
                    <a href={resolveAssetUrl(form.docUrl)} target="_blank" rel="noreferrer" style={{ color: '#047857' }}>lihat</a>
                  </span>
                )}
              </div>
            </div>

            <div className="student-field">
              <label className="student-label">Atau Tautan Berkas (Google Drive)</label>
              <input className="student-input" type="text" value={form.docUrl} onChange={e => update({ docUrl: e.target.value })}
                placeholder="https://drive.google.com/..." />
            </div>

            <div className="student-field">
              <label className="student-label">Nama Berkas</label>
              <input className="student-input" type="text" value={form.docName} onChange={e => update({ docName: e.target.value })}
                placeholder="Proposal_<NamaTim>_v1.pdf" />
            </div>

            <div className="student-summary">
              <h4 className="student-panel-title" style={{ marginBottom: '0.5rem' }}>Ringkasan Usulan</h4>
              <div className="student-summary-row"><strong>Skema</strong><span>{currentScheme ? `${currentScheme.code} — ${currentScheme.name}` : '-'}</span></div>
              <div className="student-summary-row"><strong>Judul</strong><span>{form.title || '-'}</span></div>
              <div className="student-summary-row"><strong>Bidang</strong><span>{form.fieldOfStudy || '-'}</span></div>
              <div className="student-summary-row"><strong>Pembimbing</strong><span>{form.supervisor || 'Belum dipilih'}</span></div>
              <div className="student-summary-row"><strong>Anggota</strong><span>{filledMembers.length} orang</span></div>
              <div className="student-summary-row"><strong>Berkas</strong><span>{form.docUrl ? (form.docName || 'Terlampir') : 'Belum dilampirkan'}</span></div>
            </div>

            {documents.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <h4 className="student-panel-title">Riwayat Versi Dokumen</h4>
                {documents.map(doc => (
                  <div key={doc.id} className="student-doc-version">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                        {doc.fileName || 'Dokumen proposal'}
                      </div>
                      <div className="student-member-sub">
                        {doc.changeNotes || 'Tanpa catatan'} • {formatDateTimeID(doc.uploadedAt)}
                      </div>
                    </div>
                    <span className="v-badge">v{doc.versionNumber || 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="student-form-actions">
          <button type="button" className="btn-action secondary" onClick={prevStep} disabled={step === 1}>Kembali</button>
          <div className="student-actions-right">
            {step < 3 ? (
              <button type="button" className="btn-action primary" onClick={nextStep}>Lanjut &rarr;</button>
            ) : (
              <>
                <button type="button" className="btn-action secondary" onClick={() => submit(false)} disabled={state.loading}>Simpan Draft</button>
                <button type="button" className="btn-action success" onClick={() => submit(true)} disabled={state.loading}>
                  {state.loading ? 'Memproses...' : 'Ajukan Sekarang'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
