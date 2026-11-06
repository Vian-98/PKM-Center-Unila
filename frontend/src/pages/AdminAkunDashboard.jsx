import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  Trash2,
  MessageCircle,
  ShieldCheck,
  FileText,
  Calendar,
  Building,
  GraduationCap,
  Sparkles
} from 'lucide-react'
import { api } from '../lib/content'
import { getToken } from '../lib/studentApi'

export function AdminAkunDashboard({ user }) {
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending') // default view: pending
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)

  // Modals
  const [ktmModal, setKtmModal] = useState(null) // student object
  const [rejectModal, setRejectModal] = useState(null) // student object
  const [rejectReason, setRejectReason] = useState('')

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const token = getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${api}/admin-akun/students?status=all`, { headers })
      const result = await res.json()
      if (res.ok && result?.data) {
        setStudents(result.data)
        if (result.stats) setStats(result.stats)
      } else {
        // Fallback demo data jika offline
        setStudents(fallbackStudents)
        setStats({
          total: fallbackStudents.length,
          pending: fallbackStudents.filter(s => s.accountStatus === 'pending').length,
          active: fallbackStudents.filter(s => s.accountStatus === 'active').length,
          rejected: fallbackStudents.filter(s => s.accountStatus === 'rejected').length
        })
      }
    } catch (err) {
      console.warn('Menggunakan fallback data verifikasi akun:', err)
      setStudents(fallbackStudents)
      setStats({
        total: fallbackStudents.length,
        pending: fallbackStudents.filter(s => s.accountStatus === 'pending').length,
        active: fallbackStudents.filter(s => s.accountStatus === 'active').length,
        rejected: fallbackStudents.filter(s => s.accountStatus === 'rejected').length
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchStatus = statusFilter === 'all' || s.accountStatus === statusFilter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.studentNumber?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.faculty?.toLowerCase().includes(q) ||
        s.studyProgram?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [students, statusFilter, search])

  const getKtmSrc = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/uploads')) return url
    return `/uploads/${url.replace(/^\/+/, '')}`
  }

  // Handle ACC / Approve
  const handleApprove = async (student) => {
    if (!window.confirm(`Setujui (ACC) pendaftaran akun mahasiswa: ${student.name} (${student.studentNumber})?`)) {
      return
    }

    setActionLoading(student.id)
    try {
      const token = getToken()
      const res = await fetch(`${api}/admin-akun/students/${student.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'active' })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        showToast(`Akun ${student.name} berhasil disetujui (ACC)!`, 'success')
        if (ktmModal?.id === student.id) setKtmModal(null)
        fetchStudents()
      } else {
        throw new Error(result.message || 'Gagal menyetujui akun')
      }
    } catch (err) {
      // Offline fallback update
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, accountStatus: 'active', rejectionReason: '' } : s))
      )
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        active: prev.active + 1
      }))
      showToast(`Akun ${student.name} disetujui (Mode Demo).`, 'success')
      if (ktmModal?.id === student.id) setKtmModal(null)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectModal) return

    const student = rejectModal
    const reason = rejectReason.trim() || 'Foto KTM atau data pendaftaran tidak memenuhi kualifikasi.'

    setActionLoading(student.id)
    try {
      const token = getToken()
      const res = await fetch(`${api}/admin-akun/students/${student.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'rejected', reason })
      })
      const result = await res.json()
      if (res.ok && result.success) {
        showToast(`Pendaftaran ${student.name} ditolak.`, 'error')
        setRejectModal(null)
        setRejectReason('')
        if (ktmModal?.id === student.id) setKtmModal(null)
        fetchStudents()
      } else {
        throw new Error(result.message || 'Gagal menolak akun')
      }
    } catch (err) {
      // Offline fallback
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, accountStatus: 'rejected', rejectionReason: reason } : s))
      )
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1
      }))
      showToast(`Pendaftaran ${student.name} ditolak (Mode Demo).`, 'error')
      setRejectModal(null)
      setRejectReason('')
      if (ktmModal?.id === student.id) setKtmModal(null)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Delete (Spam / Invalid)
  const handleDelete = async (student) => {
    if (!window.confirm(`Hapus permanen pendaftaran akun ${student.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setActionLoading(student.id)
    try {
      const token = getToken()
      const res = await fetch(`${api}/admin-akun/students/${student.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const result = await res.json()
      if (res.ok && result.success) {
        showToast(`Akun ${student.name} berhasil dihapus.`, 'info')
        fetchStudents()
      } else {
        throw new Error(result.message || 'Gagal menghapus akun')
      }
    } catch (err) {
      setStudents(prev => prev.filter(s => s.id !== student.id))
      showToast(`Akun ${student.name} dihapus (Mode Demo).`, 'info')
    } finally {
      setActionLoading(null)
    }
  }

  const standardReasons = [
    'Foto Kartu Tanda Mahasiswa (KTM) buram atau tidak terbaca jelas.',
    'Nomor Pokok Mahasiswa (NPM) tidak sesuai dengan nama pada foto KTM.',
    'Masa berlaku KTM sudah kedaluwarsa / bukan mahasiswa aktif.',
    'Bukan mahasiswa jenjang sarjana/diploma aktif di Universitas Lampung.'
  ]

  return (
    <div className="admin-akun-container" style={{ padding: '1.5rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="apple-card-glass" style={{ padding: '1.75rem', borderRadius: '18px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#0071e3',
              background: 'rgba(0, 113, 227, 0.08)',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 113, 227, 0.18)'
            }}
          >
            ROLE: ADMIN AKUN
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• Pengelola Verifikasi Berkas Mahasiswa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Verifikasi Akun &amp; Validasi KTM Mahasiswa
            </h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '850px' }}>
              Tinjau data pendaftaran mahasiswa baru Universitas Lampung, periksa foto Kartu Tanda Mahasiswa (KTM) yang diunggah, dan tentukan persetujuan (ACC) atau penolakan akun sebelum mereka dapat masuk ke sistem PKM Center.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchStudents}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#1e293b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={14} style={{ transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
            <span>{loading ? 'Memuat Data...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Baris Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="apple-card-glass" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Pendaftar</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
          </div>
        </div>

        <div
          className="apple-card-glass"
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: stats.pending > 0 ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.7)',
            background: stats.pending > 0 ? 'rgba(254, 243, 199, 0.3)' : undefined
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Menunggu ACC
              {stats.pending > 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e' }}>{stats.pending}</div>
          </div>
        </div>

        <div className="apple-card-glass" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disetujui (Aktif)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46' }}>{stats.active}</div>
          </div>
        </div>

        <div className="apple-card-glass" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#be123c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ditolak</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9f1239' }}>{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Kontrol Filter & Pencarian */}
      <div
        className="apple-card-glass"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Tab Status */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {[
            { id: 'pending', label: `Menunggu ACC (${stats.pending})` },
            { id: 'all', label: `Semua (${stats.total})` },
            { id: 'active', label: `Disetujui (${stats.active})` },
            { id: 'rejected', label: `Ditolak (${stats.rejected})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                border: statusFilter === tab.id ? '1px solid #0071e3' : '1px solid #cbd5e1',
                background: statusFilter === tab.id ? '#0071e3' : '#fff',
                color: statusFilter === tab.id ? '#fff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input Pencarian */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari Nama, NPM, Email, Fakultas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem 0.5rem 2.3rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Daftar Akun Mahasiswa */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: '0.8rem', fontSize: '0.9rem' }}>Memuat daftar akun mahasiswa...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="apple-card-glass" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 0.35rem 0' }}>Tidak ada pendaftaran ditemukan</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {statusFilter === 'pending'
              ? 'Hebat! Semua pendaftaran akun mahasiswa telah diverifikasi oleh Admin Akun.'
              : 'Tidak ada data mahasiswa yang cocok dengan kriteria filter saat ini.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents.map(student => {
            const isPending = student.accountStatus === 'pending'
            const isActive = student.accountStatus === 'active'
            const isRejected = student.accountStatus === 'rejected'

            return (
              <div
                key={student.id}
                className="apple-card-glass"
                style={{
                  padding: '1.35rem',
                  borderRadius: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  borderLeft: isPending ? '4px solid #f59e0b' : isActive ? '4px solid #10b981' : '4px solid #ef4444'
                }}
              >
                {/* Kolom Kiri: Profil Mahasiswa */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: '300px', flex: '1 1 340px' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0071e3 0%, #004bb5 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {student.name ? student.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'M'}
                  </div>

                  {/* Info Teks */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {student.name}
                      </h3>
                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          background: isPending ? '#fef3c7' : isActive ? '#d1fae5' : '#fee2e2',
                          color: isPending ? '#b45309' : isActive ? '#065f46' : '#991b1b',
                          border: `1px solid ${isPending ? '#fde68a' : isActive ? '#a7f3d0' : '#fecaca'}`
                        }}
                      >
                        {isPending ? 'Menunggu ACC' : isActive ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginTop: '0.35rem', fontSize: '0.82rem', color: '#475569' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>
                        NPM: {student.studentNumber || '-'}
                      </span>
                      <span>•</span>
                      <span>{student.email}</span>
                      {student.phone && (
                        <>
                          <span>•</span>
                          <a
                            href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 600 }}
                          >
                            <MessageCircle size={14} /> {student.phone}
                          </a>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building size={13} /> {student.faculty || 'Unila'}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <GraduationCap size={13} /> {student.studyProgram || student.department || 'Reguler'} ({student.entryYear || 2023})
                      </span>
                    </div>

                    {/* Jika ditolak, tampilkan alasan */}
                    {isRejected && student.rejectionReason && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#9f1239',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <span><strong>Alasan Penolakan:</strong> {student.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kolom Tengah: Thumbnail Foto KTM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {student.ktmUrl ? (
                    <button
                      type="button"
                      onClick={() => setKtmModal(student)}
                      title="Klik untuk memperbesar foto KTM"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '32px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#e2e8f0',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        <img
                          src={getKtmSrc(student.ktmUrl)}
                          alt="KTM"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
                          }}
                        />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0071e3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Eye size={12} /> Buka Foto KTM
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Klik untuk validasi</div>
                      </div>
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.35rem 0.6rem' }}>
                      (Foto KTM tidak ada)
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Tombol Aksi */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading === student.id}
                        onClick={() => handleApprove(student)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.95rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Check size={15} strokeWidth={2.5} /> Setujui (ACC)
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading === student.id}
                        onClick={() => {
                          setRejectModal(student)
                          setRejectReason('')
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          background: '#fff1f2',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <X size={15} strokeWidth={2.5} /> Tolak
                      </button>
                    </>
                  )}

                  {isActive && (
                    <button
                      type="button"
                      disabled={actionLoading === student.id}
                      onClick={() => {
                        setRejectModal(student)
                        setRejectReason('Peninjauan ulang: Akun ditangguhkan oleh Admin Akun.')
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Tolak / Nonaktifkan
                    </button>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      disabled={actionLoading === student.id}
                      onClick={() => handleApprove(student)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #a7f3d0',
                        background: '#ecfdf5',
                        color: '#059669',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={13} /> ACC Ulang
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(student)}
                    title="Hapus akun"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '0.45rem',
                      borderRadius: '6px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: LIGHTBOX FOTO KTM (PERIKSA DOKUMEN ASLI) */}
      {/* ============================================================ */}
      {ktmModal && (
        <div
          className="modal-backdrop"
          onClick={() => setKtmModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
        >
          <div
            className="apple-card-glass"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Pemeriksaan Kartu Tanda Mahasiswa (KTM)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  {ktmModal.name} • NPM: <strong style={{ color: '#0369a1' }}>{ktmModal.studentNumber}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKtmModal(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Foto KTM */}
            <div style={{ padding: '1.5rem', background: '#f8fafc', textAlign: 'center' }}>
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  background: '#000',
                  maxHeight: '450px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={getKtmSrc(ktmModal.ktmUrl)}
                  alt={`KTM - ${ktmModal.name}`}
                  style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
                  }}
                />
              </div>

              {/* Rincian Komparasi Data Mahasiswa */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  textAlign: 'left',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Nama Terdaftar:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{ktmModal.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Nomor Pokok Mahasiswa:</span>
                  <div style={{ fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>{ktmModal.studentNumber}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Fakultas:</span>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{ktmModal.faculty || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Program Studi / Angkatan:</span>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{ktmModal.studyProgram || '-'} ({ktmModal.entryYear || '-'})</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                onClick={() => setKtmModal(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectModal(ktmModal)
                  setRejectReason('')
                }}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <X size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tolak Pendaftaran
              </button>

              <button
                type="button"
                onClick={() => handleApprove(ktmModal)}
                style={{
                  padding: '0.55rem 1.3rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Check size={16} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Setujui (ACC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ALASAN PENOLAKAN AKUN */}
      {/* ============================================================ */}
      {rejectModal && (
        <div
          className="modal-backdrop"
          onClick={() => setRejectModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1.5rem'
          }}
        >
          <div
            className="apple-card-glass"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '18px',
              maxWidth: '540px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626', marginBottom: '0.5rem' }}>
              <AlertTriangle size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Tolak Pendaftaran Akun</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0' }}>
              Berikan alasan penolakan untuk <strong>{rejectModal.name}</strong> ({rejectModal.studentNumber}). Mahasiswa akan melihat alasan ini saat mencoba masuk.
            </p>

            <form onSubmit={handleRejectSubmit}>
              {/* Opsi Alasan Cepat */}
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pilih Alasan Standar:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {standardReasons.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectReason(r)}
                      style={{
                        textAlign: 'left',
                        padding: '0.4rem 0.65rem',
                        borderRadius: '6px',
                        border: rejectReason === r ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        background: rejectReason === r ? '#fff1f2' : '#f8fafc',
                        fontSize: '0.78rem',
                        color: rejectReason === r ? '#9f1239' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      • {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Teks Alasan */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                  Catatan / Keterangan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Tuliskan catatan detail jika diperlukan..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectModal.id}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  Konfirmasi Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Fallback demo data jika offline
const fallbackStudents = [
  {
    id: 'demo-mhs-pending',
    name: 'Dimas Aditya',
    studentNumber: '2317051088',
    email: 'dimas.aditya@student.unila.ac.id',
    phone: '081234567890',
    faculty: 'FMIPA',
    department: 'Ilmu Komputer',
    studyProgram: 'S1 Ilmu Komputer',
    entryYear: 2023,
    accountStatus: 'pending',
    createdAt: new Date().toISOString(),
    ktmUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    rejectionReason: ''
  },
  {
    id: 'demo-mhs-rejected',
    name: 'Riko Prasetyo',
    studentNumber: '2315061099',
    email: 'riko.prasetyo@student.unila.ac.id',
    phone: '081298765432',
    faculty: 'Fakultas Teknik',
    department: 'Teknik Mesin',
    studyProgram: 'S1 Teknik Mesin',
    entryYear: 2023,
    accountStatus: 'rejected',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    ktmUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    rejectionReason: 'Foto KTM buram dan nomor pokok mahasiswa tidak terbaca jelas.'
  },
  {
    id: 'demo-mhs-active-1',
    name: 'Nadia Putri Maharani',
    studentNumber: '2117051001',
    email: 'mahasiswa@pkm.unila.ac.id',
    phone: '082188990011',
    faculty: 'Fakultas Teknik',
    department: 'Teknik Elektro',
    studyProgram: 'S1 Teknik Elektro',
    entryYear: 2021,
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    ktmUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    rejectionReason: ''
  },
  {
    id: 'demo-mhs-active-2',
    name: 'Favian Rifqi Pratama',
    studentNumber: '2217051020',
    email: 'mhs1@pkm.unila.ac.id',
    phone: '081377889922',
    faculty: 'FMIPA',
    department: 'Ilmu Komputer',
    studyProgram: 'S1 Ilmu Komputer',
    entryYear: 2022,
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    ktmUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
    rejectionReason: ''
  }
]

