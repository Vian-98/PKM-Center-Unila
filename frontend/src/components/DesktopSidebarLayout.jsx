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
  User,
  Menu,
  ChevronRight,
} from 'lucide-react'

export function DesktopSidebarLayout({ user, active, onLogout, onSwitchRole, onOpenProfile, children }) {
  const [collapsed, setCollapsed] = useState(false)

  const getSidebarLinks = () => {
    if (!user) {
      return [
        { label: 'Beranda Utama', href: '#beranda', icon: <Home size={17} /> },
        { label: 'Panduan PKM', href: '#pedoman', icon: <BookOpen size={17} /> },
        { label: 'Cek Status', href: '#cek-status', icon: <Search size={17} /> },
      ]
    }
    switch (user.role) {
      case 'dosen':
        return [
          { label: 'Dashboard Bimbingan', href: '#dosen', icon: <GraduationCap size={17} /> },
          { label: 'Pesan & Catatan', href: '#pesan', icon: <MessageSquare size={17} /> },
          { label: 'Profil Saya', href: '#profil', icon: <User size={17} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={17} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={17} /> },
        ]
      case 'reviewer':
        return [
          { label: 'Antrean Penilaian', href: '#reviewer', icon: <Scale size={17} /> },
          { label: 'Pesan & Feedback', href: '#pesan', icon: <MessageSquare size={17} /> },
          { label: 'Profil Saya', href: '#profil', icon: <User size={17} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={17} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={17} /> },
        ]
      case 'admin':
        return [
          { label: 'Kelola Data', href: '#admin', icon: <FolderCog size={17} /> },
          { label: 'Portal Dosen', href: '#dosen', icon: <GraduationCap size={17} /> },
          { label: 'Portal Reviewer', href: '#reviewer', icon: <Scale size={17} /> },
          { label: 'Pusat Pesan', href: '#pesan', icon: <MessageSquare size={17} /> },
          { label: 'Profil Saya', href: '#profil', icon: <User size={17} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={17} /> },
        ]
      case 'mahasiswa':
      default:
        return [
          { label: 'Dashboard', href: '#mahasiswa', icon: <LayoutDashboard size={17} /> },
          { label: 'Ajukan Proposal', href: '#ajukan-proposal', icon: <FilePlus size={17} /> },
          { label: 'Logbook Digital', href: '#logbook', icon: <ClipboardList size={17} /> },
          { label: 'Manajemen Tim', href: '#tim', icon: <Users size={17} /> },
          { label: 'Cari Tim & Dosen', href: '#caritim', icon: <Users size={17} /> },
          { label: 'Idea Lab (AI)', href: '#idealab', icon: <Sparkles size={17} /> },
          { label: 'Lacak Proposal', href: '#cek-status', icon: <Search size={17} /> },
          { label: 'Pesan & Konsultasi', href: '#pesan', icon: <MessageSquare size={17} /> },
          { label: 'Profil Saya', href: '#profil', icon: <User size={17} /> },
          { label: 'Panduan PKM', href: '#pedoman', icon: <BookOpen size={17} /> },
          { label: 'Website Utama', href: '#beranda', icon: <Home size={17} /> },
        ]
    }
  }

  const links = getSidebarLinks()

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const canSwitch = Boolean(
    onSwitchRole && user &&
    ((user.roles && user.roles.length > 1) || user.role === 'admin')
  )
  const nextRole = user?.role === 'dosen' ? 'reviewer' : 'dosen'

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

  const isActive = (href) => {
    const key = href.replace('#', '')
    if (key === active) return true
    if (key === 'ajukan-proposal' && active === 'ajukanproposal') return true
    if (key === 'cek-status' && active === 'cekstatus') return true
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
                onClick={() => onSwitchRole(nextRole)}
              >
                <ArrowLeftRight size={13} />
                <span>Ganti ke <b>{nextRole === 'dosen' ? 'Dosen' : 'Reviewer'}</b></span>
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

          {/* Right: switch + user pill + logout */}
          <div className="bo-topbar-right">
            {canSwitch && (
              <button
                className="bo-topbar-switch"
                onClick={() => onSwitchRole(nextRole)}
              >
                <ArrowLeftRight size={13} />
                <span>Ganti ke <b>{nextRole === 'dosen' ? 'Dosen' : 'Reviewer'}</b></span>
              </button>
            )}

            {user && (
              <button className="bo-topbar-user" onClick={onOpenProfile}>
                <div className="bo-topbar-avatar">{initials}</div>
                <div className="bo-topbar-user-text">
                  <span className="bo-topbar-name">{user.name}</span>
                  <span className="bo-topbar-role">{roleLabel}</span>
                </div>
              </button>
            )}

            <button className="bo-topbar-logout" onClick={onLogout} title="Keluar">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="bo-content">
          {children}
        </main>
      </div>
    </div>
  )
}
