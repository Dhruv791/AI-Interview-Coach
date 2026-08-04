import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getInterview, Interview } from '../api/interviews'
import {
  Award,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Cpu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

export default function InterviewFeedbackPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadInterview()
    }
  }, [id])

  const loadInterview = async () => {
    try {
      setIsLoading(true)
      const data = await getInterview(id!)
      setInterview(data)
      if (data.questions.length > 0) {
        setExpandedQuestion(data.questions[0].id)
      }
    } catch (err) {
      setError('Failed to load interview feedback report.')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border border-emerald-500/20";
    if (score >= 60) return "bg-amber-500/10 border border-amber-500/20";
    return "bg-red-500/10 border border-red-500/20";
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-400 text-xs tracking-wider uppercase font-mono">Compiling feedback report...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold font-display">Feedback Report Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 bg-primary px-6 py-2.5 rounded-full font-bold">
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 relative overflow-hidden">
      {/* Background radial spotlight */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        className="max-w-4xl mx-auto relative z-10 space-y-8"
        initial={{ opacity: 0, y: isReduced ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header navigation */}
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2.5 hover:bg-slate-900/60 border border-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
              Performance Review <Sparkles className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-wider">
              Completed: {new Date(interview.completed_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Score Card Dashboard Summary */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-xl border-glow-primary relative overflow-hidden">
          {/* Subtle inside shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

          <div className="flex justify-center md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6 relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-primary/30 bg-primary/5 text-3xl font-black text-primary shadow-[0_0_15px_rgb(var(--primary)/0.2)] font-mono">
                {interview.overall_score}%
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2.5 font-mono">Overall Score</p>
            </div>
          </div>
          <div className="md:col-span-3 space-y-3 relative z-10">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Award className="w-4 h-4" />
              <span>AI Evaluation Report Summary</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {interview.overall_feedback}
            </p>
            <div className="flex gap-4 pt-2 font-mono text-xs">
              <div className="text-slate-550">
                CATEGORY: <span className="text-slate-300 font-semibold">{interview.category.toUpperCase()}</span>
              </div>
              <div className="text-slate-550">
                DIFFICULTY: <span className="text-slate-300 font-semibold">{interview.difficulty.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question breakdown list */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">Detailed Response Breakdown</h2>

          <div className="space-y-3">
            {interview.questions.map((q, idx) => {
              const isExpanded = expandedQuestion === q.id
              const hasFeedback = q.response?.feedback
              const score = hasFeedback ? q.response!.feedback!.score : 0

              return (
                <div
                  key={q.id}
                  className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 relative"
                >
                  {/* Header Collapsible Trigger */}
                  <div
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <span className="text-xs font-mono font-bold text-slate-500 shrink-0">0{idx + 1}</span>
                      <p className="font-semibold text-sm truncate text-slate-200">{q.question_text}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {hasFeedback && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${getScoreBg(score)} ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Collapsed feedback content body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={isReduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={isReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                        exit={isReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 md:p-8 bg-slate-900/50 border-t border-white/5 space-y-6">
                          {/* Question text */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Question Prompt</p>
                            <p className="text-sm text-slate-200 font-medium leading-relaxed">{q.question_text}</p>
                          </div>

                          {/* Candidate Answer */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Your Submission</p>
                            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                              {q.response ? q.response.user_answer : <span className="text-slate-650 italic">No response was recorded for this question.</span>}
                            </div>
                          </div>

                          {/* AI Feedback critique */}
                          {q.response?.feedback && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Critique */}
                                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4.5 space-y-2">
                                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Response Evaluation
                                  </span>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {q.response.feedback.critique}
                                  </p>
                                </div>

                                {/* Actionable suggestions */}
                                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4.5 space-y-2">
                                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                    <BookOpen className="w-3.5 h-3.5 text-primary" /> Key Improvements
                                  </span>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {q.response.feedback.suggestions || 'No critical weaknesses detected in this response.'}
                                  </p>
                                </div>
                              </div>

                              {/* Model answer suggestion reference */}
                              {q.suggested_answer && (
                                <div className="space-y-2 border-t border-white/5 pt-4.5">
                                  <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Suggested Refinement Outline
                                  </span>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    {q.suggested_answer}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
