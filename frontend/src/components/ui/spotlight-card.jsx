import React, { useEffect, useRef } from 'react'

/**
 * Spotlight Glow Card: Kartu interaktif beraksen cahaya yang mengikuti kursor mouse.
 * Diadaptasi ke Plain React + Vite (Vanilla JSX + dynamic CSS variables & border masks).
 *
 * Palet warna diintegrasikan dengan identitas Statuta Unila & tema portal:
 * - gold: Kuning keemasan resmi Unila (#FFD700)
 * - blue: Biru navy portal PKM (#123B66 / #175B91)
 * - green: Hijau kemakmuran daun lada / status lolos (#008000)
 * - red: Merah api semangat / status revisi (#FF0000)
 * - orange & purple: Aksen pelengkap fakultas
 */

const glowColorMap = {
  gold: { base: 51, spread: 80 },    // #FFD700
  blue: { base: 210, spread: 120 },  // #123B66 - #175B91
  green: { base: 135, spread: 120 }, // #0F6B32
  red: { base: 0, spread: 100 },     // #C1121F
  purple: { base: 280, spread: 140 },// #800080
  orange: { base: 30, spread: 120 }, // #EA580C
}

const sizeMap = {
  sm: 'spotlight-card--sm',
  md: 'spotlight-card--md',
  lg: 'spotlight-card--lg',
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'gold',
  size = 'md',
  width,
  height,
  customSize = true,
  noPadding = false,
  style = {},
  dark = false,
}) {
  const cardRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    // Deteksi apakah perangkat menggunakan mouse presisi
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!mq.matches) return

    const syncPointer = (e) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty('--x', `${x.toFixed(2)}px`)
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
      cardRef.current.style.setProperty('--y', `${y.toFixed(2)}px`)
      cardRef.current.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2))
    }

    const currentCard = cardRef.current
    if (currentCard) {
      currentCard.addEventListener('pointermove', syncPointer, { passive: true })
    }
    return () => {
      if (currentCard) {
        currentCard.removeEventListener('pointermove', syncPointer)
      }
    }
  }, [])

  const { base, spread } = glowColorMap[glowColor] || glowColorMap.gold

  const getInlineStyles = () => {
    const isDark = dark || className.includes('dark') || style?.backgroundColor === '#123B66' || style?.color === '#ffffff'
    const backdropGradient = isDark
      ? 'linear-gradient(145deg, rgba(16, 42, 67, 0.98), rgba(10, 31, 53, 0.96))'
      : 'rgba(255, 255, 255, 0.88)'
    const backupBorder = isDark ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.92)'

    const baseStyles = {
      '--base': base,
      '--spread': spread,
      '--radius': '20',
      '--border': '1.5',
      '--backdrop': isDark ? '#102a43' : 'rgba(255, 255, 255, 0.88)',
      '--backup-border': backupBorder,
      '--size': '280',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 1.5) * 1px)',
      '--spotlight-size': 'calc(var(--size, 220) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: isDark
        ? `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            var(--x, 50%)
            var(--y, 50%),
            hsl(var(--hue, 51) 100% 65% / 0.28), transparent 75%
          ), ${backdropGradient}`
        : `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            var(--x, 50%)
            var(--y, 50%),
            hsl(var(--hue, 51) 95% 65% / 0.16), transparent 75%
          ), ${backdropGradient}`,
      backgroundColor: isDark ? '#102a43' : 'rgba(255, 255, 255, 0.88)',
      color: isDark ? '#ffffff' : '#0f172a',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      ...style,
    }

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height
    }

    return baseStyles
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SPOTLIGHT_CSS }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`spotlight-card ${customSize ? 'spotlight-card--fluid' : sizeMap[size] || ''} ${noPadding ? 'no-padding' : ''} ${className}`}
      >
        <div ref={innerRef} data-glow></div>
        {children}
      </div>
    </>
  )
}

const SPOTLIGHT_CSS = `
.spotlight-card {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border-radius: calc(var(--radius, 18) * 1px);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(18, 59, 102, 0.10);
  padding: 1.5rem;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
}

.spotlight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -10px rgba(18, 59, 102, 0.18);
}

.spotlight-card.no-padding {
  padding: 0 !important;
}

.spotlight-card--fluid {
  width: 100%;
}

.spotlight-card--sm:not(.spotlight-card--fluid) { width: 14rem; min-height: 18rem; }
.spotlight-card--md:not(.spotlight-card--fluid) { width: 100%; }
.spotlight-card--lg:not(.spotlight-card--fluid) { width: 100%; }

[data-glow]::before,
[data-glow]::after {
  pointer-events: none;
  content: "";
  position: absolute;
  inset: calc(var(--border-size, 2px) * -1);
  border: var(--border-size, 2px) solid transparent;
  border-radius: calc(var(--radius, 16) * 1px);
  background-attachment: local;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
  -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
  mask-clip: padding-box, border-box;
  -webkit-mask-clip: padding-box, border-box;
  mask-composite: intersect;
  -webkit-mask-composite: destination-in;
}

[data-glow]::before {
  background-image: radial-gradient(
    calc(var(--spotlight-size, 200px) * 0.85) calc(var(--spotlight-size, 200px) * 0.85) at
    var(--x, 50%)
    var(--y, 50%),
    hsl(var(--hue, 51) 100% 55% / 0.9), transparent 80%
  );
  filter: brightness(1.2);
}

[data-glow]::after {
  background-image: radial-gradient(
    calc(var(--spotlight-size, 200px) * 0.5) calc(var(--spotlight-size, 200px) * 0.5) at
    var(--x, 50%)
    var(--y, 50%),
    rgba(255, 255, 255, 0.8), transparent 70%
  );
}

[data-glow] [data-glow] {
  position: absolute;
  inset: 0;
  will-change: filter;
  opacity: var(--outer, 1);
  border-radius: calc(var(--radius, 16) * 1px);
  filter: blur(8px);
  background: none;
  pointer-events: none;
  border: none;
}
`

export default GlowCard
