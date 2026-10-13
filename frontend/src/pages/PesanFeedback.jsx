import { useState, useEffect, useRef, useMemo } from 'react'
import { api } from '../lib/content'
import {
  loadStore,
  saveStore,
  initialConversations,
  initialChatThreads,
  initialProposalFeedback,
} from '../lib/dosenReviewerData'

export function PesanFeedback({ user }) {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'feedback'

  // Persistent State agar percakapan dan catatan revisi tidak statis
  const [conversations, setConversations] = useState(() => loadStore('pkm_chat_conversations', initialConversations))
  const [selectedContactId, setSelectedContactId] = useState(initialConversations[0]?.contactId || 'user-nadia')
  const [threads, setThreads] = useState(() => loadStore('pkm_chat_threads', initialChatThreads))
  const [inputText, setInputText] = useState('')
  const [searchContact, setSearchContact] = useState('')

  // State Rekap Feedback
  const [feedbacks, setFeedbacks] = useState(() => loadStore('pkm_proposal_feedback', initialProposalFeedback))
  const [feedbackFilter, setFeedbackFilter] = useState('all') // 'all' | 'revision' | 'approved'
  const [feedbackSearch, setFeedbackSearch] = useState('')

  // Modal Tambah Catatan Revisi
  const [newFeedbackModal, setNewFeedbackModal] = useState({
    isOpen: false,
    proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung',
    feedbackType: 'revision',
    comment: '',
    requiresRevision: true,
  })

  // Modal Mulai Percakapan Baru
  const [newContactModal, setNewContactModal] = useState({
    isOpen: false,
    name: '',
    email: '',
    role: 'Mahasiswa (Ketua Tim)',
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
  useEffect(() => { saveStore('pkm_chat_conversations', conversations) }, [conversations])
  useEffect(() => { saveStore('pkm_chat_threads', threads) }, [threads])
  useEffect(() => { saveStore('pkm_proposal_feedback', feedbacks) }, [feedbacks])

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom()
    }
  }, [selectedContactId, threads, activeTab])

  // Fetch percakapan dari API jika ada koneksi backend
  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    fetch(`${api}/messages/conversations`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(res => { if (res?.data?.length) setConversations(res.data) })
      .catch(() => {})
  }, [token])

  // Kirim Pesan Chat
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: 'user-me',
      receiverId: selectedContactId,
      message: inputText.trim(),
      createdAt: new Date().toISOString(),
    }

    if (token) {
      try {
        await fetch(`${api}/messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            receiverId: selectedContactId,
            message: inputText.trim(),
          }),
        })
      } catch (err) {
        console.warn('Backend offline, menyimpan secara lokal.', err)
      }
    }

    // Perbarui state thread lokal
    setThreads(prev => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMsg],
    }))

    // Perbarui preview percakapan terakhir
    setConversations(prev =>
      prev.map(c =>
        c.contactId === selectedContactId
          ? { ...c, lastMessage: inputText.trim(), lastSentAt: new Date().toISOString() }
          : c
      )
    )

    const sentText = inputText.trim()
    setInputText('')

    // Balasan otomatis dinamis setelah 1.2 detik
    setTimeout(() => {
      const replyMsg = {
        id: `reply-${Date.now()}`,
        senderId: selectedContactId,
        receiverId: 'user-me',
        message: `Terima kasih atas arahannya. Terkait "${sentText.slice(0, 32)}...", segera kami koordinasikan dengan tim dan perbaiki di sistem.`,
        createdAt: new Date().toISOString(),
      }
      setThreads(prev => ({
        ...prev,
        [selectedContactId]: [...(prev[selectedContactId] || []), replyMsg],
      }))
    }, 1200)
  }

  // Tambah Kontak Percakapan Baru
  const handleCreateContact = (e) => {
    e.preventDefault()
    if (!newContactModal.name.trim()) return

    const newCId = `user-${Date.now()}`
    const newContact = {
      contactId: newCId,
      contactName: newContactModal.name.trim(),
      contactEmail: newContactModal.email.trim() || `${newContactModal.name.toLowerCase().replace(/\s+/g, '')}@pkm.unila.ac.id`,
      contactRole: newContactModal.role,
      lastMessage: newContactModal.initialMessage.trim() || 'Percakapan baru dimulai.',
      lastSentAt: new Date().toISOString(),
      unreadCount: 0,
    }

    setConversations(prev => [newContact, ...prev])
    if (newContactModal.initialMessage.trim()) {
      setThreads(prev => ({
        ...prev,
        [newCId]: [
          {
            id: `m-${Date.now()}`,
            senderId: 'user-me',
            receiverId: newCId,
            message: newContactModal.initialMessage.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    }
    setSelectedContactId(newCId)
    setNewContactModal({ isOpen: false, name: '', email: '', role: 'Mahasiswa (Ketua Tim)', initialMessage: '' })
  }

  // Tambah Feedback / Catatan Revisi Baru
  const handleCreateFeedback = (e) => {
    e.preventDefault()
    if (!newFeedbackModal.comment.trim()) return

    const authorLabel = user?.name
      ? `${user.name} (${user.role === 'dosen' ? 'Pembimbing' : user.role === 'reviewer' ? 'Reviewer' : 'Pengelola'})`
      : 'Dr. Budi Dosen (Pembimbing)'

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
      proposalTitle: 'Smart Agriculture IoT untuk Monitoring & Otomasi Lahan Lada Lampung',
      feedbackType: 'revision',
      comment: '',
      requiresRevision: true,
    })
    alert('Catatan revisi berhasil diterbitkan ke proposal.')
  }

  const selectedContact = conversations.find(c => c.contactId === selectedContactId) || conversations[0]
  const currentMessages = threads[selectedContactId] || []

  const filteredConversations = useMemo(() => {
    return conversations.filter(c =>
      c.contactName.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.contactRole.toLowerCase().includes(searchContact.toLowerCase())
    )
  }, [conversations, searchContact])

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

  return (
    <div className="module-container">
      {/* Header Modul Pesan & Feedback */}
      <section className="module-header">
        <div className="module-header-top">
          <div>
            <div className="module-badge">MODUL PESAN & FEEDBACK - PKM CENTER UNILA</div>
            <h1 className="module-title">Pesan Langsung & Rekap Catatan Revisi</h1>
            <p className="module-subtitle">
              Sistem komunikasi interaktif antara Dosen Pembimbing, Reviewer, dan Tim Mahasiswa. Pantau seluruh alur diskusi substansi dan kronologi revisi proposal.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Pengguna Aktif:</span>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
              {user?.name || 'Dr. Budi Dosen'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
              Peran: {user?.role ? user.role.toUpperCase() : 'DOSEN / REVIEWER'}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Tabs */}
      <nav className="modern-tabs" aria-label="Navigasi Pesan dan Feedback">
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>Sistem Direct Message (Chat)</span>
          <span className="tab-badge">{conversations.length} Kontak</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <span>Rekap Catatan Revisi & Feedback</span>
          <span className="tab-badge">{feedbacks.length} Catatan</span>
        </button>
      </nav>

      {/* TAB 1: SISTEM DIRECT MESSAGE (CHAT) */}
      {activeTab === 'chat' && (
        <section className="chat-wrapper">
          {/* Kolom Kiri: Daftar Kontak Percakapan */}
          <aside className="chat-contacts-sidebar">
            <div className="chat-sidebar-search" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari kontak mahasiswa atau dosen..."
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
            <div className="chat-contacts-list">
              {filteredConversations.map(c => {
                const isSelected = c.contactId === selectedContactId
                const initials = c.contactName
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                return (
                  <div
                    key={c.contactId}
                    className={`chat-contact-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedContactId(c.contactId)}
                  >
                    <div className="contact-avatar">
                      {initials}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">{c.contactName}</div>
                      <div className="contact-role-sub">{c.contactRole}</div>
                      <div className="contact-last-msg">{c.lastMessage}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Kolom Kanan: Jendela Percakapan */}
          <main className="chat-main-area">
            {/* Header Chat */}
            <div className="chat-header">
              <div className="chat-header-user">
                <div className="contact-avatar">
                  {selectedContact?.contactName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {selectedContact?.contactName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Aktif - {selectedContact?.contactRole}</span>
                  </div>
                </div>
              </div>
              <button
                className="btn-action secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setContactInfoModal({ isOpen: true, contact: selectedContact })}
              >
                Info Kontak
              </button>
            </div>

            {/* Riwayat Balon Pesan */}
            <div className="chat-messages-scroll">
              <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem 0' }}>
                <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '0.2rem 0.75rem', borderRadius: '9999px' }}>
                  Percakapan Terenkripsi Sistem PKM Center
                </span>
              </div>

              {currentMessages.map(msg => {
                const isMine = msg.senderId === 'user-me'
                return (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
                  >
                    <div>{msg.message}</div>
                    <div className="chat-bubble-time">
                      {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {isMine && ' - Terkirim'}
                    </div>
                  </div>
                )
              })}
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
              <button type="submit" className="btn-action primary" style={{ borderRadius: '9999px', padding: '0.65rem 1.25rem' }}>
                Kirim
              </button>
            </form>
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

      {/* MODAL MULAI PERCAKAPAN BARU */}
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
                    Nama Kontak / Tim:
                  </label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}
                    placeholder="Contoh: Tim Smart Sensor / Dr. Rizmi"
                    value={newContactModal.name}
                    onChange={e => setNewContactModal(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Peran / Status:
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
                    Pesan Awal:
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: '80px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                    placeholder="Ketik salam dan pesan pembuka..."
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
                  {contactInfoModal.contact?.contactName?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.05rem' }}>
                    {contactInfoModal.contact?.contactName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                    Aktif di Sistem PKM Center
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
