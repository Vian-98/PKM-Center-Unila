import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud, CheckCircle2, Trash2, Plus, FileText, ArrowLeft, ArrowRight
} from 'lucide-react'
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

const FALLBACK_STUDENTS = [
  { id: '1', npm: '2217051020', name: 'Favian Rifqi Pratama', studyProgram: 'S1 Ilmu Komputer', faculty: 'FMIPA' },
  { id: '2', npm: '2215061034', name: 'Ahmad Fauzi', studyProgram: 'S1 Teknik Informatika', faculty: 'Fakultas Teknik' },
  { id: '3', npm: '2114131012', name: 'Siti Nurhaliza', studyProgram: 'S1 Agribisnis', faculty: 'Fakultas Pertanian' },
  { id: '4', npm: '2211011045', name: 'Rizky Ramadhan', studyProgram: 'S1 Manajemen Bisnis', faculty: 'FEB' },
  { id: '5', npm: '2318011008', name: 'Aulia Rahma Putri', studyProgram: 'S1 Pendidikan Dokter', faculty: 'Fakultas Kedokteran' },
  { id: '6', npm: '2216031022', name: 'Bima Sakti', studyProgram: 'S1 Ilmu Komunikasi', faculty: 'FISIP' },
]

function getInitialForm(u) {
  const leaderNpm = u?.studentNumber || u?.npm || ''
  const leaderName = u?.name || ''
  const leaderProdi = u?.studyProgram || u?.department || ''
  const leaderFaculty = u?.faculty || ''

  return {
    scheme: '', title: '', abstract: '', keywords: '', fieldOfStudy: '',
    supervisorLecturerId: '', supervisor: '', supervisorMessage: '',
    members: [{ npm: leaderNpm, name: leaderName, prodi: leaderProdi, faculty: leaderFaculty, isManual: false }],
    docUrl: '', docName: '',
  }
}

const STEP_TITLES = ['Identitas Usulan', 'Tim & Pembimbing', 'Berkas Proposal']

