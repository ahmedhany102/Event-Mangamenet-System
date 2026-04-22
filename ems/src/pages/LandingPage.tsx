import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FeatureCard from '../components/landing/FeatureCard'
import HowItWorksStep from '../components/landing/HowItWorksStep'

const parentStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const childFadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-[#05070f] text-slate-100">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.22),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.2),transparent_40%),linear-gradient(160deg,#030712_0%,#0a1023_55%,#081228_100%)]" />
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute bottom-4 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <motion.div
            variants={parentStagger}
            initial="hidden"
            animate="visible"
            className="max-w-xl"
          >
            <motion.p
              variants={childFadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100 backdrop-blur"
            >
              Event Command Platform
            </motion.p>
            <motion.h1 variants={childFadeUp} className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Run Your Events Like a
              <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent"> Premium SaaS Team</span>
            </motion.h1>
            <motion.p variants={childFadeUp} className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
              Orchestrate registrations, approvals, check-in, and live analytics from one beautifully designed control plane.
            </motion.p>

            <motion.div variants={childFadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admin"
                className="rounded-xl bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-200 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(56,189,248,0.35)] transition hover:-translate-y-0.5"
              >
                Launch Dashboard
              </Link>
              <Link
                to="/events"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Browse Events
              </Link>
            </motion.div>

            <motion.div variants={childFadeUp} className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-xs text-slate-300 sm:text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur">
                <p className="text-2xl font-semibold text-white">99.9%</p>
                <p>Operational Uptime</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur">
                <p className="text-2xl font-semibold text-white">2s</p>
                <p>Check-In Validation</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur">
                <p className="text-2xl font-semibold text-white">4x</p>
                <p>Faster Gate Flow</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24, y: 18 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-cyan-400/30 blur-2xl" />
            <div className="absolute -bottom-8 -right-4 h-36 w-36 rounded-full bg-teal-300/30 blur-2xl" />
            <div className="relative rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_35px_120px_rgba(8,15,40,0.8)] backdrop-blur-2xl sm:p-5">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400">Live Command Center</p>
                  <p className="text-sm font-semibold text-white">Tech Summit 2026</p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[11px] font-medium text-emerald-200">
                  Live
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Registrations</p>
                  <p className="mt-1 text-2xl font-semibold text-white">1,284</p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-700">
                    <div className="h-1.5 w-3/4 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">Checked In</p>
                  <p className="mt-1 text-2xl font-semibold text-white">948</p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-700">
                    <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">Recent Gate Activity</p>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>VIP Ticket Verified</span>
                    <span className="text-emerald-200">Just now</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>Speaker Entry Granted</span>
                    <span className="text-cyan-200">1m ago</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span>Capacity Alert Cleared</span>
                    <span className="text-slate-300">3m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-40 max-w-4xl -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Built For High-Impact Event Teams</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            A premium operations layer for planning, admissions, secure access, and post-event intelligence.
          </p>
        </div>

        <motion.div
          variants={parentStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <FeatureCard
            title="Operational Visibility"
            description="Track registrations, scans, and attendee flow with one live command dashboard."
            icon={<span className="text-sm font-semibold">OV</span>}
            delay={0.05}
          />
          <FeatureCard
            title="Secure Access Control"
            description="Gate VIP and speaker tiers with event-scoped codes and role validation."
            icon={<span className="text-sm font-semibold">SC</span>}
            delay={0.1}
          />
          <FeatureCard
            title="Fast Check-In"
            description="Use QR or manual verification with immediate feedback for staff operators."
            icon={<span className="text-sm font-semibold">CI</span>}
            delay={0.15}
          />
          <FeatureCard
            title="Post-Event Insights"
            description="Analyze attendance rates, no-shows, and peak windows to optimize future runs."
            icon={<span className="text-sm font-semibold">AI</span>}
            delay={0.2}
          />
        </motion.div>
      </motion.section>

      <section id="how-it-works" className="relative border-y border-white/10 bg-[#050917]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(45,212,191,0.12),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Designed For Seamless Execution</h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">Scroll-triggered, high-clarity workflow from setup to outcomes.</p>
          </div>

          <motion.div
            variants={parentStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <HowItWorksStep
              step={1}
              title="Configure"
              description="Publish event pages with schedule, capacity, and secure access rules."
              delay={0.05}
            />
            <HowItWorksStep
              step={2}
              title="Register"
              description="Collect attendee data and issue unique ticket credentials instantly."
              delay={0.1}
            />
            <HowItWorksStep
              step={3}
              title="Admit"
              description="Verify arrivals with QR scan or manual checks at speed."
              delay={0.15}
            />
            <HowItWorksStep
              step={4}
              title="Optimize"
              description="Export analytics and refine staffing, timing, and planning decisions."
              delay={0.2}
            />
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,0.18),transparent_45%),linear-gradient(180deg,#04060d_0%,#060d1a_100%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold text-white sm:text-5xl"
          >
            Ship Better Events With A Command-Grade Experience
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base"
          >
            Power your next launch, summit, or campus event with polished operations from day one.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-8"
          >
            <Link
              to="/admin"
              className="inline-flex rounded-xl bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-200 px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_45px_rgba(45,212,191,0.42)] transition hover:-translate-y-0.5"
            >
              Start Managing Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
