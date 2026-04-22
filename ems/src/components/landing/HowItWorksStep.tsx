import { motion } from 'framer-motion'

type Props = {
  step: number
  title: string
  description: string
  delay?: number
}

export default function HowItWorksStep({ step, title, description, delay = 0 }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
        {step}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </motion.article>
  )
}