export function AjukanProposal({ user }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const [step, setStep] = useState(1)
  const [schemes, setSchemes] = useState(FALLBACK_SCHEMES)
  const [supervisors, setSupervisors] = useState([])
  const [students, setStudents] = useState(FALLBACK_STUDENTS)
  const [form, setForm] = useState(() => loadStore(`pkm_mhs_form_${userKey}`, getInitialForm(user)))
  const [documents, setDocuments] = useState(() => loadStore(`pkm_mhs_docs_${userKey}`, []))
  const [state, setState] = useState({ loading: false, uploading: false, error: '', success: '' })
  const fileRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    setForm(loadStore(`pkm_mhs_form_${userKey}`, getInitialForm(user)))
    setDocuments(loadStore(`pkm_mhs_docs_${userKey}`, []))
  }, [userKey])

  useEffect(() => { saveStore(`pkm_mhs_form_${userKey}`, form) }, [form, userKey])

  useEffect(() => {
    let alive = true
    authFetch('/student/schemes')
      .then(res => { if (alive && res?.data?.length) setSchemes(res.data.map(s => ({ code: s.code, name: s.name }))) })
      .catch(() => {})
    authFetch('/student/supervisors')
      .then(res => { if (alive && res?.data) setSupervisors(res.data) })
      .catch(() => {})
    authFetch('/student/students')
      .then(res => { if (alive && res?.data?.length) setStudents(res.data) })
      .catch(() => {})

    const stored = loadStore(`pkm_mhs_proposal_${userKey}`, null)
    if (stored?.id && stored.id !== 'draft-001') {
      authFetch(`/student/proposals/${stored.id}`)
        .then(res => {
          if (alive && res?.data?.documents) {
            setDocuments(res.data.documents)
            saveStore(`pkm_mhs_docs_${userKey}`, res.data.documents)
          }
        })
        .catch(() => {})
    }
    return () => { alive = false }
  }, [userKey])

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const updateMember = (index, patch) => {
    setForm(prev => ({ ...prev, members: prev.members.map((m, i) => (i === index ? { ...m, ...patch } : m)) }))
  }
  const addMember = () => setForm(prev => ({
    ...prev,
    members: [...prev.members, { npm: '', name: '', prodi: '', faculty: '', isManual: false }],
  }))
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
    if (step === 2) {
      for (let i = 0; i < form.members.length; i++) {
        const m = form.members[i]
        if (m.isManual && (!m.npm.trim() || !m.name.trim())) {
          return `Langkah 2: Data Anggota ${i + 1} belum lengkap. Mohon isi NPM dan Nama Lengkap.`
        }
      }
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
      members: form.members.filter(m => m.npm.trim() || m.name.trim()).map(m => ({
        npm: m.npm.trim(),
        name: m.name.trim(),
        prodi: m.prodi ? m.prodi.trim() : '',
        faculty: m.faculty ? m.faculty.trim() : '',
      })),
      docUrl: form.docUrl.trim(),
      docName: form.docName.trim(),
      submit: asSubmit,
    }

    try {
      const result = await authFetch('/student/proposals', { method: 'POST', body: JSON.stringify(payload) })
      const saved = result?.data
      saveStore(`pkm_mhs_proposal_${userKey}`, {
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
        saveStore(`pkm_mhs_docs_${userKey}`, nextDocs)
      }
      setState({
        loading: false, uploading: false, error: '',
        success: asSubmit ? 'Proposal berhasil diajukan ke dosen pembimbing.' : 'Proposal berhasil disimpan sebagai draft.',
      })
      setTimeout(() => { window.location.hash = '#mahasiswa' }, 900)
    } catch (err) {
      saveStore(`pkm_mhs_proposal_${userKey}`, {
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
        <div className="apple-stepbar">
          {STEP_TITLES.map((title, idx) => {
            const num = idx + 1
            const cls = step === num ? 'active' : step > num ? 'done' : ''
            return (
              <div
                key={title}
                className={`apple-stepbar-item ${cls}`}
                onClick={() => step > num && setStep(num)}
                style={{ cursor: step > num ? 'pointer' : 'default' }}
              >
                <span className="apple-stepbar-num">
                  {step > num ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : num}
                </span>
                <span>{title}</span>
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
                <option value="">-- Pilih Skema PKM --</option>
                {schemes.map(s => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
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
              <textarea className="student-textarea" rows={5} value={form.abstract} onChange={e => update({ abstract: e.target.value })}
                placeholder="Ringkasan latar belakang, tujuan, metode, dan luaran yang ditargetkan..." />
            </div>

            <div className="student-field">
              <label className="student-label">Kata Kunci</label>
              <input className="student-input" type="text" value={form.keywords} onChange={e => update({ keywords: e.target.value })}
                placeholder="contoh: IoT, kecerdasan buatan, pertanian presisi" />
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
                  <option key={s.id} value={s.id}>{s.name} · {s.studyProgram || s.department || 'Unila'}</option>
                ))}
              </select>
              {!supervisors.length && <p className="student-hint">Direktori dosen sedang dimuat atau belum tersedia.</p>}
            </div>

            <div className="student-field">
              <label className="student-label">Pesan Permohonan Bimbingan</label>
              <textarea className="student-textarea" rows={3} value={form.supervisorMessage} onChange={e => update({ supervisorMessage: e.target.value })}
                placeholder="Sampaikan gambaran singkat ide dan harapan bimbingan kepada dosen pembimbing..." />
            </div>

            <div className="student-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <label className="student-label" style={{ margin: 0 }}>Anggota Tim ({filledMembers.length})</label>
                <button type="button" className="btn-action secondary" onClick={addMember} style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}>
                  <Plus size={13} style={{ marginRight: '0.25rem' }} /> Tambah Anggota
                </button>
              </div>
              <p className="student-hint" style={{ marginBottom: '0.75rem' }}>
                Pilih anggota dari direktori akun mahasiswa Unila terdaftar, atau pilih opsi <strong>+ Mahasiswa Belum Terdaftar</strong> untuk menginput data secara manual.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {form.members.map((m, idx) => {
                  const isRegistered = Boolean(m.npm && !m.isManual && students.some(s => s.npm === m.npm))
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f2c52' }}>
                            Anggota {idx + 1}
                          </span>
                          {isRegistered && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: '9999px',
                              padding: '0.12rem 0.55rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                              Akun Terdaftar
                            </span>
                          )}
                          {m.isManual && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              borderRadius: '9999px',
                              padding: '0.12rem 0.55rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                              Input Manual
                            </span>
                          )}
                        </div>
                        {form.members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        )}
                      </div>

                      {/* Dropdown Pemilihan Akun Mahasiswa */}
                      <div style={{ marginBottom: '0.65rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                          Pilih dari Akun Mahasiswa Terdaftar
                        </label>
                        <select
                          className="student-select"
                          value={m.isManual ? '__MANUAL__' : (m.npm || '')}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__MANUAL__') {
                              updateMember(idx, { isManual: true })
                            } else if (!val) {
                              updateMember(idx, { npm: '', name: '', prodi: '', faculty: '', isManual: false })
                            } else {
                              const selected = students.find(s => s.npm === val)
                              if (selected) {
                                updateMember(idx, {
                                  npm: selected.npm,
                                  name: selected.name,
                                  prodi: selected.studyProgram || selected.department || '',
                                  faculty: selected.faculty || '',
                                  isManual: false,
                                })
                              }
                            }
                          }}
                        >
                          <option value="">-- Pilih Mahasiswa Terdaftar (NPM / Nama) --</option>
                          {students.map(s => {
                            const isChosenElsewhere = form.members.some((other, oi) => oi !== idx && other.npm === s.npm)
                            return (
                              <option key={s.id || s.npm} value={s.npm} disabled={isChosenElsewhere}>
                                {s.npm} · {s.name} ({s.studyProgram || s.faculty || 'Unila'}){isChosenElsewhere ? ' (Sudah dipilih)' : ''}
                              </option>
                            )
                          })}
                          <option value="__MANUAL__">✍️ + Mahasiswa Belum Terdaftar (Input Manual Lengkap)</option>
                        </select>
                      </div>

                      {/* Tampilan Detail Jika Terpilih dari Akun Terdaftar */}
                      {!m.isManual && m.npm && (
                        <div style={{
                          background: 'rgba(238, 242, 255, 0.7)',
                          border: '1px solid #c7d2fe',
                          borderRadius: '12px',
                          padding: '0.7rem 0.9rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          fontSize: '0.82rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem' }}>
                              {m.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateMember(idx, { isManual: true })}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Ganti ke Input Manual
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem', color: '#334155' }}>
                            <div><strong style={{ color: '#64748b' }}>NPM:</strong> {m.npm}</div>
                            <div><strong style={{ color: '#64748b' }}>Prodi:</strong> {m.prodi || '-'}</div>
                            <div><strong style={{ color: '#64748b' }}>Fakultas:</strong> {m.faculty || 'Universitas Lampung'}</div>
                          </div>
                        </div>
                      )}

                      {/* Tampilan Form Jika Belum Terdaftar (Input Manual Lengkap) */}
                      {m.isManual && (
                        <div style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '12px',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                                ⚠️ Mahasiswa Belum Terdaftar di Direktori Akun
                              </span>
                              <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#b45309', lineHeight: 1.4 }}>
                                Masukkan data lengkap mahasiswa di bawah ini. Akun dan profil SIM PKM akan otomatis dibuatkan dan dikaitkan saat usulan disimpan.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateMember(idx, { isManual: false, npm: '', name: '', prodi: '', faculty: '' })}
                              style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.6rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              Pilih dari Akun
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#78350f', marginBottom: '0.2rem' }}>NPM Mahasiswa *</label>
                              <input
                                className="student-input"
                                type="text"
                                placeholder="contoh: 2315061099"
                                value={m.npm}
                                onChange={e => updateMember(idx, { npm: e.target.value })}
                                style={{ fontSize: '0.84rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#78350f', marginBottom: '0.2rem' }}>Nama Lengkap *</label>
                              <input
                                className="student-input"
                                type="text"
                                placeholder="Nama Lengkap Mahasiswa"
                                value={m.name}
                                onChange={e => updateMember(idx, { name: e.target.value })}
                                style={{ fontSize: '0.84rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#78350f', marginBottom: '0.2rem' }}>Program Studi *</label>
                              <input
                                className="student-input"
                                type="text"
                                placeholder="contoh: Teknik Informatika"
                                value={m.prodi}
                                onChange={e => updateMember(idx, { prodi: e.target.value })}
                                style={{ fontSize: '0.84rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#78350f', marginBottom: '0.2rem' }}>Fakultas</label>
                              <input
                                className="student-input"
                                type="text"
                                placeholder="contoh: Fakultas Teknik"
                                value={m.faculty || ''}
                                onChange={e => updateMember(idx, { faculty: e.target.value })}
                                style={{ fontSize: '0.84rem' }}
                              />
                            </div>
                          </div>

                          {/* Deteksi Otomatis Jika NPM yang diketik manual ternyata ada di list akun terdaftar */}
                          {(() => {
                            const match = students.find(s => s.npm && m.npm && s.npm.trim() === m.npm.trim())
                            if (!match) return null
                            return (
                              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#065f46' }}>
                                  💡 NPM <strong>{match.npm}</strong> cocok dengan akun <strong>{match.name}</strong> ({match.studyProgram})!
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateMember(idx, {
                                    npm: match.npm, name: match.name, prodi: match.studyProgram || match.department || '', faculty: match.faculty || '', isManual: false
                                  })}
                                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.55rem', cursor: 'pointer' }}
                                >
                                  Gunakan Akun Ini
                                </button>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#991b1b', display: 'block', marginBottom: '0.2rem' }}>
                  Aturan Wajib SIMBELMAWA (Anti-Gugur Evaluasi Tahap 1)
                </strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#b91c1c', lineHeight: 1.5 }}>
                  Proposal diunggah <strong>TANPA COVER / SAMPUL</strong> dan <strong>TANPA LEMBAR PENGESAHAN</strong> (data disahkan digital oleh Unila). Maksimal 10 halaman isi utama (Bab 1 s.d. Daftar Pustaka). Font TNR 12 spasi 1.15, margin 4-3-3-3 cm.{' '}
                  <a href="#pedoman" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#b91c1c', textDecoration: 'underline' }}>
                    Lihat Pedoman &amp; Format Usulan Lengkap &rarr;
                  </a>
                </p>
              </div>
            </div>

            <div className="student-field">
              <label className="student-label">Unggah Berkas Proposal (PDF/DOCX, maks 10 MB)</label>
              <div className="apple-upload-dropzone" onClick={() => !state.uploading && fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} disabled={state.uploading} style={{ display: 'none' }} />
                <div className="apple-upload-icon">
                  <UploadCloud size={24} />
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
                  {state.uploading ? 'Sedang mengunggah berkas...' : 'Klik untuk memilih berkas proposal'}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  Format PDF atau DOCX (maksimal 10 MB)
                </p>
                <div className="apple-upload-btn-chip">
                  <FileText size={13} />
                  <span>{state.uploading ? 'Mengunggah...' : 'Pilih Berkas'}</span>
                </div>
                {form.docUrl && (
                  <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.45rem 0.85rem', borderRadius: '12px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>
                      {form.docName || 'Proposal.pdf'}
                    </span>
                    <a href={resolveAssetUrl(form.docUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#0071e3', fontWeight: 700, marginLeft: '0.25rem' }} onClick={e => e.stopPropagation()}>
                      Buka &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="student-field">
              <label className="student-label">Atau Tautan Berkas (Google Drive / Cloud)</label>
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
              <div className="student-summary-row"><strong>Skema</strong><span>{currentScheme ? `${currentScheme.code} · ${currentScheme.name}` : '-'}</span></div>
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

        <div className="student-form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-action secondary" onClick={prevStep} disabled={step === 1}>
            Kembali
          </button>
          <div className="student-actions-right" style={{ display: 'flex', gap: '0.65rem' }}>
            {step < 3 ? (
              <button type="button" className="btn-action primary" onClick={nextStep}>
                <span>Lanjut</span>
                <ArrowRight size={14} style={{ marginLeft: '0.35rem' }} />
              </button>
            ) : (
              <>
                <button type="button" className="btn-action secondary" onClick={() => submit(false)} disabled={state.loading}>
                  Simpan Draft
                </button>
                <button type="button" className="btn-action primary" onClick={() => submit(true)} disabled={state.loading}>
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
