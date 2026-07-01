import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getInterview,
  submitResponse,
  completeInterview,
  Interview,
  Question
} from '../api/interviews'
import {
  Brain,
  AlertCircle,
  Loader2,
  Cpu,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react'

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadInterview()
    }
  }, [id])

  const loadInterview = async () => {
    try {
      setIsLoading(true)
      const data = await getInterview(id!)
      
      // If already completed, jump to feedback
      if (data.completed_at) {
        navigate(`/interviews/${id}/feedback`)
        return
      }

      setInterview(data)

      // Find first unanswered question
      const firstUnanswered = data.questions.findIndex((q) => !q.response)
      if (firstUnanswered !== -1) {
        setCurrentIdx(firstUnanswered)
      } else {
        // All answered but not finished, trigger compile
        handleComplete(data.id)
      }
    } catch (err: any) {
      setError('Could not load interview session.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (interviewId: string) => {
    try {
      setIsSubmitting(true)
      await completeInterview(interviewId)
      navigate(`/interviews/${interviewId}/feedback`)
    } catch (err) {
      setError('Failed to process session completion report.')
      setIsSubmitting(false)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!answer.trim() || answer.trim().length < 5) {
      setError('Please provide a substantial answer (at least 5 characters).')
      return
    }
    setError('')
    setIsSubmitting(true)

    const activeQuestion = interview!.questions[currentIdx]

    try {
      const savedResponse = await submitResponse(activeQuestion.id, answer)
      
      // Update local state
      const updatedQuestions = [...interview!.questions]
      updatedQuestions[currentIdx] = {
        ...activeQuestion,
        response: savedResponse,
      }
      setInterview({ ...interview!, questions: updatedQuestions })
      setAnswer('')

      // Proceed forward or finish
      if (currentIdx < interview!.questions.length - 1) {
        setCurrentIdx((prev) => prev + 1)
      } else {
        await handleComplete(interview!.id)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit response. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Resuming interview session...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Interview session not found.</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 bg-indigo-600 px-6 py-2.5 rounded-xl">
          Return to Dashboard
        </button>
      </div>
    )
  }

  const currentQuestion = interview.questions[currentIdx]
  const progressPercent = ((currentIdx) / interview.questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 relative overflow-hidden flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 space-y-6">
        {/* Nav Header */}
        <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-650/15 flex items-center justify-center text-indigo-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mock Interview</span>
              <p className="text-sm font-semibold">{interview.category} ({interview.difficulty})</p>
            </div>
          </div>
          <span className="text-sm font-bold text-slate-400">
            Question {currentIdx + 1} of {interview.questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Interviewer Prompt
            </span>
            <h2 className="text-xl font-bold leading-relaxed text-slate-100">
              {currentQuestion?.question_text}
            </h2>
          </div>

          {/* Answer Form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="user-answer" className="block text-sm font-semibold text-slate-400">
                Your Answer
              </label>
              <textarea
                id="user-answer"
                rows={7}
                required
                disabled={isSubmitting}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your explanation, conceptual outline, or code snippet here..."
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30 transition-all font-mono resize-y caret-slate-200 selection:bg-indigo-500/30"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnswerSubmit}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? (
                <>
                  <Cpu className="w-5 h-5 animate-spin text-white" />
                  Evaluating Response via AI...
                </>
              ) : (
                <>
                  Submit & Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
