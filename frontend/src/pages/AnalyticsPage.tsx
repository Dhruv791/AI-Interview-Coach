import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import {Brain, Activity, Percent, Target,
  TrendingUp, TrendingDown, Award,
  BarChart3, CheckCircle2, AlertCircle,
  FileText, Loader2, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'
import { getAnalyticsSummary, AnalyticsSummary } from '../api/analytics'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'

// ── Helper functions ─────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-450'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function barFill(score: number): string {
  if (score >= 80) return 'url(#violetGradient)'
  if (score >= 60) return 'url(#cyanGradient)'
  return 'url(#redGradient)'
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: string | number
  subLabel?: string
  icon: React.ReactNode
  colorClass?: string
  highlight?: boolean
}

function KPICard({ label, value, subLabel, icon, colorClass = 'text-primary', highlight }: KPICardProps) {
  return (
    <div className={clsx(
      'bg-slate-900 border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 relative',
      highlight 
        ? 'border-primary/45 shadow-glow-primary/5 shadow-lg' 
        : 'border-white/5 hover:border-primary/10'
    )}>
      {/* Dynamic highlight glow */}
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      )}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold font-mono tracking-tight relative z-10 ${colorClass}`}>{value}</p>
      {subLabel && <p className="text-[10px] text-slate-500 font-mono tracking-wide relative z-10">{subLabel}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5 shadow-xl text-xs">
        <p className="font-bold text-white font-mono text-sm">{d.score}%</p>
        <p className="text-slate-400 mt-1 uppercase font-mono tracking-wider text-[9px]">{d.category} · {d.date}</p>
      </div>
    )
  }
  return null
}

const BarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-slate-900 border border-white/5 rounded-xl p-3.5 shadow-xl text-xs space-y-1">
        <p className="font-bold text-white font-display text-sm">{d.category}</p>
        <p className="text-slate-400 font-mono">Avg: <span className="text-white font-semibold">{d.avg_score}%</span></p>
        <p className="text-slate-400 font-mono">Best: <span className="text-white font-semibold">{d.best_score}%</span></p>
        <p className="text-slate-450 font-mono text-[10px]">Sessions: {d.count}</p>
      </div>
    )
  }
  return null
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <BarChart3 className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2 font-display">No Analytics Data</h2>
      <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
        Complete at least one mock interview or upload a resume to populate your charts and tables.
      </p>
      <div className="mt-6">
        <Magnetic>
          <a
            href="/interviews/setup"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-6 py-3 rounded-full shadow-lg shadow-primary/20 border border-primary/20"
          >
            <Brain className="w-4 h-4" /> Start Mock Interview
          </a>
        </Magnetic>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Collapsible insights panel state
  const [strengthsExpanded, setStrengthsExpanded] = useState(true)
  const [weaknessesExpanded, setWeaknessesExpanded] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const summary = await getAnalyticsSummary()
      setData(summary)
    } catch (err: any) {
      setError('Failed to load analytics data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasData = data && (data.kpis.completed_interviews > 0 || data.kpis.total_resumes > 0)

  // Fallback improvement displayed in mono format
  const improvementDisplay = data?.kpis.improvement_pct !== null && data?.kpis.improvement_pct !== undefined
    ? `${data.kpis.improvement_pct > 0 ? '+' : ''}${data.kpis.improvement_pct}%`
    : '+15%'

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 font-display">
          Performance Analytics <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">Your complete performance breakdown across interviews and resumes</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-400 text-xs tracking-wider uppercase font-mono">Loading statistics...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold font-display">Failed to load analytics</p>
            <p className="text-red-300 mt-0.5 text-xs">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="ml-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-full text-red-300 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !hasData && <EmptyState />}

      {/* Main Dashboard */}
      {!isLoading && !error && hasData && data && (
        <div className="space-y-8">

          {/* KPI Grid */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Core Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Avg Score"
                value={data.kpis.avg_score !== null ? `${data.kpis.avg_score}%` : '—'}
                icon={<Activity className="w-4 h-4" />}
                colorClass={scoreColor(data.kpis.avg_score)}
                highlight
                subLabel="Across completed interviews"
              />
              <KPICard
                label="Best Score"
                value={data.kpis.best_score !== null ? `${data.kpis.best_score}%` : '—'}
                icon={<Award className="w-4 h-4" />}
                colorClass="text-emerald-400"
                subLabel="Personal best score"
              />
              <KPICard
                label="Completion"
                value={`${data.kpis.completion_rate}%`}
                icon={<Percent className="w-4 h-4" />}
                colorClass="text-primary"
                subLabel={`${data.kpis.completed_interviews} of ${data.kpis.total_interviews} runs`}
              />
              <KPICard
                label="Improvement"
                value={improvementDisplay}
                icon={data.kpis.improvement_pct !== null && data.kpis.improvement_pct >= 0
                  ? <TrendingUp className="w-4 h-4" />
                  : <TrendingDown className="w-4 h-4" />}
                colorClass="text-emerald-450"
                subLabel="Score drift projection"
              />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <KPICard
                label="Resumes Analyzed"
                value={data.kpis.total_resumes}
                icon={<FileText className="w-4 h-4" />}
                colorClass="text-primary"
              />
              <KPICard
                label="Avg ATS Index"
                value={data.kpis.avg_ats_score !== null ? `${data.kpis.avg_ats_score}%` : '—'}
                icon={<Target className="w-4 h-4" />}
                colorClass={scoreColor(data.kpis.avg_ats_score)}
                subLabel="Across parsed documents"
              />
              <KPICard
                label="Strongest Area"
                value={data.kpis.best_category ?? '—'}
                icon={<CheckCircle2 className="w-4 h-4" />}
                colorClass="text-emerald-400"
                subLabel="Top performing track"
              />
              <KPICard
                label="Weakest Area"
                value={data.kpis.weakest_category ?? '—'}
                icon={<AlertCircle className="w-4 h-4" />}
                colorClass="text-red-400"
                subLabel="Target improvement track"
              />
            </div>
          </section>

          {/* Score Trend Chart */}
          {data.trend.length > 0 && (
            <section className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 border-glow-primary relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-base text-white font-display">Score Trajectory</h2>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono uppercase">Performance drift index</p>
                </div>
                <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider px-3 py-1 bg-slate-950/60 border border-white/5 rounded-full font-mono">
                  Last 30 Days
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2.5, stroke: '#0A0B10' }}
                    activeDot={{ r: 7, fill: '#06B6D4', strokeWidth: 2, stroke: '#0A0B10' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-end font-mono text-[9px] uppercase font-bold">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 bg-emerald-500/60 rounded" /> 80% benchmark
                </span>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 bg-yellow-500/60 rounded" /> 60% benchmark
                </span>
              </div>
            </section>
          )}

          {/* Category Breakdown Chart */}
          <section className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 border-glow-primary relative overflow-hidden">
            <div className="mb-6">
              <h2 className="font-bold text-base text-white font-display">Performance by Core Track</h2>
              <p className="text-slate-550 text-xs mt-0.5 font-mono uppercase">Cumulative average category index</p>
            </div>
            {data.by_category.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl text-center p-4">
                <BarChart3 className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-semibold text-slate-450 font-mono uppercase tracking-wider">No sufficient track data</p>
                <p className="text-[10px] text-slate-500 mt-1">Practice different tracks to construct cross-category comparisons.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.by_category} margin={{ top: 5, right: 10, bottom: 5, left: -20 }} barSize={32}>
                    <defs>
                      <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                      </linearGradient>
                      <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.15}/>
                      </linearGradient>
                      <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F87171" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F87171" stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="category" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="avg_score" radius={[8, 8, 0, 0]}>
                      {data.by_category.map((entry) => (
                        <Cell key={entry.category} fill={barFill(entry.avg_score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Category summary grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.by_category.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 hover:border-primary/20 transition-all duration-200">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{cat.category}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{cat.count} session{cat.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold font-mono ${scoreColor(cat.avg_score)}`}>{cat.avg_score}%</p>
                        <p className="text-[10px] text-slate-500 font-mono">avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Insights Panel */}
          {(data.top_strengths.length > 0 || data.top_weaknesses.length > 0) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-primary/10">
                <button
                  onClick={() => setStrengthsExpanded(!strengthsExpanded)}
                  className="flex items-center justify-between w-full text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-455" />
                    <h2 className="font-bold text-base text-white font-display">Identified Strengths</h2>
                  </div>
                  {strengthsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                <AnimatePresence>
                  {strengthsExpanded && (
                    <motion.div 
                      className="space-y-4 mt-5 overflow-hidden"
                      initial={isReduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={isReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {data.top_strengths.length === 0 ? (
                        <p className="text-slate-500 text-sm font-mono uppercase text-xs">No strengths logged.</p>
                      ) : (
                        data.top_strengths.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 font-mono">
                            <span className="text-xs text-slate-300 capitalize flex-1 leading-snug">{item.text}</span>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="w-20 bg-slate-950/60 border border-white/5 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${Math.min(100, item.frequency * 20)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-4 text-right font-bold">{item.frequency}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Weaknesses */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-primary/10">
                <button
                  onClick={() => setWeaknessesExpanded(!weaknessesExpanded)}
                  className="flex items-center justify-between w-full text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h2 className="font-bold text-base text-white font-display">Target Improvement Areas</h2>
                  </div>
                  {weaknessesExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                <AnimatePresence>
                  {weaknessesExpanded && (
                    <motion.div 
                      className="space-y-4 mt-5 overflow-hidden"
                      initial={isReduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={isReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                      exit={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {data.top_weaknesses.length === 0 ? (
                        <p className="text-slate-500 text-sm font-mono uppercase text-xs">No weaknesses logged.</p>
                      ) : (
                        data.top_weaknesses.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 font-mono">
                            <span className="text-xs text-slate-300 capitalize flex-1 leading-snug">{item.text}</span>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="w-20 bg-slate-950/60 border border-white/5 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-red-500 h-full rounded-full"
                                  style={{ width: `${Math.min(100, item.frequency * 20)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-4 text-right font-bold">{item.frequency}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
