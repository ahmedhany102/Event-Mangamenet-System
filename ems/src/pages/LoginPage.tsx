import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const isAdmin = localStorage.getItem('isAdmin') === 'true'
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (username === 'ahmed' && password === 'ahmed') {
      localStorage.setItem('isAdmin', 'true')
      navigate('/admin', { replace: true })
      return
    }

    setError('Invalid credentials')
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#05070f] px-4">
      {/* Background gradients matching Landing Page */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.22),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.2),transparent_40%),linear-gradient(160deg,#030712_0%,#0a1023_55%,#081228_100%)]" />
      <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_35px_120px_rgba(8,15,40,0.8)] backdrop-blur-2xl">
        {/* EMS Logo */}
        <div className="mb-6 text-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            EMS
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to access the EMS admin dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-200">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              placeholder="Enter password"
              required
            />
          </div>

          {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-200 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_35px_rgba(56,189,248,0.35)] transition hover:-translate-y-0.5"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-400 transition hover:text-slate-200">
            &larr; Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}