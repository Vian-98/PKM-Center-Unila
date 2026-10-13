import { useState } from 'react'

export function IdeaLab() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Halo! Saya AI Idea Lab siap membantu kamu brainstorm ide PKM. Ceritakan masalah atau ide awal kamu!' }
  ])
  const [input, setInput] = useState('')

  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', content: 'Terima kasih! Ide kamu menarik. Berdasarkan analisis awal, saya rekomendasikan untuk memperjelas target luaran dan mitra yang relevan untuk skema PKM yang sesuai.' }])
    }, 800)
    setInput('')
  }

  return (
    <main className="page-dosen">
      <div className="dosen-hero">
        <div className="dosen-hero-content">
          <h1>Idea Lab (AI Brainstorming)</h1>
          <p>Konsultasi AI untuk mengembangkan ide PKM yang berdampak</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem 2rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', padding: '0.5rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '70%', background: msg.role === 'ai' ? '#f1f5f9' : '#0b2149', color: msg.role === 'ai' ? '#1e293b' : '#fff', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
                {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ceritakan ide PKM kamu..." style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }} />
            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#0b2149', color: '#fff', borderRadius: '0.5rem', fontWeight: 700 }}>Kirim</button>
          </form>
        </div>
      </div>
    </main>
  )
}
