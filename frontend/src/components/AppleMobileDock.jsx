import React, { useState } from 'react'
import {
  Home,
  Newspaper,
  BookOpen,
  Search,
  User,
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Users,
  MessageSquare,
  GraduationCap,
  Scale,
  FolderCog,
  LogOut,
  Sparkles,
  MoreHorizontal,
  X,
  ArrowLeftRight,
} from 'lucide-react'

export function AppleMobileDock({ active, user, onLogin, onLogout, onSwitchRole, onOpenProfile }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  // Configure role-based dock items (maximum 5 items for perfect thumb reach)
  const getDockItems = () => {
    if (!user) {
      return [
        { id: 'beranda', label: 'Beranda', icon: <Home size={19} strokeWidth={2} />, href: '#beranda' },
        { id: 'berita', label: 'Berita', icon: <Newspaper size={19} strokeWidth={2} />, href: '#berita' },
        { id: 'pedoman', label: 'Panduan', icon: <BookOpen size={19} strokeWidth={2} />, href: '#pedoman' },
        { id: 'cek-status', label: 'Lacak', icon: <Search size={19} strokeWidth={2} />, href: '#cek-status' },
        { id: 'masuk', label: 'Masuk', icon: <User size={19} strokeWidth={2} />, onClick: onLogin },
      ]
    }

    switch (user.role) {
      case 'dosen':
        return [
          { id: 'dosen', label: 'Bimbingan', icon: <GraduationCap size={19} strokeWidth={2} />, href: '#dosen' },
          { id: 'pesan', label: 'Pesan', icon: <MessageSquare size={19} strokeWidth={2} />, href: '#pesan' },
          { id: 'pedoman', label: 'Panduan', icon: <BookOpen size={19} strokeWidth={2} />, href: '#pedoman' },
          { id: 'beranda', label: 'Beranda', icon: <Home size={19} strokeWidth={2} />, href: '#beranda' },
          { id: 'more', label: 'Lainnya', icon: <MoreHorizontal size={19} strokeWidth={2} />, onClick: () => setSheetOpen(true) },
        ]
      case 'reviewer':
        return [
          { id: 'reviewer', label: 'Penilaian', icon: <Scale size={19} strokeWidth={2} />, href: '#reviewer' },
          { id: 'pesan', label: 'Pesan', icon: <MessageSquare size={19} strokeWidth={2} />, href: '#pesan' },
          { id: 'pedoman', label: 'Panduan', icon: <BookOpen size={19} strokeWidth={2} />, href: '#pedoman' },
          { id: 'beranda', label: 'Beranda', icon: <Home size={19} strokeWidth={2} />, href: '#beranda' },
          { id: 'more', label: 'Lainnya', icon: <MoreHorizontal size={19} strokeWidth={2} />, onClick: () => setSheetOpen(true) },
        ]
      case 'admin':
        return [
          { id: 'admin', label: 'Konten', icon: <FolderCog size={19} strokeWidth={2} />, href: '#admin' },
          { id: 'dosen', label: 'Dosen', icon: <GraduationCap size={19} strokeWidth={2} />, href: '#dosen' },
          { id: 'reviewer', label: 'Reviewer', icon: <Scale size={19} strokeWidth={2} />, href: '#reviewer' },
          { id: 'pesan', label: 'Pesan', icon: <MessageSquare size={19} strokeWidth={2} />, href: '#pesan' },
          { id: 'more', label: 'Lainnya', icon: <MoreHorizontal size={19} strokeWidth={2} />, onClick: () => setSheetOpen(true) },
        ]
      case 'mahasiswa':
      default:
        return [
          { id: 'mahasiswa', label: 'Dashboard', icon: <LayoutDashboard size={19} strokeWidth={2} />, href: '#mahasiswa' },
          { id: 'ajukan-proposal', label: 'Usulan', icon: <FilePlus size={19} strokeWidth={2} />, href: '#ajukan-proposal' },
          { id: 'logbook', label: 'Logbook', icon: <ClipboardList size={19} strokeWidth={2} />, href: '#logbook' },
          { id: 'tim', label: 'Tim', icon: <Users size={19} strokeWidth={2} />, href: '#tim' },
          { id: 'more', label: 'Lainnya', icon: <MoreHorizontal size={19} strokeWidth={2} />, onClick: () => setSheetOpen(true) },
        ]
    }
  }

  const items = getDockItems()

  return (
    <>
      <nav className="apple-mobile-dock" aria-label="Navigasi Bawah">
        <div className="dock-pill-container">
          {items.map(item => {
            const isSelected = active === item.id || (item.id === 'ajukan-proposal' && active === 'ajukanproposal')
            if (item.onClick) {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dock-item ${isSelected ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  <span className="dock-icon">{item.icon}</span>
                  <span className="dock-label">{item.label}</span>
                </button>
              )
            }
            return (
              <a
                key={item.id}
                href={item.href}
                className={`dock-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                  document.documentElement.scrollTop = 0
                  document.body.scrollTop = 0
                }}
              >
                <span className="dock-icon">{item.icon}</span>
                <span className="dock-label">{item.label}</span>
                {isSelected && <span className="dock-active-glow" />}
              </a>
            )
          })}
        </div>
      </nav>

      {/* Apple-style Action Sheet Modal on Mobile for "Lainnya" */}
      {sheetOpen && (
        <div className="apple-sheet-backdrop" onClick={() => setSheetOpen(false)}>
          <div className="apple-sheet-card" onClick={e => e.stopPropagation()}>
            <div className="apple-sheet-handle" />
            <div className="apple-sheet-header">
              <div className="apple-sheet-title">Menu Cepat PKM</div>
              <button type="button" className="apple-sheet-close" onClick={() => setSheetOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="apple-sheet-grid">
              {user && onOpenProfile && (
                <button
                  type="button"
                  className="apple-sheet-item"
                  style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}
                  onClick={() => {
                    setSheetOpen(false)
                    onOpenProfile()
                  }}
                >
                  <div className="apple-sheet-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><User size={20} /></div>
                  <span>Profil Saya</span>
                </button>
              )}
              {user?.role === 'mahasiswa' && (
                <>
                  <a href="#idealab" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                    <div className="apple-sheet-icon" style={{ background: '#eff6ff', color: '#0071e3' }}><Sparkles size={20} /></div>
                    <span>PKMATE (AI)</span>
                  </a>

                  <a href="#caritim" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                    <div className="apple-sheet-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><Users size={20} /></div>
                    <span>Cari Tim / Dosen</span>
                  </a>
                  <a href="#cek-status" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                    <div className="apple-sheet-icon" style={{ background: '#fefce8', color: '#ca8a04' }}><Search size={20} /></div>
                    <span>Lacak Usulan</span>
                  </a>
                  <a href="#pesan" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                    <div className="apple-sheet-icon" style={{ background: '#faf5ff', color: '#9333ea' }}><MessageSquare size={20} /></div>
                    <span>Pesan &amp; Revisi</span>
                  </a>
                </>
              )}
              <a href="#beranda" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                <div className="apple-sheet-icon" style={{ background: '#f1f5f9', color: '#475569' }}><Home size={20} /></div>
                <span>Beranda Publik</span>
              </a>
              <a href="#pedoman" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                <div className="apple-sheet-icon" style={{ background: '#f1f5f9', color: '#475569' }}><BookOpen size={20} /></div>
                <span>Buku Pedoman</span>
              </a>
              {/* Pilihan Switch Role di Action Sheet Mobile */}
              {user?.roles && onSwitchRole && (
                <>
                  {(() => {
                    const roles = user?.roles || []
                    let target = null
                    let label = ''

                    if (user?.role === 'admin') {
                      if (roles.includes('dosen')) { target = 'dosen'; label = 'Ganti ke Dosen' }
                      else if (roles.includes('reviewer')) { target = 'reviewer'; label = 'Ganti ke Reviewer' }
                    } else if (user?.role === 'dosen') {
                      if (roles.includes('admin')) { target = 'admin'; label = 'Kembali ke Panel Admin' }
                      else if (roles.includes('reviewer')) { target = 'reviewer'; label = 'Ganti ke Reviewer' }
                    } else if (user?.role === 'reviewer') {
                      if (roles.includes('admin')) { target = 'admin'; label = 'Kembali ke Panel Admin' }
                      else if (roles.includes('dosen')) { target = 'dosen'; label = 'Ganti ke Dosen' }
                    }

                    if (!target) return null

                    const bgColor = user.role === 'dosen' ? '#f5f3ff' : user.role === 'reviewer' ? '#eff6ff' : '#f1f5f9'
                    const textColor = user.role === 'dosen' ? '#7c3aed' : user.role === 'reviewer' ? '#2563eb' : '#1d4ed8'

                    return (
                      <button
                        type="button"
                        className="apple-sheet-item"
                        style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer' }}
                        onClick={() => {
                          setSheetOpen(false)
                          onSwitchRole(target)
                        }}
                      >
                        <div className="apple-sheet-icon" style={{ background: bgColor, color: textColor }}>
                          <ArrowLeftRight size={20} />
                        </div>
                        <span>{label}</span>
                      </button>
                    )
                  })()}
                </>
              )}
              <a href="#galeri" className="apple-sheet-item" onClick={() => { setSheetOpen(false); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }}>
                <div className="apple-sheet-icon" style={{ background: '#f1f5f9', color: '#475569' }}><Newspaper size={20} /></div>
                <span>Galeri Kegiatan</span>
              </a>
            </div>

            <div className="apple-sheet-footer">
              <button
                type="button"
                className="apple-sheet-logout"
                onClick={() => { setSheetOpen(false); onLogout() }}
              >
                <LogOut size={16} /> Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
