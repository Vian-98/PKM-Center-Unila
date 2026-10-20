import React, { useState } from 'react'
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Users,
  MessageSquare,
  Sparkles,
  Search,
  GraduationCap,
  Scale,
  FolderCog,
  LogOut,
  Home,
  BookOpen,
  ArrowLeftRight,
  Menu,
  ChevronRight,
} from 'lucide-react'

export function DesktopSidebarLayout({ user, active, routePrefix, onLogout, onSwitchRole, onOpenProfile, children }) {
  const [collapsed, setCollapsed] = useState(false)

  // routePrefix = 'mahasiswa' | 'dosen' | 'reviewer' | 'admin'
  const prefix = routePrefix || user?.role || 'mahasiswa'

  const getSidebarLinks = () => {
    if (!user) {
      return [
        { label: 'Beranda Utama', href: '#beranda', icon: <Home size={17} /> },
        { label: 'Panduan PKM', href: '#pedoman', icon: <BookOpen size={17} /> },
      ]
    }
    switch (user.role) {
      case 'dosen':
        return [
          { label: 'Dashboard Bimbingan', href: '#dosen', icon: <GraduationCap size={17} /> },
          { label: 'Pesan & Catatan', href: '#dosen/pesan', icon: <MessageSquare size={17} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={17} /> },
        ]
      case 'reviewer':
        return [
          { label: 'Antrean Penilaian', href: '#reviewer', icon: <Scale size={17} /> },
          { label: 'Pesan & Feedback', href: '#reviewer/pesan', icon: <MessageSquare size={17} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={17} /> },
        ]
      case 'admin':
        return [
          { label: 'Kelola Data', href: '#admin', icon: <FolderCog size={17} /> },
          { label: 'Portal Dosen', href: '#dosen', icon: <GraduationCap size={17} /> },
          { label: 'Portal Reviewer', href: '#reviewer', icon: <Scale size={17} /> },
          { label: 'Pusat Pesan', href: '#admin/pesan', icon: <MessageSquare size={17} /> },
        ]
      case 'mahasiswa':
      default:
        return [
          { label: 'Dashboard', href: '#mahasiswa', icon: <LayoutDashboard size={17} /> },
          { label: 'Ajukan Proposal', href: '#mahasiswa/ajukan-proposal', icon: <FilePlus size={17} /> },
          { label: 'Logbook Digital', href: '#mahasiswa/logbook', icon: <ClipboardList size={17} /> },
          { label: 'Manajemen & Cari Tim', href: '#mahasiswa/tim', icon: <Users size={17} /> },
          { label: 'PKMATE (AI)', href: '#mahasiswa/pkmate', icon: <Sparkles size={17} /> },
          { label: 'Lacak Proposal', href: '#mahasiswa/cek-status', icon: <Search size={17} /> },
          { label: 'Pesan & Konsultasi', href: '#mahasiswa/pesan', icon: <MessageSquare size={17} /> },
        ]
    }
  }

  const links = getSidebarLinks()

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const roles = user?.roles || []

  // Tentukan target peran dan label tombol switch role secara dinamis
  let switchTarget = null
  let switchLabel = 'Ganti Peran'

  if (user?.role === 'admin') {
    if (roles.includes('dosen')) {
      switchTarget = 'dosen'
      switchLabel = 'Ganti ke Dosen'
    } else if (roles.includes('reviewer')) {
      switchTarget = 'reviewer'
      switchLabel = 'Ganti ke Reviewer'
    }
  } else if (user?.role === 'dosen') {
    if (roles.includes('admin')) {
      switchTarget = 'admin'
      switchLabel = 'Kembali ke Panel Admin'
    } else if (roles.includes('reviewer')) {
      switchTarget = 'reviewer'
      switchLabel = 'Ganti ke Reviewer'
    }
  } else if (user?.role === 'reviewer') {
    if (roles.includes('admin')) {
      switchTarget = 'admin'
      switchLabel = 'Kembali ke Panel Admin'
    } else if (roles.includes('dosen')) {
      switchTarget = 'dosen'
      switchLabel = 'Ganti ke Dosen'
    }
  }

  const canSwitch = Boolean(onSwitchRole && user && switchTarget !== null)

  const portalLabel = {
    dosen: 'Portal Dosen Pembimbing',
    reviewer: 'Portal Reviewer PKM',
    admin: 'Portal Administrator',
    mahasiswa: 'Portal Mahasiswa PKM',
  }[user?.role] ?? 'Portal PKM Center'

  const roleLabel = {
    dosen: 'Dosen Pembimbing',
    reviewer: 'Reviewer PKM',
    admin: 'Administrator',
    mahasiswa: 'Mahasiswa PKM',
  }[user?.role] ?? 'Pengguna'

  // Mencocokkan active state berdasarkan sub-route di hash baru
  const isActive = (href) => {
    const currentHash = window.location.hash || '#beranda'
    // Exact match
    if (`#${active}` === href || currentHash === href) return true
    // Match sub-route key (e.g. active='ajukan-proposal' matches href='#mahasiswa/ajukan-proposal')
    const hrefParts = href.replace('#', '').split('/')
    const subKey = hrefParts.length > 1 ? hrefParts[1] : hrefParts[0]
    if (subKey === active) return true
    // Alias matches
    if (subKey === 'pkmate' && active === 'idealab') return true
    if (subKey === 'idealab' && active === 'pkmate') return true
    if (subKey === 'tim' && active === 'caritim') return true
    if (subKey === 'caritim' && active === 'tim') return true
    return false
  }

  return (
    <div className={`bo-layout${collapsed ? ' bo-collapsed' : ''}`}>

      {/* ──────────── SIDEBAR ──────────────────────────── */}
      <aside className="bo-sidebar">

        {/* Brand */}
        <div className="bo-brand">
          <a href="#beranda" className="bo-brand-inner" title="PKM Center Universitas Lampung">
            <div className="bo-brand-logos">
              <img src="/Logo-2016-Unila.png" alt="Unila" />
              <img src="/logo-pkm-center.png" alt="PKM" />
            </div>
            <div className="bo-brand-text">
              <span className="bo-brand-name">PKM CENTER</span>
              <span className="bo-brand-sub">UNIVERSITAS LAMPUNG</span>
            </div>
          </a>
        </div>

        {/* Section label */}
        <p className="bo-section-label">Menu Utama</p>

        {/* Nav */}
        <nav className="bo-nav">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href}
              title={link.label}
              className={`bo-nav-link${isActive(link.href) ? ' active' : ''}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
            >
              <span className="bo-nav-icon">{link.icon}</span>
              <span className="bo-nav-label">{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Footer */}
        {user && (
          <div className="bo-sidebar-footer">
            <div className="bo-sidebar-divider" />

            {/* User Row */}
            <button
              className="bo-user-row"
              onClick={onOpenProfile}
              title="Buka profil"
            >
              <div className="bo-avatar">{initials}</div>
              <div className="bo-user-text">
                <span className="bo-user-name">{user.name}</span>
                <span className="bo-user-role">{roleLabel}</span>
              </div>
            </button>

            {/* Switch Role */}
            {canSwitch && (
              <button
                className="bo-btn-switch"
                onClick={() => onSwitchRole(switchTarget)}
              >
                <ArrowLeftRight size={13} />
                <span>{switchLabel}</span>
              </button>
            )}

            {/* Logout */}
            <button className="bo-btn-logout" onClick={onLogout}>
              <LogOut size={13} />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </aside>

      {/* ──────────── MAIN ─────────────────────────────── */}
      <div className="bo-main">

        {/* Topbar */}
        <header className="bo-topbar">
          {/* Left: toggle + title */}
          <div className="bo-topbar-left">
            <button
              className="bo-toggle"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
            </button>
            <span className="bo-topbar-title">{portalLabel}</span>
          </div>

          {/* Right: switch role (hanya jika pengguna memiliki multi-peran) */}
          {canSwitch && (
            <div className="bo-topbar-right">
              <button
                className="bo-topbar-switch"
                onClick={() => onSwitchRole(switchTarget)}
              >
                <ArrowLeftRight size={13} />
                <span>{switchLabel}</span>
              </button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="bo-content">
          {children}
        </main>
      </div>
    </div>
  )
}
