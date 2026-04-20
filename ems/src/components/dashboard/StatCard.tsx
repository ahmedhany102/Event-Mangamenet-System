type StatCardProps = {
  title: string
  value: string
  description: string
  accentClassName?: string
}

export default function StatCard({ title, value, description, accentClassName = 'bg-slate-900' }: StatCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`absolute left-0 top-0 h-1 w-full ${accentClassName}`} />
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  )
}