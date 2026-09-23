import { useEffect, useRef, useState } from 'react'

const glowColorMap = {
  gold: { base: 51, spread: 40 },
  blue: { base: 210, spread: 40 },
  green: { base: 120, spread: 40 },
  red: { base: 0, spread: 40 },
}

export function GlowCard({ children, glowColor = 'gold', className = '' }) {
  const cardRef = useRef(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const updateCapability = () => setCanHover(mediaQuery.matches)
    updateCapability()
    mediaQuery.addEventListener('change', updateCapability)

    const syncPointer = (event) => {
      if (!mediaQuery.matches || !cardRef.current) return
      const bounds = cardRef.current.getBoundingClientRect()
      cardRef.current.style.setProperty('--x', `${event.clientX - bounds.left}px`)
      cardRef.current.style.setProperty('--y', `${event.clientY - bounds.top}px`)
      cardRef.current.style.setProperty('--xp', (event.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer, { passive: true })
    return () => {
      mediaQuery.removeEventListener('change', updateCapability)
      document.removeEventListener('pointermove', syncPointer)
    }
  }, [])

  const { base, spread } = glowColorMap[glowColor] || glowColorMap.gold
  return <div ref={cardRef} className={`glow-card glow-card--${canHover ? 'interactive' : 'static'} ${className}`} style={{ '--base': base, '--spread': spread }}>{children}</div>
}
