import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import clsx from 'clsx'

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glowColor?: string // e.g. "rgba(139, 92, 246, 0.25)"
  isSelected?: boolean
}

export function TiltCard({
  children,
  className,
  glowColor = 'rgba(139, 92, 246, 0.25)',
  isSelected = false,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Normalized mouse coordinates
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring config for smooth latency-free transition
  const springConfig = { stiffness: 200, damping: 22, mass: 0.8 }

  // Map normalized coordinate system to degrees of tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), springConfig)

  // Map coordinates to glow highlight reflection position
  const glowX = useSpring(useTransform(x, [-0.5, 0.5], ['0%', '100%']), springConfig)
  const glowY = useSpring(useTransform(y, [-0.5, 0.5], ['0%', '100%']), springConfig)

  useEffect(() => {
    // Check for pointer precision and user movement preferences
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldAnimate(hasFinePointer && !prefersReducedMotion)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!shouldAnimate || !cardRef.current) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    
    // Convert to relative pixel coordinates
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Map to normalized range: [-0.5, 0.5]
    const normX = (mouseX / rect.width) - 0.5
    const normY = (mouseY / rect.height) - 0.5

    x.set(normX)
    y.set(normY)
  }

  const handleMouseEnter = () => {
    if (!shouldAnimate) return
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  const cardStyle = shouldAnimate
    ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d' as const,
      }
    : {}

  // Omit conflicting drag/animation keys from react attributes
  const {
    onDrag, onDragStart, onDragEnd,
    onAnimationStart,
    style, ...safeProps
  } = props

  const combinedStyle = {
    ...cardStyle,
    ...style
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={combinedStyle}
      className={clsx(
        'relative bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer',
        isSelected 
          ? 'border-indigo-500/70 shadow-lg shadow-indigo-600/10'
          : 'border-white/8 hover:border-indigo-500/30',
        isHovered && 'shadow-glow-primary -translate-y-1',
        className
      )}
      {...safeProps}
    >
      {/* Light spotlight shine overlay */}
      {shouldAnimate && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-45 mix-blend-screen z-10"
          style={{
            background: `radial-gradient(circle 160px at ${glowX} ${glowY}, ${glowColor}, transparent)`,
          }}
        />
      )}
      {children}
    </motion.div>
  )
}
