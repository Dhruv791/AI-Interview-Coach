import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Play, Cpu, Clock, HelpCircle } from 'lucide-react'
import { startInterview } from '../api/interviews'
import { toast } from 'sonner'
import clsx from 'clsx'

const DIFFICULTY_CONFIG = {
  Easy:   { emoji: '🟢', color: 'text-emerald-400', ring: 'border-emerald-500', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500 text-white shadow-emerald-500/30', duration: 8 },
  Medium: { emoji: '🟡', color: 'text-yellow-400',  ring: 'border-yellow-500',  bg: 'bg-yellow-500/10',  activeBg: 'bg-yellow-500 text-white shadow-yellow-500/30',  duration: 12 },
  Hard:   { emoji: '🔴', color: 'text-red-400',     ring: 'border-red-500',     bg: 'bg-red-500/10',    activeBg: 'bg-red-500 text-white shadow-red-500/30',        duration: 18 },
} as const

type Difficulty = keyof typeof DIFFICULTY_CONFIG

const CATEGORIES = [
  { value: 'Backend',    label: 'Backend Engineering',           desc: 'System design, Databases, APIs, caching',                icon: '⚙️' },
  { value: 'Frontend',   label: 'Frontend Engineering',          desc: 'React, browser performance, CSS layouts, JS logic',       icon: '🖥️' },
  { value: 'Full Stack', label: 'Full Stack Development',        desc: 'End-to-end applications, integrations, deployment',       icon: '🚀' },
  { value: 'DSA',        label: 'Data Structures & Algorithms',  desc: 'Problem solving, computational complexity, trees/graphs', icon: '🧩' },
  { value: 'HR',         label: 'HR & Behavioral',               desc: 'Situation handling, collaboration, leadership questions', icon: '🤝' },
]

const NUM_QUESTIONS = 5

export default function InterviewSetupPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('Backend')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const diffCfg = DIFFICULTY_CONFIG[difficulty]

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <div className="p-6 md:p-10 flex items-start justify-center min-h-[calc(100vh-56px)] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/30 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Configure Interview</h1>
            <p className="text-slate-400 text-sm mt-1">Select your focus category and difficulty level</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Category</label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value
                  return (
                    <div
                      key={cat.value}
                      onClick={() => !isStarting && setCategory(cat.value)}
                      className={clsx(
                        'p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none',
                        isSelected
                          ? 'bg-indigo-600/12 border-indigo-500/70 shadow-md shadow-indigo-600/10 scale-[1.01]'
                          : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.icon}</span>
                          <span className={clsx('font-semibold text-sm', isSelected ? 'text-indigo-300' : 'text-slate-200')}>
                            {cat.label}
                          </span>
                        </div>
                        <div className={clsx('w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                          isSelected ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600'
                        )}>
                          {isSelected && <div className="w-2 h-2 bg-indigo-400 rounded-full" />}
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs mt-1.5 leading-relaxed pl-8">{cat.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Difficulty</label>
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
                        'py-3 rounded-xl border text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5',
                        isSelected
                          ? `${cfg.activeBg} border-transparent shadow-lg`
                          : `${cfg.bg} ${cfg.ring} border opacity-70 hover:opacity-100 ${cfg.color}`
                      )}
                    >
                      {cfg.emoji} {diff}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-4 bg-slate-800/60 border border-white/6 rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span><span className="font-bold text-white">{NUM_QUESTIONS}</span> Questions</span>
              </div>
              <div className="w-px h-5 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Est. <span className="font-bold text-white">~{diffCfg.duration} mins</span></span>
              </div>
              <div className="w-px h-5 bg-slate-700" />
              <div className={clsx('text-sm font-semibold', diffCfg.color)}>
                {difficulty}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="submit"
              disabled={isStarting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.01] active:scale-100"
            >
              {isStarting ? (
                <><Cpu className="w-5 h-5 animate-spin" /> Generating AI Questions...</>
              ) : (
                <><Play className="w-4 h-4 fill-white" /> Start Interview Session</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
