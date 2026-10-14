import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Bot, User, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react'

const SUGGESTIONS = [
  'Uji kebaruan ide pemantauan kualitas tanah dengan Edge AI',
  'Rekomendasi skema PKM untuk inovasi pengolahan limbah kopi',
  'Bagaimana menentukan mitra UMKM yang valid untuk PKM-PI?',
  'Tips menyusun luaran wajib agar lolos seleksi Belmawa'
]

export function IdeaLab() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Halo! Saya asisten AI Idea Lab PKM Center Unila. Saya siap membantumu menguji kebaruan ide, kesesuaian skema PKM 8 Bidang / AI / GFK, hingga analisis potensi dampak usulan proposalmu. Apa gagasan atau topik yang ingin kamu eksplorasi hari ini?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendIdea = (text) => {
    const q = (text || input).trim()
    if (!q || loading) return

    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      let aiReply = ''
      const lower = q.toLowerCase()
      if (lower.includes('tanah') || lower.includes('iot') || lower.includes('ai')) {
        aiReply = `Analisis Idea Lab untuk: "${q}"\n\n1. Skema Rekomendasi: **PKM-KC (Karsa Cipta)** atau **PKM-PI (Penerapan Iptek)** jika sudah ada mitra kebun terdefinisi.\n2. Tingkat Kebaruan (Novelty): **Tinggi (8.5/10)** jika memanfaatkan sensor edge hemat energi berbiaya rendah dan telemetri LoRa.\n3. Saran Penguatan: Sertakan rencana integrasi multidisiplin (Teknik Elektro/Informatika + Fakultas Pertanian) untuk memastikan validasi agronomis di lapangan.`
      } else if (lower.includes('kopi') || lower.includes('limbah') || lower.includes('briket')) {
        aiReply = `Analisis Idea Lab untuk: "${q}"\n\n1. Skema Rekomendasi: **PKM-RE (Riset Eksakta)** untuk uji laboratorium atau **PKM-K (Kewirausahaan)** jika fokus pada nilai komersial.\n2. Tingkat Kebaruan (Novelty): **Baik (8.0/10)** — fokuskan pada rasio densitas energi dan pereduksian kadar abu dibanding produk komersial.\n3. Rekomendasi Tim: Mahasiswa FMIPA (Kimia) dikombinasikan dengan FEB (Manajemen Pemasaran).`
      } else {
        aiReply = `Analisis Idea Lab untuk: "${q}"\n\n1. Relevansi: Ide memiliki potensi berdampak nyata.\n2. Langkah Selanjutnya: Susun tinjauan pustaka jurnal 3 tahun terakhir untuk memastikan belum ada hak paten/publikasi identik.\n3. Cek direktori: Kamu bisa mencari dosen pembimbing dengan kepakaran terkait di menu "Cari Tim & Dosen".`
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiReply }])
      setLoading(false)
    }, 900)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendIdea()
  }

  return (
    <div className="module-container">
      {/* ========================================================
          PAGE HEADER
          ======================================================== */}
      <section className="module-header" style={{ marginBottom: '1.75rem' }}>
        <div className="module-header-top">
          <div>
            <div className="module-badge">DIDUKUNG AI</div>
            <h1 className="module-title">Idea Lab (Validasi & Brainstorming)</h1>
            <p className="module-subtitle">
              Uji kekuatan idemu, dapatkan analisis kebaruan, rekomendasi skema PKM, dan saran kolaborasi multidisiplin.
            </p>
          </div>
          <div className="student-header-meta">
            <span className="student-eyebrow">Status Mesin AI</span>
            <span className="student-name" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={14} /> Model Aktif
            </span>
            <span className="student-sub">Statuta PKM Belmawa 2025/2026</span>
          </div>
        </div>
      </section>

      {/* Suggested Prompt Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => sendIdea(s)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Lightbulb size={13} color="#f59e0b" />
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Glassmorphic Chat Container */}
      <div className="student-panel" style={{ minHeight: '62vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                maxWidth: msg.role === 'ai' ? '82%' : '75%',
                flexDirection: msg.role === 'ai' ? 'row' : 'row-reverse'
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: msg.role === 'ai' ? 'linear-gradient(135deg, #071938, #0f2e5c)' : '#0071e3',
                  color: '#ffffff',
                  boxShadow: msg.role === 'ai' ? '0 4px 12px rgba(7, 25, 56, 0.3)' : '0 4px 12px rgba(0, 113, 227, 0.3)'
                }}
              >
                {msg.role === 'ai' ? <Sparkles size={16} color="#fbbf24" /> : <User size={16} />}
              </div>

              <div
                style={{
                  padding: '0.95rem 1.15rem',
                  borderRadius: '18px',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  background: msg.role === 'ai' ? 'rgba(248, 250, 252, 0.9)' : '#0071e3',
                  color: msg.role === 'ai' ? '#0f172a' : '#ffffff',
                  border: msg.role === 'ai' ? '1px solid rgba(226, 232, 240, 0.85)' : 'none',
                  boxShadow: msg.role === 'ai' ? '0 4px 16px rgba(15, 23, 42, 0.03)' : '0 4px 16px rgba(0, 113, 227, 0.25)'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b2149', color: '#fff' }}>
                <Sparkles size={16} color="#fbbf24" />
              </div>
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '16px', fontSize: '0.82rem', color: '#64748b' }}>
                Menganalisis ide dan skema PKM...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ketik ide, masalah di masyarakat, atau rancangan alat PKM-mu..."
            style={{
              flex: 1,
              padding: '0.8rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(203, 213, 225, 0.9)',
              background: '#ffffff',
              fontSize: '0.88rem',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-action primary"
            style={{ padding: '0.8rem 1.4rem', borderRadius: '14px', gap: '0.4rem' }}
          >
            <span>Kirim</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}
