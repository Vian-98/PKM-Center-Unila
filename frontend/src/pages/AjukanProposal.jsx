import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud, CheckCircle2, Trash2, Plus, FileText, ArrowLeft, ArrowRight,
  ShieldCheck, AlertCircle, Clock, ExternalLink, ChevronDown, ChevronUp,
  FileEdit, Send, Layers, Info
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
    docUrl: '', docName: '', changeNotes: '',
  }
}

const STEP_TITLES = ['Identitas Usulan', 'Tim & Pembimbing', 'Berkas Proposal']

export function AjukanProposal({ user }) {
  const userKey = user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : (user?.id || 'guest')
  const [step, setStep] = useState(1)
  const [schemes, setSchemes] = useState(FALLBACK_SCHEMES)
  const [supervisors, setSupervisors] = useState([])
  const [students, setStudents] = useState(FALLBACK_STUDENTS)

  // State proposal terdaftar (jika mahasiswa sudah memiliki 1 usulan resmi)
  const [existingProposal, setExistingProposal] = useState(() => {
    const stored = loadStore(`pkm_mhs_proposal_${userKey}`, null)
    return (stored?.id && stored.id !== 'draft-001') ? stored : null
  })
  const [existingTeam, setExistingTeam] = useState(null)
  const [existingSupervisor, setExistingSupervisor] = useState(null)

  // Form untuk usulan baru (jika belum punya usulan)
  const [form, setForm] = useState(() => loadStore(`pkm_mhs_form_${userKey}`, getInitialForm(user)))
  const [documents, setDocuments] = useState(() => loadStore(`pkm_mhs_docs_${userKey}`, []))

  // Form untuk pengiriman draf revisi baru (jika sudah punya usulan)
  const [revisionForm, setRevisionForm] = useState({
    docUrl: '',
    docName: '',
    changeNotes: '',
    abstract: '',
    keywords: '',
    showAbstractEditor: false,
  })

  const [state, setState] = useState({ loading: false, uploading: false, error: '', success: '' })
  const fileRef = useRef(null)
  const revisionFileRef = useRef(null)

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

    // Periksa status usulan proposal aktif mahasiswa
    authFetch('/student/dashboard')
      .then(res => {
        if (!alive || !res?.data) return
        if (res.data.proposal?.id) {
          setExistingProposal(res.data.proposal)
          saveStore(`pkm_mhs_proposal_${userKey}`, res.data.proposal)
          if (res.data.proposal.documents) {
            setDocuments(res.data.proposal.documents)
            saveStore(`pkm_mhs_docs_${userKey}`, res.data.proposal.documents)
          }
          if (res.data.proposal.abstract) {
            setRevisionForm(prev => ({
              ...prev,
              abstract: res.data.proposal.abstract || '',
              keywords: res.data.proposal.keywords || '',
            }))
          }
        }
        if (res.data.team) setExistingTeam(res.data.team)
        if (res.data.supervisor) setExistingSupervisor(res.data.supervisor)
      })
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

  // Handler upload draf naskah revisi baru untuk proposal yang sudah terdaftar
  const handleRevisionUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setState({ loading: false, uploading: true, error: '', success: '' })
    try {
      const data = await uploadFile(file)
      const nextVer = (documents?.length || 0) + 1
      const defaultName = data.name || `Draft_v${nextVer}_${existingProposal?.schemeCode || 'PKM'}.pdf`
      setRevisionForm(prev => ({
        ...prev,
        docUrl: data.url,
        docName: defaultName,
      }))
      setState({ loading: false, uploading: false, error: '', success: 'Berkas draf revisi berhasil diunggah ke server.' })
    } catch (err) {
      setState({ loading: false, uploading: false, error: `Gagal mengunggah: ${err.message}`, success: '' })
    } finally {
      if (revisionFileRef.current) revisionFileRef.current.value = ''
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

  // Kirim proposal baru pertama kali
  const submitInitialProposal = async (asSubmit) => {
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
      changeNotes: form.changeNotes.trim() || 'Naskah awal usulan proposal',
      submit: asSubmit,
    }

    try {
      const result = await authFetch('/student/proposals', { method: 'POST', body: JSON.stringify(payload) })
      const saved = result?.data || {}
      const savedProposal = {
        ...saved,
        schemeCode: form.scheme,
        schemeName: schemes.find(s => s.code === form.scheme)?.name || form.scheme,
        title: form.title,
        abstract: form.abstract,
        keywords: form.keywords,
        fieldOfStudy: form.fieldOfStudy,
        status: asSubmit ? 'submitted' : 'draft',
      }
      setExistingProposal(savedProposal)
      saveStore(`pkm_mhs_proposal_${userKey}`, savedProposal)

      if (form.docUrl) {
        const nextDocs = [{
          id: saved?.id || Date.now().toString(),
          versionNumber: 1,
          fileName: form.docName || 'Proposal.pdf',
          fileUrl: form.docUrl,
          changeNotes: 'Naskah awal usulan proposal',
          uploadedAt: new Date().toISOString(),
        }]
        setDocuments(nextDocs)
        saveStore(`pkm_mhs_docs_${userKey}`, nextDocs)
      }
      setState({
        loading: false, uploading: false, error: '',
        success: asSubmit ? 'Proposal berhasil didaftarkan dan dikirim ke dosen pembimbing.' : 'Proposal berhasil disimpan sebagai draft.',
      })
      setTimeout(() => { window.location.hash = '#mahasiswa' }, 1000)
    } catch (err) {
      const fallbackProposal = {
        ...form,
        id: 'draft-001',
        schemeCode: form.scheme,
        status: asSubmit ? 'submitted' : 'draft',
        createdAt: new Date().toISOString(),
      }
      setExistingProposal(fallbackProposal)
      saveStore(`pkm_mhs_proposal_${userKey}`, fallbackProposal)
      setState({ loading: false, uploading: false, error: `Gagal menghubungi server: ${err.message}`, success: '' })
    }
  }

  // Kirim draf naskah revisi baru pada proposal yang sudah ada
  const submitRevisionDraft = async (asSubmit) => {
    if (!revisionForm.docUrl) {
      setState({ loading: false, uploading: false, error: 'Silakan unggah berkas draf naskah revisi terlebih dahulu.', success: '' })
      return
    }
    if (!revisionForm.changeNotes.trim()) {
      setState({ loading: false, uploading: false, error: 'Mohon cantumkan Catatan Perubahan / Keterangan Revisi agar dapat dipelajari oleh dosen pembimbing.', success: '' })
      return
    }

    setState({ loading: true, uploading: false, error: '', success: '' })

    try {
      const nextVer = (documents?.length || 0) + 1
      const docName = revisionForm.docName.trim() || `Draft_v${nextVer}_${existingProposal?.schemeCode || 'PKM'}.pdf`

      const payload = {
        proposalId: existingProposal.id,
        fileName: docName,
        fileUrl: revisionForm.docUrl.trim(),
        changeNotes: revisionForm.changeNotes.trim(),
        submit: asSubmit,
      }

      const res = await authFetch('/student/proposals/upload', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const newDoc = res?.data || {
        id: Date.now().toString(),
        proposalId: existingProposal.id,
        versionNumber: nextVer,
        fileName: docName,
        fileUrl: revisionForm.docUrl.trim(),
        changeNotes: revisionForm.changeNotes.trim(),
        uploadedAt: new Date().toISOString(),
      }

      const nextDocs = [newDoc, ...documents.filter(d => d.id !== newDoc.id)]
      setDocuments(nextDocs)
      saveStore(`pkm_mhs_docs_${userKey}`, nextDocs)

      // Jika mahasiswa juga memperbarui abstrak atau kata kunci
      if (revisionForm.showAbstractEditor && (revisionForm.abstract || revisionForm.keywords)) {
        await authFetch('/student/proposals', {
          method: 'POST',
          body: JSON.stringify({
            schemeCode: existingProposal.schemeCode || 'PKM-KC',
            title: existingProposal.title,
            abstract: revisionForm.abstract,
            keywords: revisionForm.keywords,
            fieldOfStudy: existingProposal.fieldOfStudy,
            submit: asSubmit,
          }),
        }).catch(() => {})
      }

      const updated = {
        ...existingProposal,
        status: asSubmit ? 'submitted' : (existingProposal.status === 'revision' ? 'submitted' : existingProposal.status),
        abstract: revisionForm.showAbstractEditor && revisionForm.abstract ? revisionForm.abstract : existingProposal.abstract,
        keywords: revisionForm.showAbstractEditor && revisionForm.keywords ? revisionForm.keywords : existingProposal.keywords,
        updatedAt: new Date().toISOString(),
      }
      setExistingProposal(updated)
      saveStore(`pkm_mhs_proposal_${userKey}`, updated)

      setRevisionForm(prev => ({
        ...prev,
        docUrl: '',
        docName: '',
        changeNotes: '',
      }))

      setState({
        loading: false,
        uploading: false,
        error: '',
        success: asSubmit
          ? `Naskah revisi versi ${newDoc.versionNumber} berhasil dikirim ke dosen pembimbing!`
          : `Naskah revisi versi ${newDoc.versionNumber} berhasil disimpan sebagai draf.`,
      })
    } catch (err) {
      setState({
        loading: false,
        uploading: false,
        error: `Gagal mengirim naskah revisi: ${err.message}`,
        success: '',
      })
    }
  }

  const currentScheme = schemes.find(s => s.code === form.scheme)
  const filledMembers = form.members.filter(m => m.npm.trim() || m.name.trim())
  const hasRegisteredProposal = Boolean(existingProposal?.id)

  // -------------------------------------------------------------
  // TAMPILAN A: JIKA MAHASISWA SUDAH MEMILIKI PROPOSAL TERDAFTAR
  // Aturan Belmawa: 1 Mahasiswa = 1 Proposal, Revisi Draft Bebas Terus Dikirim
  // -------------------------------------------------------------
  if (hasRegisteredProposal) {
    const nextVersionNum = (documents?.length || 0) + 1
    const latestDoc = documents?.[0]

    return (
      <div className="module-container">
        {/* Header Portal */}
        <section className="module-header">
          <div className="module-header-top">
            <div>
              <div className="module-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                <ShieldCheck size={13} style={{ marginRight: '0.35rem', display: 'inline' }} />
                BATASAN 1 USULAN MAHASISWA • PEDOMAN BELMAWA DIKTI
              </div>
              <h1 className="module-title">Kelola Usulan &amp; Kirim Draft Revisi</h1>
              <p className="module-subtitle">
                Setiap mahasiswa hanya dapat mengusulkan 1 judul proposal. Anda dapat mengirimkan draf naskah revisi berkali-kali untuk dinilai dan disempurnakan bersama dosen pembimbing.
              </p>
            </div>
            <div className="student-header-meta">
              <span className="student-eyebrow">Ketua Pengusul</span>
              <span className="student-name">{user?.name || 'Mahasiswa'}</span>
              <div className="student-header-actions">
                <a className="student-cta ghost" href="#mahasiswa">&larr; Kembali ke Dashboard</a>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Edukasi Regulasi Belmawa Dikti */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          border: '1.5px solid #7dd3fc',
          borderRadius: '18px',
          padding: '1.15rem 1.35rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
          boxShadow: '0 4px 16px rgba(0, 113, 227, 0.06)',
        }}>
          <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.98rem', marginBottom: '0.25rem' }}>
              Ketentuan SIMBELMAWA Dikti: 1 Mahasiswa = 1 Judul Usulan
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', lineHeight: 1.55 }}>
              Sesuai dengan regulasi resmi Program Kreativitas Mahasiswa (PKM) Belmawa Kemendikbudristek, seorang mahasiswa hanya dapat menjadi ketua pengusul pada <strong>1 judul proposal</strong>. Oleh karena itu, topik usulan Anda telah dikunci secara resmi. <strong>Anda dapat terus mengirimkan berkas draf revisi (v1, v2, v3, dst.) secara berkala</strong> hingga lolos pendanaan.
            </p>
          </div>
        </div>

        {/* Card Identitas Usulan Resmi Terdaftar */}
        <div className="student-form-card" style={{ marginBottom: '1.5rem', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div>
              <span className="bento-scheme-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={13} />
                {existingProposal.schemeCode || 'PKM'} · {existingProposal.schemeName || 'Program Kreativitas Mahasiswa'}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.6rem 0 0.25rem', lineHeight: 1.4 }}>
                {existingProposal.title}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              <span className={`status-pill ${statusTone(existingProposal.status)}`}>
                {statusLabel(existingProposal.status)}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Terakhir diperbarui: {formatDateTimeID(existingProposal.updatedAt || existingProposal.createdAt)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#334155' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dosen Pembimbing</span>
              <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{existingSupervisor?.name || 'Menunggu Persetujuan Dosen'}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tim Mahasiswa</span>
              <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{existingTeam?.members?.length || 1} Mahasiswa (Unila)</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Draf Terkini</span>
              <strong style={{ color: '#059669', fontSize: '0.9rem' }}>
                {latestDoc ? `Versi ${latestDoc.versionNumber} (${latestDoc.fileName})` : 'Belum ada draf naskah'}
              </strong>
            </div>
          </div>

          {existingProposal.abstract && (
            <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                <FileText size={13} /> Ringkasan / Abstrak Usulan:
              </span>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' }}>
                {existingProposal.abstract}
              </p>
            </div>
          )}
        </div>

        {/* Notifikasi feedback aksi */}
        {state.error && <div className="student-message-box" style={{ borderLeftColor: '#ef4444', color: '#991b1b', marginBottom: '1.25rem' }}>{state.error}</div>}
        {state.success && <div className="student-message-box" style={{ borderLeftColor: '#10b981', color: '#047857', marginBottom: '1.25rem' }}>{state.success}</div>}

        {/* Card Formulir Kirim Draf Revisi Baru */}
        <div className="student-form-card" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Kirim Draf Revisi Naskah Baru
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Unggah naskah proposal yang telah disesuaikan dan lampirkan catatan perubahan untuk dosen pembimbing.
              </p>
            </div>
            <span style={{
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              borderRadius: '9999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: 800,
            }}>
              Target Revisi: Versi {nextVersionNum}
            </span>
          </div>

          {/* SIMBELMAWA Formatting Warning */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
            <div style={{ fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.5 }}>
              <strong>Periksa Aturan Format Belmawa:</strong> Naskah revisi diunggah <strong>TANPA COVER</strong> dan <strong>TANPA LEMBAR PENGESAHAN</strong>. Maksimal 10 halaman isi utama (Bab 1 s.d. Daftar Pustaka), font Times New Roman 12, spasi 1.15, margin 4-3-3-3 cm.{' '}
              <a href="#pedoman" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#991b1b', textDecoration: 'underline' }}>
                Buka Pedoman Format Belmawa &rarr;
              </a>
            </div>
          </div>

          {/* Dropzone Unggah Naskah Revisi */}
          <div className="student-field">
            <label className="student-label">Unggah Naskah Draf Revisi (PDF / DOCX, maks 10 MB) *</label>
            <div className="apple-upload-dropzone" onClick={() => !state.uploading && revisionFileRef.current?.click()}>
              <input ref={revisionFileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleRevisionUpload} disabled={state.uploading} style={{ display: 'none' }} />
              <div className="apple-upload-icon">
                <UploadCloud size={24} />
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
                {state.uploading ? 'Sedang mengunggah berkas...' : 'Klik untuk memilih naskah draf revisi'}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Format PDF atau DOCX (maksimal 10 MB)
              </p>
              <div className="apple-upload-btn-chip">
                <FileText size={13} />
                <span>{state.uploading ? 'Mengunggah...' : 'Pilih Berkas Revisi'}</span>
              </div>
              {revisionForm.docUrl && (
                <div style={{ marginTop: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.45rem 0.85rem', borderRadius: '12px' }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>
                    {revisionForm.docName || `Draft_v${nextVersionNum}.pdf`}
                  </span>
                  <a href={resolveAssetUrl(revisionForm.docUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#0071e3', fontWeight: 700, marginLeft: '0.25rem' }} onClick={e => e.stopPropagation()}>
                    Buka Pratinjau &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="student-field">
            <label className="student-label">Atau Tautan Berkas Revisi (Google Drive / Cloud)</label>
            <input
              className="student-input"
              type="text"
              value={revisionForm.docUrl}
              onChange={e => setRevisionForm(prev => ({ ...prev, docUrl: e.target.value }))}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <div className="student-field">
            <label className="student-label">Nama Berkas Draf Revisi</label>
            <input
              className="student-input"
              type="text"
              value={revisionForm.docName}
              onChange={e => setRevisionForm(prev => ({ ...prev, docName: e.target.value }))}
              placeholder={`Draft_v${nextVersionNum}_${existingProposal?.schemeCode || 'PKM'}.pdf`}
            />
          </div>

          {/* Catatan Perubahan Revisi (Wajib Diisi) */}
          <div className="student-field">
            <label className="student-label">
              Catatan Perubahan / Keterangan Revisi *
            </label>
            <textarea
              className="student-textarea"
              rows={4}
              value={revisionForm.changeNotes}
              onChange={e => setRevisionForm(prev => ({ ...prev, changeNotes: e.target.value }))}
              placeholder="Jelaskan poin perbaikan pada draf ini (contoh: Memperbaiki Bab 2 Tinjauan Pustaka, menyelaraskan margin 4-3-3-3 cm, memperbarui rincian anggaran biaya sesuai saran pembimbing)..."
            />
            <p className="student-hint">Catatan ini akan langsung terlihat oleh dosen pembimbing dan reviewer internal.</p>
          </div>

          {/* Accordion Perbarui Abstrak (Opsional) */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setRevisionForm(prev => ({ ...prev, showAbstractEditor: !prev.showAbstractEditor }))}
              style={{
                background: 'none', border: 'none', color: '#0071e3', fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0
              }}
            >
              <FileEdit size={14} />
              <span>{revisionForm.showAbstractEditor ? 'Tutup Pengeditan Abstrak' : '✏️ Perbarui Ringkasan Abstrak & Kata Kunci (Opsional)'}</span>
              {revisionForm.showAbstractEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {revisionForm.showAbstractEditor && (
              <div style={{ marginTop: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div className="student-field" style={{ marginBottom: '0.75rem' }}>
                  <label className="student-label" style={{ fontSize: '0.82rem' }}>Abstrak Usulan Baru</label>
                  <textarea
                    className="student-textarea"
                    rows={4}
                    value={revisionForm.abstract}
                    onChange={e => setRevisionForm(prev => ({ ...prev, abstract: e.target.value }))}
                    placeholder="Ringkasan latar belakang, tujuan, metode, dan luaran terbaru..."
                  />
                </div>
                <div className="student-field" style={{ margin: 0 }}>
                  <label className="student-label" style={{ fontSize: '0.82rem' }}>Kata Kunci</label>
                  <input
                    className="student-input"
                    type="text"
                    value={revisionForm.keywords}
                    onChange={e => setRevisionForm(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="contoh: IoT, AI, deteksi margin, tata letak berkas"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tombol Aksi Pengiriman Revisi */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="btn-action secondary"
              onClick={() => submitRevisionDraft(false)}
              disabled={state.loading || state.uploading}
            >
              Simpan Sebagai Draf Revisi
            </button>
            <button
              type="button"
              className="btn-action primary"
              onClick={() => submitRevisionDraft(true)}
              disabled={state.loading || state.uploading}
              style={{ background: '#0071e3', color: '#fff', gap: '0.4rem' }}
            >
              <Send size={14} />
              <span>{state.loading ? 'Mengirim Revisi...' : 'Kirim Revisi ke Pembimbing'}</span>
            </button>
          </div>
        </div>

        {/* Card Riwayat Versi Draf Naskah (Timeline Versioning) */}
        <div className="student-form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Riwayat Versi Draf Naskah Proposal
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Seluruh catatan revisi dan berkas naskah yang pernah dikirimkan oleh tim.
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
              Total: {documents.length} versi draf
            </span>
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
              <Clock size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Belum ada berkas naskah yang diunggah.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '12px',
                      background: idx === 0 ? '#eff6ff' : '#f8fafc',
                      color: idx === 0 ? '#0071e3' : '#64748b',
                      border: `1px solid ${idx === 0 ? '#bfdbfe' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.88rem', flexShrink: 0,
                    }}>
                      v{doc.versionNumber || (documents.length - idx)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>{doc.fileName || 'Naskah Proposal.pdf'}</span>
                        {idx === 0 && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '0.1rem 0.4rem' }}>
                            Terkini
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>Catatan: </span>
                        {doc.changeNotes || 'Tanpa catatan perubahan'} • Diunggah {formatDateTimeID(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>

                  {doc.fileUrl && (
                    <a
                      href={resolveAssetUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-action secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', gap: '0.35rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={13} />
                      <span>Buka Berkas</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // TAMPILAN B: JIKA MAHASISWA BELUM MEMILIKI PROPOSAL (BARU)
  // Alur Wizard 3-Langkah Pengajuan Usulan Pertama Kali
  // -------------------------------------------------------------
  return (
    <div className="module-container">
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">FORMULIR PENGAJUAN PROPOSAL PKM</div>
            <h1 className="module-title">Ajukan Proposal PKM</h1>
            <p className="module-subtitle">
              Sesuai ketentuan Belmawa Dikti, 1 mahasiswa hanya dapat mengusulkan 1 judul proposal. Lengkapi identitas usulan, susun tim, lalu lampirkan berkas naskah.
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

      {/* Alert Informasi Batasan 1 Proposal */}
      <div style={{
        background: '#eff6ff',
        border: '1.5px solid #93c5fd',
        borderRadius: '16px',
        padding: '0.95rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
      }}>
        <Info size={20} color="#0071e3" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Pedoman Belmawa Dikti:</strong> Usulan yang Anda ajukan ini akan menjadi 1 proposal resmi tim Anda pada periode aktif. Setelah usulan dibuat, Anda tetap dapat mengirimkan draf revisi naskah berkali-kali.
        </p>
      </div>

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
              <label className="student-label">Skema PKM *</label>
              <select className="student-select" value={form.scheme} onChange={e => update({ scheme: e.target.value })}>
                <option value="">-- Pilih Skema PKM --</option>
                {schemes.map(s => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
              </select>
              {currentScheme && <p className="student-hint">Skema terpilih: <strong>{currentScheme.name}</strong></p>}
            </div>

            <div className="student-field">
              <label className="student-label">Judul Usulan *</label>
              <input className="student-input" type="text" value={form.title} onChange={e => update({ title: e.target.value })}
                placeholder="Tuliskan judul proposal yang spesifik, inovatif, dan solutif" />
            </div>

            <div className="student-field">
              <label className="student-label">Abstrak Ringkas *</label>
              <textarea className="student-textarea" rows={5} value={form.abstract} onChange={e => update({ abstract: e.target.value })}
                placeholder="Ringkasan latar belakang masalah, tujuan inovasi, metode pelaksanaan, dan luaran yang ditargetkan..." />
            </div>

            <div className="student-field">
              <label className="student-label">Kata Kunci</label>
              <input className="student-input" type="text" value={form.keywords} onChange={e => update({ keywords: e.target.value })}
                placeholder="contoh: IoT, kecerdasan buatan, pertanian presisi, sensor tanah" />
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

                          {/* Deteksi Otomatis Jika NPM yang diketik manual ternyata cocok */}
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
                <button type="button" className="btn-action secondary" onClick={() => submitInitialProposal(false)} disabled={state.loading}>
                  Simpan Draft
                </button>
                <button type="button" className="btn-action primary" onClick={() => submitInitialProposal(true)} disabled={state.loading}>
                  {state.loading ? 'Memproses...' : 'Daftarkan & Ajukan Proposal'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
