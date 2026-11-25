import React from 'react'
import { BrandMark } from './BrandMark'

/**
 * BrandLockup adalah satu-satunya sumber tampilan identitas PKM Center.
 * Varian yang tersedia:
 *  - navbar  : header publik
 *  - sidebar : sidebar portal (latar navy gelap)
 *  - auth    : modal masuk/daftar
 *  - footer  : footer publik (latar navy gelap)
 *  - hero    : cadangan bila dibutuhkan lockup besar
 */
export function BrandLockup({
  variant = 'navbar',
  dark = variant === 'sidebar' || variant === 'footer',
  href = '#beranda',
  showText = true,
  showUnila = true,
  className = '',
  onClick,
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`brand brand-lockup brand-lockup--${variant}${dark ? ' brand-lockup--dark' : ''} ${className}`.trim()}
      aria-label="PKM Center Universitas Lampung"
    >
      <span className="brand-lockup__logos" aria-hidden="true">
        {showUnila && <BrandMark kind="unila" className="brand-lockup__unila" />}
        <BrandMark kind="pkm" className="brand-lockup__pkm" />
      </span>
      {showText && (
        <span className="brand-lockup__text">
          <span className="brand-lockup__name">PKM CENTER</span>
          <span className="brand-lockup__sub">UNIVERSITAS LAMPUNG</span>
        </span>
      )}
    </a>
  )
}

export default BrandLockup
