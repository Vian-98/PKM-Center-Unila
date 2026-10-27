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
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  Sliders
} from 'lucide-react'
import { api } from '../lib/content'
import { getToken } from '../lib/studentApi'
import { PKMStrategyCanvasModal, printCanvasToPdf } from '../components/PKMStrategyCanvasModal'

// Data draf awal PKM Strategy Canvas (PSC)
const initialCanvasData = {
  title: 'Inovasi Strategis PKM Belmawa Berkelanjutan',
  scheme: 'PKM-KC',
  university: 'Universitas Lampung',
  leader: 'Nama Ketua Tim',
  members: [
    'Nama Anggota 1',
    'Nama Anggota 2',
    'Nama Anggota 3'
  ],
  problem: [
    'Urgensi latar belakang masalah riil di masyarakat atau industri yang perlu diselesaikan.',
    'Keterbatasan solusi atau metode konvensional yang ada saat ini.'
  ],
  purpose: [
    'Tujuan spesifik pengembangan inovasi sebagai pemecahan masalah yang terukur.',
    'Manfaat aplikatif bagi pemangku kepentingan, mitra, atau kemajuan iptek.'
  ],
  idea: [
    'Konsep gagasan atau pendekatan kreatif yang ditawarkan tim.',
    'Rancangan inovasi terpadu yang adaptif terhadap kondisi lapangan.'
  ],
  method: [
    'Tahap 1: Studi literatur dan analisis kebutuhan spesifikasi teknis.',
    'Tahap 2: Eksekusi teknis / fabrikasi / formulasi purwarupa.',
    'Tahap 3: Pengujian performa, validasi efektivitas, dan evaluasi.'
  ],
  uniqueValue: [
    'Keunggulan komparatif dibanding produk atau metode sejenis yang telah ada.',
    'Nilai kemanfaatan yang berdaya saing, efisien, dan aplikatif.'
  ],
  keyActivities: [
    'Riset pendahuluan dan pengadaan komponen/bahan baku.',
    'Pembuatan dan pengujian bertahap.',
    'Penyusunan naskah luaran wajib dan pendaftaran Hak Cipta (HaKI).'
  ],
  novelty: [
    'Unsur kebaruan dan orisinalitas konsep yang membedakan dengan riset terdahulu.',
    'Peningkatan efisiensi atau performa yang dihasilkan secara nyata.'
  ],
  output: [
    'Laporan Kemajuan dan Laporan Akhir PKM Belmawa',
    'Luaran Wajib Sesuai Skema',
    'Hak Cipta (HaKI) / Paten Sederhana',
    'Artikel Ilmiah Terpublikasi'
  ]
}

function extractPscData(content) {
  if (!content) return { cleanText: content, pscData: null }
  const match = content.match(/\[PSC_DATA\]([\s\S]*?)\[\/PSC_DATA\]/)
  if (!match) return { cleanText: content, pscData: null }
  try {
    const pscData = JSON.parse(match[1])
    const cleanText = content.replace(/\[PSC_DATA\][\s\S]*?\[\/PSC_DATA\]/, '').trim()
    return { cleanText, pscData }
  } catch (err) {
    return { cleanText: content, pscData: null }
  }
}

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

