import { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { Breadcrumb } from '../components/Breadcrumb'
import { useContact, submitFeedback } from '../lib/content'

export function KontakPage() {
  const contact = useContact()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState({ sending: false, done: false, error: '' })

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  const submit = async (event) => {
    event.preventDefault()
    setState({ sending: true, done: false, error: '' })
    try {
      await submitFeedback({ kind: 'kontak', name: form.name, email: form.email, message: form.message })
      setForm({ name: '', email: '', message: '' })
      setState({ sending: false, done: true, error: '' })
    } catch (error) {
      setState({ sending: false, done: false, error: error.message })
    }
  }

  const info = [
    { icon: '⌖', label: 'Alamat', value: contact.address, href: null },
    { icon: '✉', label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    { icon: '☎', label: 'Telepon', value: contact.phone, href: contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, '')}` : null },
    { icon: '✆', label: 'WhatsApp', value: contact.whatsApp, href: contact.whatsApp ? `https://wa.me/${contact.whatsApp.replace(/\D/g, '')}` : null },
    { icon: '◎', label: 'Instagram', value: contact.instagram, href: contact.instagram ? `https://instagram.com/${contact.instagram.replace('@', '')}` : null },
    { icon: '◈', label: 'Facebook', value: contact.facebook, href: null },
  ]

  return (
    <main>
      <Breadcrumb trail={[['Beranda', '#beranda'], ['Kontak']]} />
      <PageIntro
        eyebrow="HUBUNGI KAMI"
        title={<>Mari bertanya,<br /><em>atau berbagi ide.</em></>}
        copy="Temui kami di kampus, kirim pesan lewat kanal resmi, atau sampaikan langsung melalui formulir di bawah."
      />
      <section className="contact-grid">
        <div className="contact-info">
          {info.map((entry) => (
            <article className="contact-card" key={entry.label}>
              <span className="contact-icon" aria-hidden="true">{entry.icon}</span>
              <div>
                <p className="card-meta">{entry.label}</p>
                {entry.href ? <a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.value} <b>↗</b></a> : <p className="contact-value">{entry.value}</p>}
              </div>
            </article>
          ))}
        </div>
        <div className="contact-map">
          {contact.mapEmbed
            ? <iframe src={contact.mapEmbed} title="Lokasi PKM Center Universitas Lampung" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            : <div className="map-empty">PETA<br />BELUM DITAUTKAN</div>}
        </div>
        <form className="content-form contact-form" onSubmit={submit}>
          <div className="form-heading"><h2>Kirim pesan</h2></div>
          {state.done && <p className="feedback-success">✓ Pesan terkirim. Tim kami akan segera membalas.</p>}
          {state.error && <p className="error">{state.error}</p>}
          <label>Nama (opsional)<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Namamu" /></label>
          <label>Email (opsional)<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label>
          <label>Pesan<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={3} placeholder="Tulis pertanyaan atau pesanmu…" /></label>
          <button className="button dark" type="submit" disabled={state.sending}>{state.sending ? 'Mengirim…' : 'Kirim pesan'} <b>→</b></button>
        </form>
      </section>
    </main>
  )
}