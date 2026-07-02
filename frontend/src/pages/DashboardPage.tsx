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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-white/8 rounded-xl p-5 animate-pulse">
      <div className="h-7 w-16 bg-slate-800 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-800/70 rounded" />
    </div>
  )
}

interface TrendBadgeProps { value: number }
function TrendBadge({ value }: TrendBadgeProps) {
  if (value === 0) return null
  const positive = value > 0
  return (
    <span className={clsx(
      'flex items-center gap-0.5 text-xs font-semibold mt-1',
      positive ? 'text-emerald-400' : 'text-red-400'
    )}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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

  // Last in-progress interview
  const lastInProgress = interviews.find((i) => !i.completed_at)

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-indigo-400" />,
      title: 'AI Mock Interviews',
      description: 'Practice with AI-generated questions tailored to your role.',
      badge: 'Active', badgeClass: 'bg-indigo-500/10 text-indigo-400',
      link: '/interviews/setup',
    },
    {
      icon: <FileText className="w-6 h-6 text-violet-400" />,
      title: 'Resume Analysis',
      description: 'Get ATS score and actionable feedback on your resume.',
      badge: 'Active', badgeClass: 'bg-violet-500/10 text-violet-400',
      link: '/resume',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
      title: 'Performance Analytics',
      description: 'Track your progress and identify areas for improvement.',
      badge: 'Active', badgeClass: 'bg-emerald-500/10 text-emerald-400',
      link: '/analytics',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, <span className="text-indigo-400">{firstName}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ready for today's interview practice?</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lastInProgress && (
            <Link
              to={`/interviews/${lastInProgress.id}`}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-white/8 hover:border-indigo-500/30 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-100"
            >
              <ChevronRight className="w-4 h-4 text-indigo-400" /> Continue Interview
            </Link>
          )}
          <Link
            to="/interviews/setup"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-100"
          >
            <Plus className="w-4 h-4" /> Start Interview
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="bg-slate-900 border border-white/8 rounded-xl p-5 hover:border-indigo-500/20 transition-all">
              <p className="text-2xl font-black tracking-tight text-indigo-400">{totalInterviewsCount}</p>
              <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-wider">Interviews Completed</p>
              <TrendBadge value={totalInterviewsCount > 0 ? 8 : 0} />
            </div>
            <div className="bg-slate-900 border border-white/8 rounded-xl p-5 hover:border-emerald-500/20 transition-all">
              <p className="text-2xl font-black tracking-tight text-emerald-400">
                {totalInterviewsCount > 0 ? `${averageScore}%` : '—'}
              </p>
              <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-wider">Avg. Interview Score</p>
              {totalInterviewsCount > 0 && <TrendBadge value={5} />}
            </div>
            <div className="bg-slate-900 border border-white/8 rounded-xl p-5 hover:border-violet-500/20 transition-all">
              <p className="text-2xl font-black tracking-tight text-violet-400">{resumeCount}</p>
              <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-wider">Resumes Analyzed</p>
              <TrendBadge value={resumeCount > 0 ? 2 : 0} />
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Start Interview',   desc: 'Begin a mock session',       link: '/interviews/setup', color: 'indigo' },
            { label: 'Upload Resume',     desc: 'Analyze ATS compatibility',  link: '/resume',           color: 'violet' },
            { label: 'View Analytics',    desc: 'Check your progress',        link: '/analytics',        color: 'emerald' },
          ].map(({ label, desc, link, color }) => (
            <Link
              key={label}
              to={link}
              className={clsx(
                'flex items-center justify-between p-4 bg-slate-900 border border-white/8 rounded-xl group transition-all hover:scale-[1.01] active:scale-100',
                color === 'indigo'  && 'hover:border-indigo-500/30 hover:bg-indigo-600/5',
                color === 'violet'  && 'hover:border-violet-500/30 hover:bg-violet-600/5',
                color === 'emerald' && 'hover:border-emerald-500/30 hover:bg-emerald-600/5',
              )}
            >
              <div>
                <p className="text-sm font-semibold text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <ChevronRight className={clsx(
                'w-4 h-4 transition-transform group-hover:translate-x-0.5',
                color === 'indigo'  && 'text-indigo-400',
                color === 'violet'  && 'text-violet-400',
                color === 'emerald' && 'text-emerald-400',
              )} />
            </Link>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-lg font-bold text-white">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.link)}
              className="bg-slate-900 border border-white/8 rounded-2xl p-6 cursor-pointer group transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-600/5 hover:scale-[1.01] active:scale-100"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold mb-1">{feature.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">{feature.description}</p>
              <span className={clsx('inline-block text-xs rounded-full px-2.5 py-1 font-semibold', feature.badgeClass)}>
                {feature.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interview History */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-lg font-bold text-white">Recent Sessions</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-900 border border-white/8 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-slate-900 border border-white/8 rounded-2xl p-10 text-center">
            <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No interview sessions yet</p>
            <p className="text-slate-600 text-xs mt-1">Start your first mock interview above</p>
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
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900 border border-white/8 hover:border-indigo-500/30 rounded-xl cursor-pointer transition-all gap-4 group hover:scale-[1.005]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/10 transition-colors">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{session.category} Mock Interview</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 font-semibold">{session.difficulty}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold">
                        <Award className="w-3.5 h-3.5" /> Score: {session.overall_score}%
                      </div>
                    ) : (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full font-bold">
                        In Progress
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
