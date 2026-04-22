import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  value: number
  label: string
  suffix?: string
  durationMs?: number
}

export default function AnimatedCounter({ value, label, suffix = '', durationMs = 900 }: Props) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Math.max(0, Math.floor(value))
    if (target === 0) {
      setDisplay(0)
      return
    }

    const start = performance.now()
    let frame = 0

    const tick = (time: number) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(target * eased)
      setDisplay(nextValue)

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, value])

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
    >
      <div className="text-3xl font-bold text-slate-900">
        {display}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
    </motion.article>
  )
}
