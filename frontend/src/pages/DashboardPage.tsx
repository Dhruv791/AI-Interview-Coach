import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Brain, FileText, BarChart3, ChevronRight, Award, Calendar,
  TrendingUp, TrendingDown, Zap, Plus, Loader2
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { listInterviews, Interview } from '../api/interviews'
import { listResumes } from '../api/resumes'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Skeleton card matching the new rounded aesthetics
function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 animate-pulse">
      <div className="h-7 w-16 bg-slate-800 rounded-lg mb-2" />
      <div className="h-3 w-32 bg-slate-800/70 rounded-md" />
    </div>
  )
}

interface TrendBadgeProps { value: number }
function TrendBadge({ value }: TrendBadgeProps) {
  if (value === 0) return null
  const positive = value > 0
  return (
    <span className={clsx(
      'flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-full inline-flex font-mono w-max',
      positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
    )}>
      {positive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {positive ? '+' : ''}{value}% this week
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [resumeCount, setResumeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [intList, resList] = await Promise.all([listInterviews(), listResumes()])
      setInterviews(intList)
      setResumeCount(resList.length)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const firstName = displayName.split(' ')[0]

  const completedInterviews = interviews.filter((i) => i.completed_at !== null)
  const totalInterviewsCount = completedInterviews.length
  const averageScore =
    totalInterviewsCount > 0
      ? Math.round(completedInterviews.reduce((acc, c) => acc + (c.overall_score || 0), 0) / totalInterviewsCount)
      : 0

  const lastInProgress = interviews.find((i) => !i.completed_at)

  const features = [
    {
      icon: <Brain className="w-5 h-5 text-primary" />,
      title: 'AI Mock Interviews',
      description: 'Practice with adaptive, AI-generated questions designed for your tech stack.',
      badge: 'Active', badgeClass: 'bg-primary/10 text-primary border border-primary/20',
      link: '/interviews/setup',
      glow: 'rgba(139, 92, 246, 0.25)'
    },
    {
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      title: 'Resume Analysis',
      description: 'Verify ATS scanner alignment and receive real-time impact suggestions.',
      badge: 'Active', badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      link: '/resume',
      glow: 'rgba(6, 182, 212, 0.25)'
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
      title: 'Performance Analytics',
      description: 'Analyze competency charts, historical trends, and progress points.',
      badge: 'Active', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      link: '/analytics',
      glow: 'rgba(52, 211, 153, 0.25)'
    },
  ]

  // Kinetic greeting text configuration
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const greetingText = `${getGreeting()}, ${firstName} 👋`
  const greetingWords = greetingText.split(' ')

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display flex flex-wrap gap-x-2">
            {greetingWords.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: isReduced ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.05,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                {word.includes(firstName) ? <span className="text-primary">{word}</span> : word}
              </motion.span>
            ))}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ready for today's interview practice?</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {lastInProgress && (
            <Magnetic>
              <Link
                to={`/interviews/${lastInProgress.id}`}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 border border-white/5 hover:border-primary/30 text-slate-200 text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
              >
                <ChevronRight className="w-4 h-4 text-primary" /> Continue Interview
              </Link>
            </Magnetic>
          )}
          <Magnetic>
            <Link
              to="/interviews/setup"
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-lg shadow-primary/20 border border-primary/20"
            >
              <Plus className="w-4 h-4" /> Start Interview
            </Link>
          </Magnetic>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <TiltCard className="p-5" glowColor="rgba(6, 182, 212, 0.2)">
              <p className="text-3xl font-bold font-mono tracking-tight text-cyan-400">{totalInterviewsCount}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1">Interviews Completed</p>
              <TrendBadge value={totalInterviewsCount > 0 ? 8 : 0} />
            </TiltCard>

            <TiltCard className="p-5" glowColor="rgba(52, 211, 153, 0.2)">
              <p className="text-3xl font-bold font-mono tracking-tight text-emerald-400">
                {totalInterviewsCount > 0 ? `${averageScore}%` : '—'}
              </p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1">Avg. Interview Score</p>
              {totalInterviewsCount > 0 && <TrendBadge value={5} />}
            </TiltCard>

            <TiltCard className="p-5" glowColor="rgba(139, 92, 246, 0.2)">
              <p className="text-3xl font-bold font-mono tracking-tight text-primary">{resumeCount}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1">Resumes Analyzed</p>
              <TrendBadge value={resumeCount > 0 ? 2 : 0} />
            </TiltCard>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Start Interview',   desc: 'Begin a mock session',       link: '/interviews/setup', glow: 'rgba(139, 92, 246, 0.2)', color: 'text-primary' },
            { label: 'Upload Resume',     desc: 'Analyze ATS compatibility',  link: '/resume',           glow: 'rgba(6, 182, 212, 0.2)',  color: 'text-cyan-400' },
            { label: 'View Analytics',    desc: 'Check your progress',        link: '/analytics',        glow: 'rgba(52, 211, 153, 0.2)', color: 'text-emerald-400' },
          ].map((act) => (
            <Link key={act.label} to={act.link} className="block group">
              <TiltCard className="p-4 border-white/5 hover:border-white/10" glowColor={act.glow}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{act.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                  <ChevronRight className={clsx('w-4 h-4 transition-transform group-hover:translate-x-1', act.color)} />
                </div>
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-xl font-extrabold text-white font-display">Platform Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div key={feature.title} onClick={() => navigate(feature.link)} className="block group cursor-pointer">
              <TiltCard className="p-6 h-full flex flex-col justify-between border-white/5" glowColor={feature.glow}>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-bold mb-1.5 text-base">{feature.title}</h3>
                  <p className="text-slate-450 text-xs leading-relaxed mb-5">{feature.description}</p>
                </div>
                <span className={clsx('inline-block text-[10px] uppercase tracking-wider rounded-full px-3 py-1 font-bold w-max', feature.badgeClass)}>
                  {feature.badge}
                </span>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-xl font-extrabold text-white font-display">Recent Sessions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-900/60 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-10 text-center">
            <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No interview sessions yet</p>
            <p className="text-slate-650 text-xs mt-1">Configure and start your first mock interview above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {interviews.map((session) => {
              const isCompleted = session.completed_at !== null
              return (
                <div
                  key={session.id}
                  onClick={() =>
                    isCompleted
                      ? navigate(`/interviews/${session.id}/feedback`)
                      : navigate(`/interviews/${session.id}`)
                  }
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900 border border-white/5 hover:border-primary/20 rounded-2xl cursor-pointer transition-all duration-300 gap-4 group shadow-sm hover:scale-[1.005]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">{session.category} Interview</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">{session.difficulty}</span>
                        <span className="text-slate-700 text-xs">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-600" />
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold">
                        <Award className="w-3.5 h-3.5" /> {session.overall_score}%
                      </div>
                    ) : (
                      <span className="text-xs bg-yellow-500/10 text-yellow-450 border border-yellow-500/20 px-3 py-1 rounded-full font-mono font-bold">
                        IN PROGRESS
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
