import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MagneticProps {
  children: React.ReactElement
}

export function Magnetic({ children }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    // Check if the device has a fine pointer (mouse) and if reduced motion is disabled
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldAnimate(hasFinePointer && !prefersReducedMotion)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!shouldAnimate || !ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    // Calculate distance from center of the element
    const centerX = left + width / 2
    const centerY = top + height / 2
    const x = clientX - centerX
    const y = clientY - centerY

    // Max interactive distance from center to trigger pull
    const triggerRadius = 80
    const distance = Math.sqrt(x * x + y * y)

    if (distance < triggerRadius) {
      // Scale pull displacement to max 12px
      const scale = 0.25
      setPosition({ x: x * scale, y: y * scale })
    } else {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  if (!shouldAnimate) {
    return children
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={position}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  )
}
