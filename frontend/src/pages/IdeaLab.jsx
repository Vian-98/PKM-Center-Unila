import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Zap,
  Info,
  Lock,
  ShieldCheck
} from 'lucide-react'
import { api } from '../lib/content'

import { getToken } from '../lib/studentApi'

const SUGGESTIONS = [
  'Uji kebaruan ide pemantauan kualitas tanah dengan Edge AI dan LoRa',
  'Rekomendasi skema PKM untuk inovasi pengolahan limbah kulit kopi jadi briket',
  'Bagaimana menentukan mitra UMKM yang valid untuk proposal PKM-PI?',
  'Rancang ide PKM-VGK untuk isu ketahanan pangan dan SDGs 2030 di Lampung',
  'Tips menyusun luaran wajib dan metode penelitian agar lolos Belmawa'
]

// Simple helper to format basic markdown elements nicely
function renderFormattedContent(text) {
  if (!text) return null

  // Split into lines
  const lines = text.split('\n')
  return (
    <div className="idealab-rendered-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} style={{ height: '0.35rem' }} />
        }

        // Heading 3 or 2
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#+\s*/, '')
          return (
            <h4
              key={idx}
              style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0.4rem 0 0.2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {headingText}
            </h4>
          )
        }

        // Horizontal line
        if (trimmed === '---' || trimmed === '***') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                margin: '0.4rem 0'
              }}
            />
          )
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', paddingLeft: '0.2rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(0, 113, 227, 0.1)',
                  color: '#0071e3',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '0.15rem'
                }}
              >
                {numMatch[1]}
              </span>
              <div style={{ flex: 1 }}>{parseInlineMarkup(numMatch[2])}</div>
            </div>
          )
        }

        // Bullet list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', paddingLeft: '0.2rem' }}>
              <span style={{ color: '#0071e3', fontWeight: 800, flexShrink: 0, marginTop: '-0.1rem' }}>•</span>
              <div style={{ flex: 1 }}>{parseInlineMarkup(trimmed.slice(2))}</div>
            </div>
          )
        }

        return <p key={idx} style={{ margin: 0 }}>{parseInlineMarkup(trimmed)}</p>
      })}
    </div>
  )
}

function parseInlineMarkup(text) {
  // Regex to match bold **text** and `code`
  const parts = []
  let remainder = text
  let keyIndex = 0

  while (remainder.length > 0) {
    const boldMatch = remainder.match(/\*\*(.*?)\*\*/)
    const codeMatch = remainder.match(/`(.*?)`/)

    let nextMatch = null
    let type = null

    if (boldMatch && (!codeMatch || boldMatch.index < codeMatch.index)) {
      nextMatch = boldMatch
      type = 'bold'
    } else if (codeMatch) {
      nextMatch = codeMatch
      type = 'code'
    }

    if (!nextMatch) {
      parts.push(remainder)
      break
    }

    const matchIndex = nextMatch.index
    if (matchIndex > 0) {
      parts.push(remainder.slice(0, matchIndex))
    }

    if (type === 'bold') {
      parts.push(
        <strong key={keyIndex++} style={{ fontWeight: 700, color: '#0f2e5c' }}>
          {nextMatch[1]}
        </strong>
      )
    } else if (type === 'code') {
      parts.push(
        <code
          key={keyIndex++}
          style={{
            background: 'rgba(241, 245, 249, 0.9)',
            padding: '0.15rem 0.35rem',
            borderRadius: '4px',
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            color: '#0369a1'
          }}
        >
          {nextMatch[1]}
        </code>
      )
    }

    remainder = remainder.slice(matchIndex + nextMatch[0].length)
  }

  return parts
}