export function IdeaLab({ user, onLogin }) {
  const isMahasiswa = Boolean(user && user.role === 'mahasiswa')
  const userKey = user?.id || (user?.email ? user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest')
  const chatStorageKey = isMahasiswa ? `pkmate_chat_history_${userKey}` : null
  const getTodayDateStr = () => new Date().toISOString().slice(0, 10)

  // Batas kuota chat
  const GUEST_SESSION_MAX = 10
  const MHS_DAILY_MAX = 50

  const initialGreeting = {
    role: 'ai',
    content:
      'Halo! Saya PKMATE, asisten AI resmi PKM Center Universitas Lampung.\n\nSaya siap mendampingimu untuk:\n1. Menguji tingkat kebaruan ide (Novelty Score)\n2. Menemukan skema PKM Belmawa (RE, RSH, K, PM, PI, KC, KI, VGK, GFT, AI) yang paling tepat\n3. Memperkuat metodologi & luaran wajib agar lolos pendanaan Belmawa\n4. Merekomendasikan kolaborasi jurusan/fakultas multidisiplin di Unila\n\nApa gagasan inovatif atau masalah di masyarakat yang ingin kamu diskusikan hari ini?'
  }

  // Riwayat percakapan:
  // - Mahasiswa: diambil dari localStorage per akun mahasiswa
  // - Guest: TIDAK disimpan di localStorage (hanya in-memory state; hilang jika di-refresh)
  const [messages, setMessages] = useState(() => {
    try {
      if (localStorage.getItem('pkmate_storage_version') !== '2026_cleared_all') {
        localStorage.setItem('pkmate_storage_version', '2026_cleared_all')
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('pkmate_chat_history_')) {
            localStorage.removeItem(k)
          }
        })
      }
    } catch (e) {
      // ignore
    }

    if (isMahasiswa && chatStorageKey) {
      try {
        const saved = localStorage.getItem(chatStorageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch (e) {
        console.warn('[PKMATE] Gagal membaca riwayat chat lokal:', e)
      }
    }
    return [initialGreeting]
  })

  // Kuota penggunaan:
  // - Guest: maksimal 10 chat per sesi (disimpan di sessionStorage)
  // - Mahasiswa: maksimal 50 chat per hari (disimpan di localStorage per tanggal)
  const [guestSessionCount, setGuestSessionCount] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem('pkmate_guest_session_chat_count') || '0', 10)
    } catch {
      return 0
    }
  })

  const [mhsDailyCount, setMhsDailyCount] = useState(() => {
    if (!isMahasiswa) return 0
    try {
      const key = `pkmate_daily_quota_${userKey}_${getTodayDateStr()}`
      return parseInt(localStorage.getItem(key) || '0', 10)
    } catch {
      return 0
    }
  })

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)

  // State Mode Interaksi: 'tanya' (Konsultasi Bebas) | 'canvas' (PKM Strategy Canvas)
  const [activeMode, setActiveMode] = useState('tanya')
  const [canvasModalOpen, setCanvasModalOpen] = useState(false)

  // State Data PKM Strategy Canvas (PSC)
  const [canvasData, setCanvasData] = useState(() => {
    try {
      const saved = localStorage.getItem(`pkm_strategy_canvas_data_${userKey}`)
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      ...initialCanvasData,
      leader: user?.name || initialCanvasData.leader,
      university: 'Universitas Lampung'
    }
  })

  // Sinkronisasi data canvas ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`pkm_strategy_canvas_data_${userKey}`, JSON.stringify(canvasData))
    } catch {}
  }, [canvasData, userKey])

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Status apakah kuota telah terlampaui
  const isQuotaExceeded = isMahasiswa
    ? mhsDailyCount >= MHS_DAILY_MAX
    : guestSessionCount >= GUEST_SESSION_MAX

  // Sinkronisasi kuota saat user atau tanggal berubah
  useEffect(() => {
    if (isMahasiswa) {
      try {
        const key = `pkmate_daily_quota_${userKey}_${getTodayDateStr()}`
        setMhsDailyCount(parseInt(localStorage.getItem(key) || '0', 10))
      } catch {}
    } else {
      try {
        setGuestSessionCount(parseInt(sessionStorage.getItem('pkmate_guest_session_chat_count') || '0', 10))
      } catch {}
    }
  }, [userKey, isMahasiswa])

  // Sinkronisasi riwayat pesan ke localStorage untuk Mahasiswa (Tamu tidak disimpan)
  useEffect(() => {
    if (isMahasiswa && chatStorageKey && messages.length > 0) {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages))
      } catch (e) {
        console.warn('[PKMATE] Gagal menyimpan chat ke localStorage:', e)
      }
    }
  }, [messages, isMahasiswa, chatStorageKey])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    if (isMahasiswa) {
      // Ambil histori tersimpan lokal atau dari backend
      let hasLocal = false
      if (chatStorageKey) {
        try {
          const saved = localStorage.getItem(chatStorageKey)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed)
              hasLocal = true
            }
          }
        } catch {}
      }

      const token = getToken()
      if (token && user?.id && !hasLocal) {
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
              const fullHistory = [initialGreeting, ...formatted]
              setMessages(fullHistory)
              if (chatStorageKey) {
                localStorage.setItem(chatStorageKey, JSON.stringify(fullHistory))
              }
            } else {
              setMessages([initialGreeting])
            }
          })
          .catch(err => {
            console.warn('[PKMATE] Gagal memuat riwayat:', err)
            setMessages([initialGreeting])
          })
      }
    } else {
      // Mode tamu (Guest): Chat SELALU mulai bersih dan hilang saat di-refresh
      setMessages([initialGreeting])
    }
  }, [userKey, isMahasiswa])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendIdea = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return

    // Penanganan Command /canvas dan /tanya secara instan
    const lowerQ = q.toLowerCase()
    if (lowerQ === '/canvas') {
      setActiveMode('canvas')
      const userMsg = { role: 'user', content: '/canvas', time: new Date() }
      const aiMsg = {
        role: 'ai',
        content: `Selamat datang di penyusunan **PKM Strategy Canvas (PSC)**! 🎯\n\nFramework ini dirancang untuk memetakan ide PKM Anda ke dalam 8 pilar strategis hingga siap lolos PIMNAS:\n1. **Masalah (Problem)**: Urgensi latar belakang dan fakta lapangan\n2. **Tujuan (Purpose)**: Target spesifik penyelesaian masalah\n3. **Gagasan (Idea)**: Inovasi & pendekatan solusi kreatif\n4. **Metode (Method)**: Tahapan dan alur eksekusi ilmiah\n5. **Keunikan (Unique Value)**: Nilai lebih dibanding alternatif lain\n6. **Kegiatan Utama (Key Activities)**: Agenda kerja kunci selama PKM\n7. **Kebaharuan (Novelty)**: Aspek orisinalitas & kebaruan konsep\n8. **Luaran (Output)**: Target luaran wajib & tambahan berstandar Belmawa\n\n**Silakan ceritakan ide usulan Anda, atau sebutkan judul/skema (misal PKM-VGK, PKM-KC, PKM-RE) beserta masalah yang ingin dipecahkan.** PKMATE akan langsung memandu dan memetakannya ke dalam kanvas resmi!`,
        time: new Date()
      }
      setMessages(prev => [...prev, userMsg, aiMsg])
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      return
    }

    if (lowerQ === '/tanya') {
      setActiveMode('tanya')
      const userMsg = { role: 'user', content: '/tanya', time: new Date() }
      const aiMsg = {
        role: 'ai',
        content: `Mode **Konsultasi Bebas PKMATE** aktif! 💡\n\nSilakan ajukan pertanyaan seputar skema PKM Belmawa, aturan administrasi proposal, pencarian mitra, perhitungan anggaran, hingga strategi lolos PIMNAS.`,
        time: new Date()
      }
      setMessages(prev => [...prev, userMsg, aiMsg])
      setInput('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      return
    }

    if (lowerQ.startsWith('/canvas ')) {
      setActiveMode('canvas')
    } else if (lowerQ.startsWith('/tanya ')) {
      setActiveMode('tanya')
    }

    // Validasi kuota chat sebelum mengirim
    if (isQuotaExceeded) {
      if (!isMahasiswa) {
        alert('Batas kuota sesi tamu telah tercapai (10/10 chat). Silakan masuk dengan akun Mahasiswa Unila untuk melanjutkan.')
      } else {
        alert('Batas kuota harian konsultasi PKMATE telah tercapai (50/50 chat hari ini). Kuota Anda akan diperbarui besok.')
      }
      return
    }

    const userMsg = { role: 'user', content: q, time: new Date() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    // Perbarui kuota chat
    if (isMahasiswa) {
      const nextCount = mhsDailyCount + 1
      setMhsDailyCount(nextCount)
      try {
        const key = `pkmate_daily_quota_${userKey}_${getTodayDateStr()}`
        localStorage.setItem(key, String(nextCount))
      } catch {}
    } else {
      const nextCount = guestSessionCount + 1
      setGuestSessionCount(nextCount)
      try {
        sessionStorage.setItem('pkmate_guest_session_chat_count', String(nextCount))
      } catch {}
    }

    try {
      const token = getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token && isMahasiswa) headers.Authorization = `Bearer ${token}`

      // Ambil 8 percakapan terakhir untuk konteks
      const historyPayload = messages
        .filter(m => m !== initialGreeting)
        .slice(-8)
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content
        }))

      // Sertakan arahan mode canvas jika sedang dalam mode canvas
      const queryPayload = activeMode === 'canvas' && !q.toLowerCase().includes('/canvas')
        ? `/canvas ${q}`
        : q

      const response = await fetch(`${api}/ai/brainstorm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: queryPayload,
          history: historyPayload
        })
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memproses analisis AI')
      }

      const aiReply = result.data.reply

      // Periksa apakah balasan memuat data PSC terstruktur
      const { pscData } = extractPscData(aiReply)
      if (pscData) {
        setCanvasData(prev => ({
          ...prev,
          ...pscData,
          leader: prev.leader || user?.name || 'Devynta Syabrina',
          members: (pscData.members && pscData.members.length) ? pscData.members : prev.members,
          university: pscData.university || prev.university || 'Universitas Lampung'
        }))
        setActiveMode('canvas')
      }

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

    if (chatStorageKey) {
      try {
        localStorage.removeItem(chatStorageKey)
      } catch {}
    }

    const token = getToken()
    if (token && isMahasiswa) {
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
              disabled={loading || isQuotaExceeded}
              onClick={() => sendIdea(s)}
              style={{
                padding: '0.42rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.77rem',
                fontWeight: 600,
                background: isQuotaExceeded ? 'rgba(241, 245, 249, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(203, 213, 225, 0.85)',
                color: isQuotaExceeded ? '#94a3b8' : '#1e293b',
                cursor: loading || isQuotaExceeded ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
              onMouseEnter={e => {
                if (!loading && !isQuotaExceeded) {
                  e.currentTarget.style.background = '#f0fdf4'
                  e.currentTarget.style.borderColor = '#86efac'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isQuotaExceeded ? 'rgba(241, 245, 249, 0.7)' : 'rgba(255, 255, 255, 0.85)'
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.85)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Lightbulb size={12} color={isQuotaExceeded ? '#94a3b8' : '#f59e0b'} />
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

            {/* Badge Mode Aktif */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: activeMode === 'canvas' ? '#0284c7' : '#475569',
                background: activeMode === 'canvas' ? '#e0f2fe' : '#f1f5f9',
                border: `1px solid ${activeMode === 'canvas' ? '#bae6fd' : '#e2e8f0'}`,
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px'
              }}
            >
              {activeMode === 'canvas' ? '📋 Mode: Strategy Canvas' : '💬 Mode: Konsultasi Bebas'}
            </span>

            {activeMode === 'canvas' && (
              <button
                type="button"
                onClick={() => setCanvasModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  padding: '0.18rem 0.65rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                }}
              >
                <FileText size={11} />
                <span>Lihat & Cetak Canvas (PDF)</span>
              </button>
            )}


            {isMahasiswa ? (
              <>
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
                  title="Riwayat chat tersimpan secara privat di akun Anda"
                >
                  <Lock size={11} color="#059669" />
                  <span>Akun: {user.name}</span>
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: mhsDailyCount >= MHS_DAILY_MAX ? '#b45309' : '#0369a1',
                    background: mhsDailyCount >= MHS_DAILY_MAX ? '#fef3c7' : '#e0f2fe',
                    border: `1px solid ${mhsDailyCount >= MHS_DAILY_MAX ? '#fde68a' : '#bae6fd'}`,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px'
                  }}
                  title="Batas kuota mahasiswa adalah 50 chat per hari"
                >
                  <Zap size={11} color={mhsDailyCount >= MHS_DAILY_MAX ? '#d97706' : '#0284c7'} />
                  <span>Kuota Hari Ini: {mhsDailyCount}/50 Chat (Sisa {Math.max(0, MHS_DAILY_MAX - mhsDailyCount)})</span>
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px'
                  }}
                  title="Sesi tamu: Pesan tidak disimpan permanen (akan hilang saat halaman di-refresh)"
                >
                  <User size={11} />
                  <span>Mode Tamu (Tanpa Simpan)</span>
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: guestSessionCount >= GUEST_SESSION_MAX ? '#b45309' : '#475569',
                    background: guestSessionCount >= GUEST_SESSION_MAX ? '#fef3c7' : '#f8fafc',
                    border: `1px solid ${guestSessionCount >= GUEST_SESSION_MAX ? '#fde68a' : '#e2e8f0'}`,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px'
                  }}
                  title="Batas kuota tamu adalah 10 chat per sesi"
                >
                  <Zap size={11} color={guestSessionCount >= GUEST_SESSION_MAX ? '#d97706' : '#64748b'} />
                  <span>Kuota Sesi: {guestSessionCount}/10 Chat (Sisa {Math.max(0, GUEST_SESSION_MAX - guestSessionCount)})</span>
                </span>
              </>
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
                    (() => {
                      const { cleanText, pscData: itemPscData } = extractPscData(msg.content)
                      return (
                        <>
                          {renderFormattedContent(cleanText)}

                          {itemPscData && (
                            <div
                              style={{
                                marginTop: '0.85rem',
                                padding: '0.85rem 1rem',
                                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                                border: '1px solid #bae6fd',
                                borderRadius: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.65rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '8px',
                                      background: '#0284c7',
                                      color: '#ffffff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <FileText size={17} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0369a1' }}>
                                      PKM STRATEGY CANVAS (PSC) SIAP
                                    </div>
                                    <div style={{ fontSize: '0.73rem', color: '#0f172a', fontWeight: 600 }}>
                                      {itemPscData.title || canvasData.title} ({itemPscData.scheme || canvasData.scheme})
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCanvasData(prev => ({ ...prev, ...itemPscData }))
                                      setCanvasModalOpen(true)
                                    }}
                                    style={{
                                      padding: '0.4rem 0.75rem',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      border: '1px solid #0284c7',
                                      background: '#ffffff',
                                      color: '#0284c7',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                  >
                                    <FileText size={13} />
                                    <span>Buka / Edit Canvas</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => printCanvasToPdf({ ...canvasData, ...itemPscData })}
                                    style={{
                                      padding: '0.4rem 0.85rem',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      border: 'none',
                                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                                    }}
                                  >
                                    <Printer size={13} />
                                    <span>Unduh / Cetak PDF</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()
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

        {/* Quota Exceeded Alert Banner */}
        {isQuotaExceeded && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem 1.15rem',
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ background: '#fef3c7', padding: '0.45rem', borderRadius: '10px', color: '#d97706', display: 'flex' }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#92400e' }}>
                  {!isMahasiswa ? 'Batas Kuota Sesi Tamu Tercapai (10/10 Chat)' : 'Batas Kuota Harian Tercapai (50/50 Chat)'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#78350f', marginTop: '0.15rem' }}>
                  {!isMahasiswa
                    ? 'Anda telah menggunakan kuota 10 chat sesi tamu. Masuk dengan akun Mahasiswa Unila untuk kuota 50 chat per hari dan menyimpan riwayat ide Anda.'
                    : 'Anda telah mencapai batas 50 chat konsultasi hari ini. Kuota harian Anda akan otomatis direset besok pukul 00:00 WIB.'}
                </div>
              </div>
            </div>
            {!isMahasiswa && onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="btn-action primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '12px' }}
              >
                Masuk Akun Mahasiswa &rarr;
              </button>
            )}
          </div>
        )}

        {/* Command Chips / Mode Selector Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setActiveMode('tanya')
                sendIdea('/tanya')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: activeMode === 'tanya' ? '#eff6ff' : '#f8fafc',
                border: `1px solid ${activeMode === 'tanya' ? '#3b82f6' : '#cbd5e1'}`,
                color: activeMode === 'tanya' ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>💬 /tanya (Konsultasi Bebas)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('canvas')
                sendIdea('/canvas')
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: activeMode === 'canvas' ? '#e0f2fe' : '#f8fafc',
                border: `1px solid ${activeMode === 'canvas' ? '#0284c7' : '#cbd5e1'}`,
                color: activeMode === 'canvas' ? '#0369a1' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📋 /canvas (PKM Strategy Canvas)</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setCanvasModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 600,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <FileText size={13} color="#0284c7" />
              <span>Pratinjau Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => printCanvasToPdf(canvasData)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            marginTop: '0.65rem',
            borderTop: '1px solid rgba(226, 232, 240, 0.85)',
            paddingTop: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    // Shift + Enter: biarkan default browser (membuat baris baru / enter)
                    return
                  }
                  // Enter biasa: Kirim pesan
                  e.preventDefault()
                  if (input.trim() && !loading && !isQuotaExceeded) {
                    sendIdea()
                  }
                }
              }}
              placeholder={
                isQuotaExceeded
                  ? (!isMahasiswa
                      ? 'Batas kuota 10 chat sesi tamu telah tercapai. Silakan masuk akun mahasiswa...'
                      : 'Batas kuota 50 chat hari ini telah tercapai. Kuota direset besok pukul 00:00 WIB...')
                  : activeMode === 'canvas'
                    ? 'Ketik /canvas atau ceritakan ide usulan Anda (Shift + Enter untuk baris baru)...'
                    : 'Ketik /tanya, /canvas, atau tuliskan pertanyaan / gagasan inovasi (Shift + Enter untuk baris baru)...'
              }
              disabled={loading || isQuotaExceeded}
              style={{
                flex: 1,
                minHeight: '48px',
                maxHeight: '180px',
                padding: '0.8rem 1.15rem',
                borderRadius: '16px',
                border: '1px solid rgba(203, 213, 225, 0.95)',
                background: isQuotaExceeded ? '#f8fafc' : '#ffffff',
                fontSize: '0.9rem',
                lineHeight: '1.45',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
              onFocus={e => {
                if (!isQuotaExceeded) {
                  e.currentTarget.style.borderColor = '#0071e3'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.12)'
                }
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.95)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.03)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || isQuotaExceeded}
              className="btn-action primary"
              style={{
                height: '48px',
                padding: '0 1.4rem',
                borderRadius: '16px',
                gap: '0.45rem',
                background: !input.trim() || loading || isQuotaExceeded ? '#94a3b8' : 'linear-gradient(135deg, #0071e3, #0284c7)',
                cursor: !input.trim() || loading || isQuotaExceeded ? 'not-allowed' : 'pointer',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: !input.trim() || loading || isQuotaExceeded ? 'none' : '0 4px 14px rgba(0, 113, 227, 0.35)',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <span>Kirim Ide</span>
              <Send size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.4rem' }}>
            <span style={{ fontSize: '0.71rem', color: '#94a3b8' }}>
              Tekan <b>Enter</b> untuk kirim • <b>Shift + Enter</b> untuk baris baru
            </span>
            {input.trim() && (
              <span style={{ fontSize: '0.71rem', color: '#94a3b8' }}>
                {input.length} karakter
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Modal Pratinjau & Edit PKM Strategy Canvas (PSC) */}
      <PKMStrategyCanvasModal
        isOpen={canvasModalOpen}
        onClose={() => setCanvasModalOpen(false)}
        canvasData={canvasData}
        onUpdateCanvas={(updated) => setCanvasData(updated)}
      />
    </div>
  )
}
