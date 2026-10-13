import { useEffect, useRef, useState } from 'react'

const icons = {
  beranda: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  berita: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
  galeri: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  tentang: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  pedoman: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  portofolio: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  kontak: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  more: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  sun: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
}

export function GlassNavbar({ active, onThemeToggle, theme }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  const items = [
    ['beranda', icons.beranda, 'Beranda'],
    ['berita', icons.berita, 'Berita'],
    ['galeri', icons.galeri, 'Galeri'],
    ['tentang', icons.tentang, 'Tentang'],
  ]
  const moreItems = [
    ['pedoman', icons.pedoman, 'Pedoman'],
    ['portofolio', icons.portofolio, 'Portofolio'],
    ['kontak', icons.kontak, 'Kontak'],
  ]
  const moreActive = moreItems.some(([route]) => active === route)

  useEffect(() => {
    const close = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) setMoreOpen(false)
    }
    const closeOnRoute = () => setMoreOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('hashchange', closeOnRoute)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('hashchange', closeOnRoute)
    }
  }, [])

  return (
    <nav className={`glass-navbar ${theme}`} aria-label="Navigasi utama">
      {items.map(([route, icon, label]) => (
        <a key={route} href={`#${route}`} className={`glass-navbar-tab ${active === route ? 'active' : ''}`} aria-current={active === route ? 'page' : undefined}>
          <span className="glass-navbar-icon" aria-hidden="true">{icon}</span><span className="glass-navbar-label">{label}</span>
        </a>
      ))}
      <span className="glass-navbar-divider" aria-hidden="true" />
      <div className="glass-navbar-more" ref={moreRef}>
        <button
          type="button"
          className={`glass-navbar-tab glass-navbar-more-toggle ${moreActive || moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
        >
          <span className="glass-navbar-icon" aria-hidden="true">{icons.more}</span><span className="glass-navbar-label">Lainnya</span>
        </button>
        {moreOpen && (
          <div className="glass-navbar-dropdown" role="menu">
            {moreItems.map(([route, icon, label]) => (
              <a key={route} href={`#${route}`} role="menuitem" className={`glass-navbar-dropdown-item ${active === route ? 'active' : ''}`} onClick={() => setMoreOpen(false)}>
                <span aria-hidden="true">{icon}</span>{label}
              </a>
            ))}
          </div>
        )}
      </div>
      <span className="glass-navbar-divider" aria-hidden="true" />
      <button type="button" onClick={onThemeToggle} className="glass-navbar-toggle" aria-label="Ganti tema warna">
        {theme === 'light' ? icons.moon : icons.sun}
      </button>
    </nav>
  )
}