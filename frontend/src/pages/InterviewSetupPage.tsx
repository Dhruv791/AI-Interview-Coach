import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, Play, Cpu, Clock, HelpCircle, AlertCircle, Sparkles } from 'lucide-react'
import { startInterview } from '../api/interviews'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

const DIFFICULTY_CONFIG = {
  Easy: { emoji: '🟢', color: 'text-emerald-450', activeBorder: 'border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.15)] bg-emerald-500/5', bg: 'bg-emerald-500/5', duration: 8 },
  Medium: { emoji: '🟡', color: 'text-yellow-450', activeBorder: 'border-yellow-500/50 shadow-[0_0_12px_rgba(250,204,21,0.15)] bg-yellow-500/5', bg: 'bg-yellow-500/5', duration: 12 },
  Hard: { emoji: '🔴', color: 'text-red-450', activeBorder: 'border-red-500/50 shadow-[0_0_12px_rgba(248,113,113,0.15)] bg-red-500/5', bg: 'bg-red-500/5', duration: 18 },
} as const

type Difficulty = keyof typeof DIFFICULTY_CONFIG

const CATEGORIES = [
  { value: 'Backend', label: 'Backend Engineering', desc: 'System design, Databases, APIs, caching', icon: '⚙️' },
  { value: 'Frontend', label: 'Frontend Engineering', desc: 'React, browser performance, CSS layouts, JS logic', icon: '🖥️' },
  { value: 'Full Stack', label: 'Full Stack Development', desc: 'End-to-end applications, integrations, deployment', icon: '🚀' },
  { value: 'DSA', label: 'Data Structures & Algorithms', desc: 'Problem solving, computational complexity, trees/graphs', icon: '🧩' },
  { value: 'HR', label: 'HR & Behavioral', desc: 'Situation handling, collaboration, leadership questions', icon: '🤝' },
]

const NUM_QUESTIONS = 5

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [category, setCategory] = useState('Backend')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const isGuest = Boolean(user?.is_guest)
  const isGuestLimitReached = isGuest && user?.interviews_remaining === 0

  const diffCfg = DIFFICULTY_CONFIG[difficulty]

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGuestLimitReached) {
      toast.error('Guest limit reached. Please sign up for a free account!')
      navigate('/register')
      return
    }

    setError('')
    setIsStarting(true)
    try {
      const session = await startInterview({ category, difficulty })
      toast.success('Interview session started!')
      navigate(`/interviews/${session.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to start interview. Please try again.'
      setError(msg)
      setIsStarting(false)
    }
  }

  // Check prefers-reduced-motion
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="p-6 md:p-10 flex items-start justify-center min-h-[calc(100vh-56px)] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="w-full max-w-xl relative z-10"
        initial={{ opacity: 0, y: isReduced ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl shadow-black/40 space-y-6 relative border-glow-primary">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">Configure Session</h1>
            <p className="text-slate-400 text-sm mt-1">Select your focus category and difficulty level</p>
          </div>

          {/* Guest Limit Warning Banner */}
          {isGuestLimitReached ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-xs">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Guest limit reached (2/2 interviews used)</p>
                  <p className="text-slate-300 mt-0.5">Create a free account to unlock unlimited AI mock interviews.</p>
                </div>
              </div>
              <Link
                to="/register"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-full shrink-0 shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-2 bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Guest Mode: <strong className="text-amber-300">{user?.interviews_remaining ?? 2}</strong> mock interviews remaining.
              </span>
            </div>
          ) : null}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-6">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
              <div className="grid grid-cols-1 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value
                  return (
                    <div
                      key={cat.value}
                      onClick={() => !isStarting && setCategory(cat.value)}
                      className={clsx(
                        'p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none relative',
                        isSelected
                          ? 'bg-primary/10 border-primary/40 shadow-glow-primary/5'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-850/50'
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.icon}</span>
                          <span className={clsx('font-bold text-sm tracking-wide', isSelected ? 'text-primary' : 'text-slate-200')}>
                            {cat.label}
                          </span>
                        </div>
                        <div className={clsx('w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                          isSelected ? 'border-primary bg-primary/20' : 'border-slate-650'
                        )}>
                          {isSelected && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs mt-1.5 leading-relaxed pl-8">{cat.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Difficulty selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
                  const cfg = DIFFICULTY_CONFIG[diff]
                  const isSelected = difficulty === diff
                  return (
                    <button
                      key={diff}
                      type="button"
                      disabled={isStarting}
                      onClick={() => setDifficulty(diff)}
                      className={clsx(
                        'py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 font-mono',
                        isSelected
                          ? `${cfg.activeBorder} ${cfg.color} border`
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      )}
                    >
                      <span>{cfg.emoji}</span>
                      <span>{diff}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Session Summary info panel */}
            <div className="flex items-center gap-4 bg-slate-950/50 border border-white/5 rounded-xl px-5 py-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span><span className="font-bold text-white">{NUM_QUESTIONS}</span> QUESTIONS</span>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-primary" />
                <span>EST. <span className="font-bold text-white">~{diffCfg.duration} MINS</span></span>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div className={clsx('font-bold', diffCfg.color)}>
                {difficulty.toUpperCase()}
              </div>
            </div>

            {/* Start Button */}
            <div className="w-full">
              <Magnetic>
                <button
                  type="submit"
                  disabled={isStarting || isGuestLimitReached}
                  className="w-full bg-primary hover:bg-primary/95 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45 border border-primary/20"
                >
                  {isStarting ? (
                    <><Cpu className="w-5 h-5 animate-spin" /> Generating AI Questions...</>
                  ) : isGuestLimitReached ? (
                    'Guest Limit Reached — Sign Up to Continue'
                  ) : (
                    <><Play className="w-4 h-4 fill-white" /> Start Mock Interview</>
                  )}
                </button>
              </Magnetic>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
