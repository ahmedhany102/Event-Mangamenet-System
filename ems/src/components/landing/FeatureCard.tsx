import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  icon: ReactNode
  delay?: number
}

export default function FeatureCard({ title, description, icon, delay = 0 }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-slate-950/70 text-cyan-200">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </div>
    </motion.article>
  )
}
