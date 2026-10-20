import { useState, useEffect, useRef, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '../lib/content'
import {
  loadStore,
  saveStore,
  SYSTEM_USERS,
  resolveCurrentUserId,
  getContactsForUser,
  initialMasterMessages,
  initialProposalFeedback,
} from '../lib/dosenReviewerData'

export function PesanFeedback({ user, onLogin, onSwitchUser }) {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'feedback'


  // Resolusi identitas pengguna aktif yang sedang login
  const currentUserId = useMemo(() => resolveCurrentUserId(user), [user])
  const currentUserName = user?.name || user?.nama || (currentUserId ? SYSTEM_USERS[currentUserId]?.name : '') || 'Pengguna PKM'
  const currentUserRole = user?.role ? user.role.toUpperCase() : (currentUserId ? SYSTEM_USERS[currentUserId]?.role?.toUpperCase() : '') || 'PENGGUNA'

  // Master Direct Messages Database (Tersimpan lintas akun di LocalStorage)
  const [masterMessages, setMasterMessages] = useState(() => {
    // Bersihkan seluruh riwayat chat di semua akun
    if (localStorage.getItem('pkm_direct_messages_version_v5') !== 'clean') {
      localStorage.setItem('pkm_direct_messages_version_v5', 'clean')
      saveStore('pkm_master_direct_messages', [])
      return []
    }
    return loadStore('pkm_master_direct_messages', [])
  })

  // Kontak kustom yang ditambahkan manual oleh pengguna
  const [customContacts, setCustomContacts] = useState(() =>
    loadStore('pkm_custom_contacts', [])
  )

  // Kontak yang sedang aktif dipilih di jendela chat (prioritaskan target navigasi atau kontak chat terakhir)
  const [selectedContactId, setSelectedContactId] = useState(() => {
    const target = localStorage.getItem('pkm_target_chat_contact')
    if (target) {
      localStorage.removeItem('pkm_target_chat_contact')
      return target
    }
    return ''
  })

  // Sinkronisasi target kontak jika dipicu dari halaman lain (CariTim / DosenDashboard)
  useEffect(() => {
    const target = localStorage.getItem('pkm_target_chat_contact')
    if (target) {
      setSelectedContactId(target)
      localStorage.removeItem('pkm_target_chat_contact')
    }
  }, [])

  // Hitung daftar kontak yang HANYA memiliki riwayat percakapan nyata (ada chat)
  const contactsList = useMemo(() => {
    const allKnown = [
      ...Object.values(SYSTEM_USERS),
      ...customContacts.filter(c => c.ownerId === currentUserId)
    ]

    const userMap = new Map()
    for (const u of allKnown) {
      const uid = u.id || u.contactId
      if (uid && uid !== currentUserId) {
        userMap.set(uid, u)
      }
    }

    const listWithHistory = []

    for (const [cid, u] of userMap.entries()) {
      const cName = u.name || u.contactName || 'Pengguna PKM'
      const cRole = u.roleLabel || u.contactRole || (u.role ? u.role.toUpperCase() : 'PENGGUNA')
      const cEmail = u.email || u.contactEmail || '-'
      const cAvatar = u.avatar || cName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()

      // Cari pesan antara pengguna aktif dan kontak ini (abaikan yang telah dihapus oleh pengguna aktif)
      const relevant = masterMessages.filter(
        m => !m.deletedFor?.includes(currentUserId) &&
             ((m.senderId === currentUserId && m.receiverId === cid) ||
              (m.senderId === cid && m.receiverId === currentUserId))
      )

      const hasHistory = relevant.length > 0
      const isTargeted = cid === selectedContactId

      // HANYA tampilkan kontak jika memiliki riwayat chat nyata ATAU sedang dibuka oleh pengguna
      if (hasHistory || isTargeted) {
        const lastMsg = relevant[relevant.length - 1]
        listWithHistory.push({
          contactId: cid,
          contactName: cName,
          contactRole: cRole,
          contactEmail: cEmail,
          avatar: cAvatar,
          lastMessage: lastMsg ? lastMsg.message : 'Percakapan baru (belum ada pesan)...',
          lastSentAt: lastMsg ? lastMsg.createdAt : new Date().toISOString(),
          unreadCount: 0,
          hasHistory,
        })
      }
    }

    // Urutkan berdasarkan waktu pesan terakhir (paling baru di atas)
    return listWithHistory.sort((a, b) => new Date(b.lastSentAt) - new Date(a.lastSentAt))
  }, [currentUserId, customContacts, masterMessages, selectedContactId])

  // Jaga agar selectedContactId selalu sinkron dengan kontak aktif
  useEffect(() => {
    if (contactsList.length > 0) {
      const exists = contactsList.some(c => c.contactId === selectedContactId)
      if (!exists || selectedContactId === currentUserId) {
        setSelectedContactId(contactsList[0].contactId)
      }
    } else {
      setSelectedContactId('')
    }
  }, [contactsList, selectedContactId, currentUserId])

  const [inputText, setInputText] = useState('')
  const [searchContact, setSearchContact] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'dosen' | 'mahasiswa'

  // State Rekap Catatan Revisi & Feedback Proposal
  const [feedbacks, setFeedbacks] = useState(() => {
    if (localStorage.getItem('pkm_proposal_feedback_v5') !== 'clean') {
      localStorage.setItem('pkm_proposal_feedback_v5', 'clean')
      saveStore('pkm_proposal_feedback', [])
      return []
    }
    return loadStore('pkm_proposal_feedback', [])
  })
  const [feedbackFilter, setFeedbackFilter] = useState('all') // 'all' | 'revision' | 'approved'
  const [feedbackSearch, setFeedbackSearch] = useState('')

  // Modal Tambah Catatan Revisi
  const [newFeedbackModal, setNewFeedbackModal] = useState({
    isOpen: false,
    proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
    feedbackType: 'revision',
    comment: '',
    requiresRevision: true,
  })

  // Modal Mulai Percakapan Baru
  const [newContactModal, setNewContactModal] = useState({
    isOpen: false,
    selectedSystemUser: '',
    name: '',
    email: '',
    role: '',
    initialMessage: '',
  })

  // Modal Informasi Kontak
  const [contactInfoModal, setContactInfoModal] = useState({
    isOpen: false,
    contact: null,
  })

  const messagesEndRef = useRef(null)
  const token = localStorage.getItem('pkm_token')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Sinkronisasi otomatis ke LocalStorage
  useEffect(() => {
    saveStore('pkm_master_direct_messages', masterMessages)
  }, [masterMessages])

  useEffect(() => {
    saveStore('pkm_custom_contacts', customContacts)
  }, [customContacts])

  useEffect(() => {
    saveStore('pkm_proposal_feedback', feedbacks)
  }, [feedbacks])

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom()
    }
  }, [selectedContactId, masterMessages, activeTab])

  // Kontak terpilih saat ini
  const selectedContact = contactsList.find(c => c.contactId === selectedContactId) || contactsList[0]

  // Filter pesan riil antara pengguna aktif dan kontak terpilih (abaikan yang telah dihapus oleh pengguna aktif)
  const currentMessages = useMemo(() => {
    if (!selectedContactId) return []
    return masterMessages.filter(
      m => !m.deletedFor?.includes(currentUserId) &&
           ((m.senderId === currentUserId && m.receiverId === selectedContactId) ||
            (m.senderId === selectedContactId && m.receiverId === currentUserId))
    )
  }, [masterMessages, currentUserId, selectedContactId])

  // Hapus riwayat chat perseorangan hanya dari sisi pengguna aktif (tetap tersimpan bagi lawan bicara)
  const handleDeleteConversation = () => {
    if (!selectedContactId) return
    const contactName = selectedContact?.contactName || 'kontak ini'
    if (window.confirm(`Hapus riwayat chat dengan ${contactName}?\n\nPesan hanya akan terhapus dari tampilan akun Anda dan tetap tersimpan pada akun lawan bicara.`)) {
      setMasterMessages(prev =>
        prev.map(m => {
          const isBetween = (m.senderId === currentUserId && m.receiverId === selectedContactId) ||
                            (m.senderId === selectedContactId && m.receiverId === currentUserId)
          if (isBetween) {
            const deletedFor = Array.isArray(m.deletedFor) ? m.deletedFor : []
            if (!deletedFor.includes(currentUserId)) {
              return { ...m, deletedFor: [...deletedFor, currentUserId] }
            }
          }
          return m
        })
      )
      setSelectedContactId('')
    }
  }

  // Kirim Pesan Riil (Multi-User Inter-Account Tanpa Bot Palsu)
  const handleSendMessage = async (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || !selectedContactId) return

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      receiverId: selectedContactId,
      message: trimmed,
      createdAt: new Date().toISOString(),
    }

    // Simpan ke master store yang terbaca oleh akun penerima
    setMasterMessages(prev => [...prev, newMsg])
    setInputText('')

    // Jika backend aktif, kirim juga ke server
    if (token) {
      try {
        await fetch(`${api}/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            receiverId: selectedContactId,
            message: trimmed,
          }),
        })
      } catch (err) {
        console.warn('Backend server offline, pesan tersimpan aman di penyimpanan lokal klien.', err)
      }
    }
  }

  // Tambah Kontak Baru via Modal (+ Chat Baru)
  const handleCreateContact = (e) => {
    e.preventDefault()

    let targetId = newContactModal.selectedSystemUser
    let targetName = newContactModal.name.trim()
    let targetRole = newContactModal.role.trim() || 'Pengguna PKM'
    let targetEmail = newContactModal.email.trim()

    if (targetId && SYSTEM_USERS[targetId]) {
      const u = SYSTEM_USERS[targetId]
      targetName = u.name
      targetRole = u.roleLabel
      targetEmail = u.email
    } else if (targetName) {
      targetId = `custom-${Date.now()}`
      if (!targetEmail) {
        targetEmail = `${targetName.toLowerCase().replace(/[^a-z0-9]/g, '')}@pkm.unila.ac.id`
      }
      const newCustomItem = {
        ownerId: currentUserId,
        id: targetId,
        name: targetName,
        roleLabel: targetRole,
        email: targetEmail,
        avatar: targetName.slice(0, 2).toUpperCase(),
      }
      setCustomContacts(prev => [newCustomItem, ...prev])
    } else {
      return
    }

    // Jika ada pesan awal, kirimkan langsung
    if (newContactModal.initialMessage.trim()) {
      const firstMsg = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: targetId,
        message: newContactModal.initialMessage.trim(),
        createdAt: new Date().toISOString(),
      }
      setMasterMessages(prev => [...prev, firstMsg])
    }

    setSelectedContactId(targetId)
    setNewContactModal({
      isOpen: false,
      selectedSystemUser: '',
      name: '',
      email: '',
      role: '',
      initialMessage: '',
    })
  }

  // Tambah Feedback / Catatan Revisi Baru
  const handleCreateFeedback = (e) => {
    e.preventDefault()
    if (!newFeedbackModal.comment.trim()) return

    const authorLabel = `${currentUserName} (${currentUserRole})`

    const newFb = {
      id: `fb-${Date.now()}`,
      proposalId: 'prop-01',
      proposalTitle: newFeedbackModal.proposalTitle.trim(),
      authorName: authorLabel,
      authorRole: user?.role || 'dosen',
      feedbackType: newFeedbackModal.feedbackType,
      comment: newFeedbackModal.comment.trim(),
      requiresRevision: newFeedbackModal.requiresRevision,
      createdAt: new Date().toISOString(),
      status: newFeedbackModal.requiresRevision ? 'pending' : 'approved',
    }

    setFeedbacks(prev => [newFb, ...prev])
    setNewFeedbackModal({
      isOpen: false,
      proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung Berbasis Edge AI',
      feedbackType: 'revision',
      comment: '',
      requiresRevision: true,
    })
    alert('Catatan revisi berhasil diterbitkan ke rekapitulasi proposal.')
  }

  // Filter daftar kontak berdasarkan input pencarian & filter kategori (Semua / Dosen / Mahasiswa)
  const filteredContacts = useMemo(() => {
    return contactsList.filter(c => {
      const matchSearch = (
        c.contactName.toLowerCase().includes(searchContact.toLowerCase()) ||
        c.contactRole.toLowerCase().includes(searchContact.toLowerCase())
      )
      if (!matchSearch) return false

      if (categoryFilter === 'dosen') {
        const u = SYSTEM_USERS[c.contactId]
        return u?.role === 'dosen' || c.contactRole.toLowerCase().includes('dosen')
      }
      if (categoryFilter === 'mahasiswa') {
        const u = SYSTEM_USERS[c.contactId]
        return u?.role === 'mahasiswa' || c.contactRole.toLowerCase().includes('mahasiswa')
      }
      return true
    })
  }, [contactsList, searchContact, categoryFilter])

  // Filter rekap catatan revisi
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchStatus = feedbackFilter === 'revision'
        ? f.requiresRevision
        : feedbackFilter === 'approved'
        ? !f.requiresRevision
        : true

      const matchSearch = feedbackSearch === '' ? true : (
        f.proposalTitle.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        f.comment.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
        f.authorName.toLowerCase().includes(feedbackSearch.toLowerCase())
      )

      return matchStatus && matchSearch
    })
  }, [feedbacks, feedbackFilter, feedbackSearch])

  // Daftar pengguna lain di sistem untuk opsi "+ Chat Baru"
  const directoryOptions = useMemo(() => {
    return Object.values(SYSTEM_USERS).filter(u => u.id !== currentUserId)
  }, [currentUserId])

  // Jika pengguna belum login, tampilkan gateway autentikasi resmi
  if (!user) {
    return (
      <div className="module-container" style={{ maxWidth: '850px', margin: '2rem auto', padding: '1.5rem 1rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0b2149', margin: '0 0 0.5rem 0' }}>
            Masuk untuk Membuka Kotak Pesan Anda
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '560px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            Kotak pesan PKM Center bersifat privat untuk masing-masing akun terdaftar. Siapa yang login menentukan kontak yang terhubung dengan Anda dan percakapan bimbingan yang Anda akses.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <button
              type="button"
              className="btn-action primary"
              style={{ padding: '0.75rem 1.85rem', fontSize: '0.95rem', borderRadius: '0.75rem', fontWeight: 700 }}
              onClick={onLogin}
            >
              Masuk dengan Akun SSO Unila &rarr;
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.75rem' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1rem 0' }}>
              Pilih Cepat Akun untuk Menguji Percakapan Antar-Pengguna:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', textAlign: 'left' }}>
              {Object.values(SYSTEM_USERS).map(u => (
                <div
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '0.85rem',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                >
                  <div className="contact-avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                    {u.avatar}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                      {u.roleLabel}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Klik untuk Masuk &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`module-container ${activeTab === 'chat' ? 'chat-page-fullscreen' : ''}`}
      style={activeTab === 'chat' ? {
        height: 'calc(100vh - 4.5rem - 3.5rem)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0',
      } : undefined}
    >
      {/* Sleek Integrated Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0b2149', margin: 0 }}>
              Pusat Pesan Langsung & Feedback
            </h1>
            <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontWeight: 700 }}>
              {currentUserRole} — {currentUserName}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
            Komunikasi substansi dan klarifikasi bimbingan PKM terhubung langsung antar-akun tanpa bot demo.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Tab Switcher */}
          <div className="modern-tabs" style={{ marginBottom: 0 }}>
            <button
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
            >
              <span>Pesan Langsung</span>
              <span className="tab-badge">{contactsList.length}</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
            >
              <span>Catatan Revisi</span>
              <span className="tab-badge">{feedbacks.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SISTEM DIRECT MESSAGE (CHAT) */}
      {activeTab === 'chat' && (
        <section className="chat-wrapper" style={{ flex: 1, minHeight: 0, height: 'auto', maxHeight: 'none', marginBottom: 0 }}>
          {/* Kolom Kiri: Daftar Kontak Percakapan Terhubung */}
          <aside className="chat-contacts-sidebar">
            <div className="chat-sidebar-search" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari kontak mahasiswa / dosen..."
                value={searchContact}
                onChange={e => setSearchContact(e.target.value)}
              />
              <button
                type="button"
                className="btn-action primary"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: true }))}
              >
                + Chat Baru
              </button>
            </div>

            {/* Tab Filter Cepat: Semua / Dosen / Mahasiswa */}
            <div style={{ display: 'flex', gap: '0.35rem', padding: '0.55rem 0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                style={{
                  flex: 1,
                  padding: '0.3rem 0.4rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  background: categoryFilter === 'all' ? '#2563eb' : '#e2e8f0',
                  color: categoryFilter === 'all' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('dosen')}
                style={{
                  flex: 1,
                  padding: '0.3rem 0.4rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  background: categoryFilter === 'dosen' ? '#059669' : '#e2e8f0',
                  color: categoryFilter === 'dosen' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Dosen
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('mahasiswa')}
                style={{
                  flex: 1,
                  padding: '0.3rem 0.4rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  background: categoryFilter === 'mahasiswa' ? '#7c3aed' : '#e2e8f0',
                  color: categoryFilter === 'mahasiswa' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Mahasiswa
              </button>
            </div>

            <div className="chat-contacts-list">
              {filteredContacts.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    {searchContact ? 'Tidak ada kontak yang cocok' : 'Belum Ada Riwayat Chat'}
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    {searchContact
                      ? 'Coba gunakan kata kunci lain.'
                      : 'Hanya kontak dengan riwayat percakapan yang ditampilkan di sini.'}
                  </p>
                  <button
                    type="button"
                    className="btn-action primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px', margin: '0 auto' }}
                    onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: true }))}
                  >
                    + Chat Baru
                  </button>
                </div>
              ) : (
                filteredContacts.map(c => {
                  const isSelected = c.contactId === selectedContactId
                  return (
                    <div
                      key={c.contactId}
                      className={`chat-contact-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedContactId(c.contactId)}
                    >
                      <div className="contact-avatar">
                        {c.avatar}
                      </div>
                      <div className="contact-info">
                        <div className="contact-name">{c.contactName}</div>
                        <div className="contact-role-sub">{c.contactRole}</div>
                        <div className="contact-last-msg">{c.lastMessage}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Kolom Kanan: Jendela Percakapan */}
          <main className="chat-main-area">
            {!selectedContact ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                  Belum Ada Percakapan Aktif
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '420px', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  Halaman pesan hanya menampilkan kontak yang memiliki riwayat chat. Klik tombol di bawah untuk memulai obrolan baru dengan dosen pembimbing atau rekan mahasiswa.
                </p>
                <button
                  type="button"
                  className="btn-action primary"
                  onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: true }))}
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '9999px' }}
                >
                  + Mulai Chat Baru
                </button>
              </div>
            ) : (
              <>
                {/* Header Chat Aktif */}
                <div className="chat-header">
                  <div className="chat-header-user">
                    <div className="contact-avatar">
                      {selectedContact?.avatar || 'PK'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                        {selectedContact?.contactName || 'Pilih Kontak'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <span>Terhubung - {selectedContact?.contactRole}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-action danger"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={handleDeleteConversation}
                      title="Hapus riwayat chat dengan kontak ini dari tampilan Anda"
                    >
                      <Trash2 size={13} />
                      <span>Hapus Chat</span>
                    </button>
                    <button
                      className="btn-action secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => setContactInfoModal({ isOpen: true, contact: selectedContact })}
                    >
                      Info Kontak
                    </button>
                  </div>
                </div>

                {/* Riwayat Balon Pesan */}
                <div className="chat-messages-scroll">
                  <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem 0' }}>
                    <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '0.2rem 0.75rem', borderRadius: '9999px' }}>
                      Saluran Komunikasi Resmi PKM Center — Universitas Lampung
                    </span>
                  </div>

                  {currentMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#64748b' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155', marginBottom: '0.35rem' }}>
                        Belum ada riwayat pesan langsung dengan {selectedContact?.contactName}.
                      </div>
                      <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                        Ketik pesan pertama Anda di bawah untuk memulai konsultasi bimbingan, pertanyaan review, atau koordinasi teknis.
                      </p>
                    </div>
                  ) : (
                    currentMessages.map(msg => {
                      const isMine = msg.senderId === currentUserId
                      return (
                        <div
                          key={msg.id}
                          className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                        >
                          {!isMine && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.2rem' }}>
                              {msg.senderName || selectedContact?.contactName}
                            </div>
                          )}
                          <div>{msg.message}</div>
                          <div className="chat-bubble-time">
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            {isMine && ' - Terkirim'}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar Pesan */}
                <form className="chat-input-bar" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={`Tulis pesan untuk ${selectedContact?.contactName || 'kontak'}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn-action primary"
                    style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem' }}
                    disabled={!inputText.trim()}
                  >
                    Kirim
                  </button>
                </form>
              </>
            )}
          </main>
        </section>
      )}

      {/* TAB 2: REKAP CATATAN REVISI & FEEDBACK */}
      {activeTab === 'feedback' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0b2149', margin: 0 }}>
                Rekapitulasi Catatan Revisi & Feedback Proposal
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Kronologi seluruh catatan pembimbingan dan evaluasi reviewer untuk memastikan perbaikan naskah terekam rapi.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Cari proposal atau isi catatan..."
                value={feedbackSearch}
                onChange={e => setFeedbackSearch(e.target.value)}
                style={{ padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '0.55rem', fontSize: '0.85rem', minWidth: '200px' }}
              />

              <div className="modern-tabs" style={{ marginBottom: 0 }}>
                <button
                  className={`tab-btn ${feedbackFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFeedbackFilter('all')}
                >
                  Semua ({feedbacks.length})
                </button>
                <button
                  className={`tab-btn ${feedbackFilter === 'revision' ? 'active' : ''}`}
                  onClick={() => setFeedbackFilter('revision')}
                >
                  Perlu Revisi ({feedbacks.filter(f => f.requiresRevision).length})
                </button>
                <button
                  className={`tab-btn ${feedbackFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setFeedbackFilter('approved')}
                >
                  Disetujui ({feedbacks.filter(f => !f.requiresRevision).length})
                </button>
              </div>

              <button
                className="btn-action primary"
                onClick={() => setNewFeedbackModal(prev => ({ ...prev, isOpen: true }))}
              >
                Tambah Catatan Revisi
              </button>
            </div>
          </div>

          {/* Timeline Kartu Feedback */}
          <div className="feedback-timeline">
            {filteredFeedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b' }}>Tidak ada catatan revisi yang sesuai dengan filter pencarian.</p>
              </div>
            ) : (
              filteredFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  className={`feedback-card ${fb.requiresRevision ? 'needs-revision' : 'approved'}`}
                >
                  <div className="feedback-card-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="feedback-author">
                        {fb.authorName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        - {new Date(fb.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <span className={`status-pill ${fb.requiresRevision ? 'pending' : 'accepted'}`}>
                      {fb.requiresRevision ? 'Memerlukan Revisi' : 'Telah Disetujui'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Proposal: {fb.proposalTitle}
                  </div>

                  <div className="feedback-comment">
                    "{fb.comment}"
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {fb.requiresRevision ? (
                      <button
                        className="btn-action success"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setFeedbacks(prev =>
                            prev.map(item =>
                              item.id === fb.id ? { ...item, requiresRevision: false, status: 'resolved' } : item
                            )
                          )
                          alert('Status revisi berhasil ditandai selesai diperbaiki.')
                        }}
                      >
                        Tandai Selesai Diperbaiki
                      </button>
                    ) : (
                      <button
                        className="btn-action secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setFeedbacks(prev =>
                            prev.map(item =>
                              item.id === fb.id ? { ...item, requiresRevision: true, status: 'pending' } : item
                            )
                          )
                        }}
                      >
                        Buka Kembali Status Revisi
                      </button>
                    )}
                    <button
                      className="btn-action secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setActiveTab('chat')
                      }}
                    >
                      Balas via Chat
                    </button>
                    <button
                      type="button"
                      className="btn-action danger"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        if (window.confirm('Hapus catatan revisi ini dari rekap?')) {
                          setFeedbacks(prev => prev.filter(item => item.id !== fb.id))
                        }
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* MODAL MULAI PERCAKAPAN BARU (+ CHAT BARU) */}
      {newContactModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateContact}>
              <div className="modal-dialog-header">
                <h3>Mulai Percakapan Chat Baru</h3>
                <button type="button" className="modal-close-btn" onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: false }))}>x</button>
              </div>
              <div className="modal-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Pilih Pengguna dari Direktori Resmi PKM Center:
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: '#f8fafc', fontSize: '0.9rem' }}
                    value={newContactModal.selectedSystemUser}
                    onChange={e => {
                      const selId = e.target.value
                      if (selId && SYSTEM_USERS[selId]) {
                        const sel = SYSTEM_USERS[selId]
                        setNewContactModal(prev => ({
                          ...prev,
                          selectedSystemUser: selId,
                          name: sel.name,
                          role: sel.roleLabel,
                          email: sel.email,
                        }))
                      } else {
                        setNewContactModal(prev => ({
                          ...prev,
                          selectedSystemUser: '',
                        }))
                      }
                    }}
                  >
                    <option value="">-- Pilih dari akun terdaftar atau masukkan kustom di bawah --</option>
                    <optgroup label="Dosen Pembimbing">
                      {directoryOptions.filter(u => u.role === 'dosen').map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.roleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Rekan Mahasiswa PKM">
                      {directoryOptions.filter(u => u.role === 'mahasiswa').map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.roleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Reviewer & Admin">
                      {directoryOptions.filter(u => u.role !== 'dosen' && u.role !== 'mahasiswa').map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.roleLabel}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Nama Kontak / Tim:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    placeholder="Contoh: Bima Satria / Dr. Rizmi"
                    value={newContactModal.name}
                    onChange={e => setNewContactModal(prev => ({ ...prev, name: e.target.value, selectedSystemUser: '' }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Peran / Status Pengguna:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    placeholder="Contoh: Mahasiswa (Ketua Tim PKM-KC) / Dosen Pendamping"
                    value={newContactModal.role}
                    onChange={e => setNewContactModal(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Pesan Pembuka (Opsional):
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '80px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                    placeholder="Ketik salam dan pesan pembuka percakapan..."
                    value={newContactModal.initialMessage}
                    onChange={e => setNewContactModal(prev => ({ ...prev, initialMessage: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button type="button" className="btn-action secondary" onClick={() => setNewContactModal(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </button>
                <button type="submit" className="btn-action primary">
                  Buka Percakapan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH CATATAN REVISI BARU */}
      {newFeedbackModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNewFeedbackModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateFeedback}>
              <div className="modal-dialog-header">
                <h3>Tambah Catatan Revisi / Feedback Baru</h3>
                <button type="button" className="modal-close-btn" onClick={() => setNewFeedbackModal(prev => ({ ...prev, isOpen: false }))}>x</button>
              </div>

              <div className="modal-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Proposal Sasaran:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: '#f8fafc' }}
                    value={newFeedbackModal.proposalTitle}
                    onChange={e => setNewFeedbackModal(prev => ({ ...prev, proposalTitle: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Kategori Catatan:
                  </label>
                  <select
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    value={newFeedbackModal.feedbackType}
                    onChange={e => setNewFeedbackModal(prev => ({
                      ...prev,
                      feedbackType: e.target.value,
                      requiresRevision: e.target.value === 'revision',
                    }))}
                  >
                    <option value="revision">Catatan Revisi Wajib (Memerlukan Revisi Naskah)</option>
                    <option value="comment">Komentar / Saran Konstruktif</option>
                    <option value="approval">Persetujuan Bagian (Persetujuan / ACC)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Isi Catatan Revisi / Masukan:
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '120px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                    placeholder="Tuliskan bab, halaman, dan instruksi perbaikan konkret untuk tim pengusul..."
                    value={newFeedbackModal.comment}
                    onChange={e => setNewFeedbackModal(prev => ({ ...prev, comment: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={newFeedbackModal.requiresRevision}
                      onChange={e => setNewFeedbackModal(prev => ({ ...prev, requiresRevision: e.target.checked }))}
                    />
                    Tandai proposal berstatus "Memerlukan Revisi"
                  </label>
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button type="button" className="btn-action secondary" onClick={() => setNewFeedbackModal(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </button>
                <button type="submit" className="btn-action primary">
                  Terbitkan Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INFORMASI KONTAK */}
      {contactInfoModal.isOpen && (
        <div className="modal-overlay" onClick={() => setContactInfoModal({ isOpen: false, contact: null })}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog-header">
              <h3>Profil & Informasi Kontak Pengguna</h3>
              <button className="modal-close-btn" onClick={() => setContactInfoModal({ isOpen: false, contact: null })}>x</button>
            </div>
            <div className="modal-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.65rem' }}>
                <div className="contact-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                  {contactInfoModal.contact?.avatar || 'PK'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.05rem' }}>
                    {contactInfoModal.contact?.contactName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                    Aktif di Sistem PKM Center Unila
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Peran / Penugasan:</span>
                  <strong>{contactInfoModal.contact?.contactRole}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Email Resmi:</span>
                  <strong>{contactInfoModal.contact?.contactEmail || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Afiliasi:</span>
                  <strong>Universitas Lampung</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#64748b' }}>Pesan Terakhir:</span>
                  <span style={{ maxWidth: '60%', textAlign: 'right', fontStyle: 'italic', color: '#64748b' }}>
                    "{contactInfoModal.contact?.lastMessage || '-'}"
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-dialog-footer">
              <button
                type="button"
                className="btn-action secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(contactInfoModal.contact?.contactEmail || '')
                  alert(`Alamat email ${contactInfoModal.contact?.contactEmail} berhasil disalin ke papan klip.`)
                }}
              >
                Salin Alamat Email
              </button>
              <button
                type="button"
                className="btn-action primary"
                onClick={() => setContactInfoModal({ isOpen: false, contact: null })}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
