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
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
      label: 'Alamat',
      value: contact.address,
      href: null,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
      label: 'Telepon',
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, '')}` : null,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
      label: 'WhatsApp',
      value: contact.whatsApp,
      href: contact.whatsApp ? `https://wa.me/${contact.whatsApp.replace(/\D/g, '')}` : null,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
      label: 'Instagram',
      value: contact.instagram,
      href: contact.instagram ? `https://instagram.com/${contact.instagram.replace('@', '')}` : null,
    },
    {
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
      label: 'Facebook',
      value: contact.facebook,
      href: null,
    },
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
                {entry.href ? <a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.value} <b>&rarr;</b></a> : <p className="contact-value">{entry.value}</p>}
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
          {state.done && <p className="feedback-success">Pesan terkirim. Tim kami akan segera membalas.</p>}
          {state.error && <p className="error">{state.error}</p>}
          <label>Nama (opsional)<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Namamu" /></label>
          <label>Email (opsional)<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label>
          <label>Pesan<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={3} placeholder="Tulis pertanyaan atau pesanmu…" /></label>
          <button className="button dark" type="submit" disabled={state.sending}>{state.sending ? 'Mengirim…' : 'Kirim pesan'} <b>&rarr;</b></button>
        </form>
      </section>
    </main>
  )
}