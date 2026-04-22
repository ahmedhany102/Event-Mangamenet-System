import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FeatureCard from '../components/landing/FeatureCard'
import HowItWorksStep from '../components/landing/HowItWorksStep'

export default function LandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-900 text-white">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <p className="mb-4 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs tracking-wide text-white/90">
              Campus Event Ops Platform
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Run Your Events Like a Pro</h1>
            <p className="mt-4 text-base text-cyan-100 sm:text-lg">
              Manage registrations, scan tickets, and track attendance in real-time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admin"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Create Event
              </Link>
              <Link
                to="/events"
                className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Browse Events
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                How It Works
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Everything You Need in One Platform</h2>
          <p className="mt-2 text-sm text-slate-600">
            Purpose-built tools for organizers, check-in staff, and attendees.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            title="Fast Event Setup"
            description="Create events in minutes and publish instantly to your public event board."
            delay={0.05}
          />
          <FeatureCard
            title="Smart Registration"
            description="Collect attendee details, enforce ticket rules, and issue QR-ready credentials."
            delay={0.1}
          />
          <FeatureCard
            title="Live Check-In"
            description="Use ticket codes or camera scans for quick, accurate gate operations."
            delay={0.15}
          />
          <FeatureCard
            title="Actionable Analytics"
            description="View attendance, no-shows, and operational trends as events unfold."
            delay={0.2}
          />
        </div>
      </section>

      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-slate-600">From setup to check-in, every step is built for speed and clarity.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <HowItWorksStep
              step={1}
              title="Create Your Event"
              description="Define title, schedule, venue, and ticketing rules from one dashboard."
              delay={0.05}
            />
            <HowItWorksStep
              step={2}
              title="Open Registrations"
              description="Attendees register online and get unique ticket credentials instantly."
              delay={0.1}
            />
            <HowItWorksStep
              step={3}
              title="Scan at Entry"
              description="Staff verify tickets using scanner or manual code check without delay."
              delay={0.15}
            />
            <HowItWorksStep
              step={4}
              title="Track Outcomes"
              description="Review attendance and engagement data to improve future events."
              delay={0.2}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
