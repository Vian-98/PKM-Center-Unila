import { useEffect, useRef, useState } from 'react'

export function GlassNavbar({ active, onThemeToggle, theme }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  const items = [
    ['beranda', '⌂', 'Beranda'],
    ['berita', '▤', 'Berita'],
    ['galeri', '▦', 'Galeri'],
    ['tentang', 'ⓘ', 'Tentang'],
  ]
  const moreItems = [
    ['pedoman', '▤', 'Pedoman'],
    ['portofolio', '▦', 'Portofolio'],
    ['kontak', '✉', 'Kontak'],
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
          <span className="glass-navbar-icon" aria-hidden="true">⋯</span><span className="glass-navbar-label">{moreActive ? 'Lainnya' : 'Lainnya'}</span>
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
      <button type="button" onClick={onThemeToggle} className="glass-navbar-toggle" aria-label="Ganti tema warna">{theme === 'light' ? '☾' : '☀'}</button>
    </nav>
  )
}