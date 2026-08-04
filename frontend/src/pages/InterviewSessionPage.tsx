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
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

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

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-slate-400 text-xs tracking-wider uppercase font-mono">Resuming interview session...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold font-display">Session Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 bg-primary px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/20">
          Return to Dashboard
        </button>
      </div>
    )
  }

  const currentQuestion = interview.questions[currentIdx]
  const progressPercent = (currentIdx / interview.questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10 relative overflow-hidden flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        className="w-full max-w-3xl relative z-10 space-y-6"
        initial={{ opacity: 0, scale: isReduced ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Nav Header */}
        <div className="flex justify-between items-center bg-slate-900/40 border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Active Session</span>
              <p className="text-xs font-bold text-slate-200 tracking-wide">{interview.category} ({interview.difficulty.toUpperCase()})</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Q. {currentIdx + 1} / {interview.questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900/80 border border-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl shadow-black/45 space-y-6 border-glow-primary">
          <div className="space-y-2">
            <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Interviewer Prompt
            </span>
            <h2 className="text-lg md:text-xl font-bold leading-relaxed text-slate-150">
              {currentQuestion?.question_text}
            </h2>
          </div>

          {/* Answer Form */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="user-answer" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Answer Explanation
              </label>
              <textarea
                id="user-answer"
                rows={7}
                required
                disabled={isSubmitting}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your outline, explanation logic, or code snippet here..."
                className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl p-4 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all font-mono resize-y caret-slate-200"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="w-full flex justify-end">
              <Magnetic>
                <button
                  onClick={handleAnswerSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/95 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 border border-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Cpu className="w-5 h-5 animate-spin text-white" />
                      Evaluating response...
                    </>
                  ) : (
                    <>
                      Submit & Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
