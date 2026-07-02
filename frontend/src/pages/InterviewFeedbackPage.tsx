import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  Sparkles
} from 'lucide-react'

export default function InterviewFeedbackPage() {
  const { id } = useParams<{ id: string }>()

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-450 border-emerald-500/20'
    if (score >= 60) return 'text-yellow-450 border-yellow-500/20'
    return 'text-red-455 border-red-500/20'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Compiling interview feedback report...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Feedback report not found.</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 bg-indigo-600 px-6 py-2.5 rounded-xl">
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Header navigation */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              Performance Review <Sparkles className="w-5 h-5 text-indigo-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Completed on {new Date(interview.completed_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Score Card Dashboard Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-xl">
          <div className="flex justify-center md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-indigo-500/20 bg-indigo-650/10 text-3xl font-black text-indigo-400">
                {interview.overall_score}%
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-2">Overall Score</p>
            </div>
          </div>
          <div className="md:col-span-3 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Award className="w-5 h-5" />
              <span>AI Evaluation Summary</span>
            </div>
            <p className="text-slate-350 text-sm leading-relaxed">
              {interview.overall_feedback}
            </p>
            <div className="flex gap-4 pt-2">
              <div className="text-xs text-slate-500">
                Category: <span className="text-slate-300 font-semibold">{interview.category}</span>
              </div>
              <div className="text-xs text-slate-500">
                Difficulty: <span className="text-slate-300 font-semibold">{interview.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question breakdown list */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Detailed Question Review</h2>

          {interview.questions.map((q, idx) => {
            const isExpanded = expandedQuestion === q.id
            const hasFeedback = q.response?.feedback
            const score = hasFeedback ? q.response!.feedback!.score : 0

            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                {/* Header Collapsible Trigger */}
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <span className="text-sm font-black text-slate-500 shrink-0">0{idx + 1}</span>
                    <p className="font-semibold text-sm truncate text-slate-200">{q.question_text}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {hasFeedback && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreBg(score)} ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Collapsed feedback content body */}
                {isExpanded && (
                  <div className="p-6 md:p-8 bg-slate-900/50 border-t border-slate-850 space-y-6">
                    {/* Question text */}
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Question Prompt</p>
                      <p className="text-sm text-slate-200 font-medium leading-relaxed">{q.question_text}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Your Response</p>
                      <div className="bg-slate-850/60 rounded-xl p-4 border border-slate-800 font-mono text-xs leading-relaxed text-slate-300">
                        {q.response ? q.response.user_answer : <span className="text-slate-500 italic">No response provided.</span>}
                      </div>
                    </div>

                    {/* AI Feedback critique */}
                    {q.response?.feedback && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Critique */}
                          <div className="bg-slate-850/40 border border-slate-800/80 rounded-xl p-4 space-y-1.5">
                            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" /> AI Critique
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {q.response.feedback.critique}
                            </p>
                          </div>

                          {/* Actionable suggestions */}
                          <div className="bg-slate-850/40 border border-slate-800/80 rounded-xl p-4 space-y-1.5">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> Improvement suggestions
                            </span>
                            <p className="text-xs text-slate-350 leading-relaxed">
                              {q.response.feedback.suggestions || 'None.'}
                            </p>
                          </div>
                        </div>

                        {/* Model answer suggestion reference */}
                        {q.suggested_answer && (
                          <div className="space-y-1.5 border-t border-slate-850 pt-4">
                            <span className="text-xs text-emerald-500/80 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ideal Answer Reference
                            </span>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {q.suggested_answer}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
