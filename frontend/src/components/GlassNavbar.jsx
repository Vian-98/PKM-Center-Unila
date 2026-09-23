export function GlassNavbar({ active, onThemeToggle, theme }) {
  const items = [
    ['beranda', '⌂', 'Beranda'],
    ['berita', '▤', 'Berita'],
    ['galeri', '▦', 'Galeri'],
    ['tentang', 'ⓘ', 'Tentang'],
  ]

  return <nav className={`glass-navbar ${theme}`} aria-label="Navigasi utama">
    {items.map(([route, icon, label]) => <a key={route} href={`#${route}`} className={`glass-navbar-tab ${active === route ? 'active' : ''}`} aria-current={active === route ? 'page' : undefined}><span className="glass-navbar-icon" aria-hidden="true">{icon}</span><span className="glass-navbar-label">{label}</span></a>)}
    <span className="glass-navbar-divider" aria-hidden="true" />
    <button type="button" onClick={onThemeToggle} className="glass-navbar-toggle" aria-label="Ganti tema warna">{theme === 'light' ? '☾' : '☀'}</button>
  </nav>
}