export function IdeaLab({ user }) {
  const initialGreeting = {
    role: 'ai',
    content:
      'Halo! Saya PKMATE, asisten AI resmi PKM Center Universitas Lampung.\n\nSaya siap mendampingimu untuk:\n1. Menguji tingkat kebaruan ide (Novelty Score)\n2. Menemukan skema PKM Belmawa (RE, RSH, K, PM, PI, KC, KI, VGK, GFT, AI) yang paling tepat\n3. Memperkuat metodologi & luaran wajib agar lolos pendanaan Belmawa\n4. Merekomendasikan kolaborasi jurusan/fakultas multidisiplin di Unila\n\nApa gagasan inovatif atau masalah di masyarakat yang ingin kamu diskusikan hari ini?'
  }

  const [messages, setMessages] = useState([initialGreeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // Ambil histori sesi brainstorming sebelumnya jika user login
    const token = getToken()
    if (token && user?.id) {
      fetch(`${api}/ai/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(result => {
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const formatted = result.data.flatMap(item => [
              { role: 'user', content: item.inputText, time: item.createdAt },
              { role: 'ai', content: item.outputText, time: item.createdAt }
            ])
            setMessages([initialGreeting, ...formatted])
          } else {
            setMessages([initialGreeting])
          }
        })
        .catch(err => {
          console.warn('[PKMATE] Gagal memuat riwayat:', err)
          setMessages([initialGreeting])
        })
    } else {
      // Jika mode tamu / logout, reset riwayat pesan
      setMessages([initialGreeting])
    }
  }, [user?.id])



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendIdea = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return

    const userMsg = { role: 'user', content: q, time: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const token = getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      // Ambil 8 percakapan terakhir untuk konteks
      const historyPayload = messages
        .filter(m => m !== initialGreeting)
        .slice(-8)
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        }))

      const response = await fetch(`${api}/ai/brainstorm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: q,
          history: historyPayload
        })
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memproses analisis AI')
      }

      const aiReply = result.data.reply

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: aiReply,
          time: new Date()
        }
      ])
    } catch (err) {
      console.error('[PKMATE] AI Error:', err)
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content:
            '⚠️ Maaf, asisten PKMATE sedang mengalami kendala jaringan. Silakan coba ulangi pertanyaanmu sesaat lagi.',
          isError: true,
          time: new Date()
        }
      ])
    } finally {

      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendIdea()
  }

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleClearChat = async () => {
    if (!window.confirm('Bersihkan percakapan brainstorming ini?')) return

    const token = getToken()
    if (token) {
      try {
        await fetch(`${api}/ai/history`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (e) {
        console.warn('Gagal menghapus riwayat di server', e)
      }
    }
    setMessages([initialGreeting])
  }

  return (
    <div className="module-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <section className="module-header" style={{ marginBottom: '1.5rem' }}>
        <div className="module-header-top">
          <div>
            <div
              className="module-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.12), rgba(30, 64, 175, 0.08))',
                color: '#0071e3',
                border: '1px solid rgba(0, 113, 227, 0.25)'
              }}
            >
              <Sparkles size={12} />
              <span>ASISTEN AI RESMI</span>
            </div>
            <h1 className="module-title">PKMATE (Validasi & Brainstorming)</h1>
            <p className="module-subtitle">
              Uji kebaruan idemu, dapatkan rekomendasi skema PKM Belmawa 2026 yang akurat, evaluasi potensi luaran, dan saran kolaborasi multidisiplin kampus Unila.
            </p>
          </div>
        </div>
      </section>


      {/* Suggested Prompt Chips */}
      <div style={{ marginBottom: '1.1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} color="#f59e0b" />
          <span>Gagasan Cepat untuk Dieksplorasi:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => sendIdea(s)}
              style={{
                padding: '0.42rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.77rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(203, 213, 225, 0.85)',
                color: '#1e293b',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#f0fdf4'
                  e.currentTarget.style.borderColor = '#86efac'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.85)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Lightbulb size={12} color="#f59e0b" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Glassmorphic Chat Container */}
      <div
        className="student-panel"
        style={{
          minHeight: '66vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          borderRadius: '24px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Chat Control Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '0.75rem',
            marginBottom: '0.75rem',
            borderBottom: '1px solid rgba(226, 232, 240, 0.75)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              <Bot size={14} color="#0071e3" />
              Ruang Brainstorming PKMATE
            </span>


            {user?.name ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#047857',
                  background: 'rgba(209, 250, 229, 0.7)',
                  border: '1px solid rgba(167, 243, 208, 0.9)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px'
                }}
                title="Riwayat chat tersimpan secara privat dan hanya dapat diakses oleh akun Anda"
              >
                <Lock size={11} color="#059669" />
                <span>Akun Privat: {user.name}</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px'
                }}
                title="Login untuk menyimpan riwayat sesi Anda secara privat"
              >
                <span>Mode Tamu</span>
              </span>
            )}

            {messages.length > 1 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  background: '#f1f5f9',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px'
                }}
              >
                {messages.length - 1} pertukaran
              </span>
            )}
          </div>


          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#dc2626',
                background: 'rgba(254, 242, 242, 0.8)',
                border: '1px solid rgba(254, 202, 202, 0.7)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={12} />
              <span>Bersihkan Chat</span>
            </button>
          )}
        </div>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '0.5rem 0'
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                maxWidth: msg.role === 'ai' ? '86%' : '78%',
                flexDirection: msg.role === 'ai' ? 'row' : 'row-reverse'
              }}
            >
              {/* Avatar Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background:
                    msg.role === 'ai'
                      ? 'linear-gradient(135deg, #071938, #0f2e5c)'
                      : 'linear-gradient(135deg, #0071e3, #0284c7)',
                  color: '#ffffff',
                  boxShadow:
                    msg.role === 'ai'
                      ? '0 4px 12px rgba(7, 25, 56, 0.25)'
                      : '0 4px 12px rgba(0, 113, 227, 0.25)'
                }}
              >
                {msg.role === 'ai' ? <Sparkles size={17} color="#fbbf24" /> : <User size={17} />}
              </div>

              {/* Message Bubble Card */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  alignItems: msg.role === 'ai' ? 'flex-start' : 'flex-end'
                }}
              >
                {/* Header label for AI */}
                {msg.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 700, color: '#0071e3', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={12} color="#0071e3" /> PKMATE
                    </span>
                  </div>
                )}


                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: msg.role === 'ai' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    background:
                      msg.role === 'ai'
                        ? msg.isError
                          ? 'rgba(254, 242, 242, 0.95)'
                          : '#ffffff'
                        : '#0071e3',
                    color: msg.role === 'ai' ? (msg.isError ? '#b91c1c' : '#0f172a') : '#ffffff',
                    border:
                      msg.role === 'ai'
                        ? msg.isError
                          ? '1px solid rgba(254, 202, 202, 0.9)'
                          : '1px solid rgba(226, 232, 240, 0.95)'
                        : 'none',
                    boxShadow:
                      msg.role === 'ai'
                        ? '0 4px 20px rgba(15, 23, 42, 0.04)'
                        : '0 4px 16px rgba(0, 113, 227, 0.22)'
                  }}
                >
                  {msg.role === 'ai' ? (
                    renderFormattedContent(msg.content)
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  )}
                </div>

                {/* Footer Toolbar for AI message: Copy button */}
                {msg.role === 'ai' && !msg.isError && i > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, i)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedIndex === i ? '#16a34a' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease'
                      }}
                      title="Salin analisis ini"
                    >
                      {copiedIndex === i ? (
                        <>
                          <Check size={12} />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Animation Bubble */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0b2149',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(11, 33, 73, 0.3)'
                }}
              >
                <Sparkles size={17} color="#fbbf24" />
              </div>
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '0.84rem',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
                }}
              >
                <RefreshCw size={14} className="animate-spin" color="#0071e3" />
                <span>PKMATE sedang menganalisis ide & memvalidasi skema Belmawa...</span>
              </div>

            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            borderTop: '1px solid rgba(226, 232, 240, 0.85)',
            paddingTop: '1rem'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tuliskan gagasan, masalah lapangan, atau rancangan teknologi PKM-mu..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(203, 213, 225, 0.95)',
              background: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#0071e3'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.95)'
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.03)'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-action primary"
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '16px',
              gap: '0.45rem',
              background: !input.trim() || loading ? '#94a3b8' : 'linear-gradient(135deg, #0071e3, #0284c7)',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: !input.trim() || loading ? 'none' : '0 4px 14px rgba(0, 113, 227, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Kirim Ide</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
