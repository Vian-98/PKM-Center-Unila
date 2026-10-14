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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

export function DesktopSidebarLayout({ user, active, onLogout, children }) {
  const [open, setOpen] = useState(true)

  // Configure role-based links
  const getSidebarLinks = () => {
    if (!user) {
      return [
        { label: 'Beranda Utama', href: '#beranda', icon: <Home size={18} /> },
        { label: 'Panduan PKM', href: '#pedoman', icon: <BookOpen size={18} /> },
        { label: 'Cek Status Usulan', href: '#cek-status', icon: <Search size={18} /> },
      ]
    }

    switch (user.role) {
      case 'dosen':
        return [
          { label: 'Dashboard Bimbingan', href: '#dosen', icon: <GraduationCap size={18} /> },
          { label: 'Penugasan Reviewer', href: '#reviewer', icon: <Scale size={18} /> },
          { label: 'Pusat Pesan & Catatan', href: '#pesan', icon: <MessageSquare size={18} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={18} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={18} /> },
        ]
      case 'reviewer':
        return [
          { label: 'Antrean Penilaian', href: '#reviewer', icon: <Scale size={18} /> },
          { label: 'Bimbingan Mahasiswa', href: '#dosen', icon: <GraduationCap size={18} /> },
          { label: 'Pusat Pesan', href: '#pesan', icon: <MessageSquare size={18} /> },
          { label: 'Buku Panduan', href: '#pedoman', icon: <BookOpen size={18} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={18} /> },
        ]
      case 'admin':
        return [
          { label: 'Kelola Konten & Data', href: '#admin', icon: <FolderCog size={18} /> },
          { label: 'Dashboard Dosen', href: '#dosen', icon: <GraduationCap size={18} /> },
          { label: 'Dashboard Reviewer', href: '#reviewer', icon: <Scale size={18} /> },
          { label: 'Pusat Pesan', href: '#pesan', icon: <MessageSquare size={18} /> },
          { label: 'Portal Utama', href: '#beranda', icon: <Home size={18} /> },
        ]
      case 'mahasiswa':
      default:
        return [
          { label: 'Dashboard Usulan', href: '#mahasiswa', icon: <LayoutDashboard size={18} /> },
          { label: 'Ajukan Proposal', href: '#ajukan-proposal', icon: <FilePlus size={18} /> },
          { label: 'Logbook Digital', href: '#logbook', icon: <ClipboardList size={18} /> },
          { label: 'Manajemen Tim', href: '#tim', icon: <Users size={18} /> },
          { label: 'Cari Tim & Dosen', href: '#caritim', icon: <Users size={18} /> },
          { label: 'Idea Lab (AI)', href: '#idealab', icon: <Sparkles size={18} /> },
          { label: 'Lacak Proposal', href: '#cek-status', icon: <Search size={18} /> },
          { label: 'Pesan & Catatan', href: '#pesan', icon: <MessageSquare size={18} /> },
          { label: 'Panduan PKM', href: '#pedoman', icon: <BookOpen size={18} /> },
          { label: 'Website Utama', href: '#beranda', icon: <Home size={18} /> },
        ]
    }
  }

  const links = getSidebarLinks()

  const userInitials = user?.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div className="desktop-app-layout">
      {/* Desktop Sidebar (Apple macOS Style) */}
      <aside className="apple-desktop-sidebar-wrap">
        <div
          className="apple-sidebar-panel"
          style={{ width: open ? '240px' : '68px' }}
        >
          <div>
            <div className="apple-sidebar-header" style={{ justifyContent: open ? 'space-between' : 'center', padding: '0.85rem 1rem' }}>
              {open && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', color: '#0071e3', textTransform: 'uppercase' }}>
                    Menu Portal
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                    {user?.role === 'mahasiswa' ? 'Portal Mahasiswa' : user?.role ? `Portal ${user.role}` : 'Sistem PKM'}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="apple-sidebar-toggle"
                onClick={() => setOpen(!open)}
                title={open ? 'Ciutkan Sidebar' : 'Perluas Sidebar'}
                aria-label="Toggle Sidebar"
              >
                {open ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
            </div>

            <nav className="apple-sidebar-nav" aria-label="Navigasi Menu">
              {links.map((link, idx) => {
                const targetKey = link.href.replace('#', '')
                const isCurrent = active === targetKey || (targetKey === 'ajukan-proposal' && active === 'ajukanproposal') || (targetKey === 'cek-status' && active === 'cekstatus')
                return (
                  <a
                    key={idx}
                    href={link.href}
                    className={`apple-sidebar-link ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                      document.documentElement.scrollTop = 0
                      document.body.scrollTop = 0
                    }}
                    title={!open ? link.label : undefined}
                  >
                    <span className="apple-sidebar-icon">{link.icon}</span>
                    {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.label}</span>}
                  </a>
                )
              })}
            </nav>
          </div>

          {user && (
            <div className="apple-sidebar-footer">
              <div className="apple-sidebar-user" title={`${user.name} (${user.role})`}>
                <div className="apple-sidebar-user-avatar">
                  {userInitials}
                </div>
                {open && (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#0071e3', textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="apple-sidebar-logout-btn"
                title="Keluar dari akun"
              >
                <LogOut size={16} style={{ flexShrink: 0 }} />
                {open && <span>Keluar</span>}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="desktop-app-content">
        {children}
      </div>
    </div>
  )
}

