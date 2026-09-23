import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, AlertCircle,
  Trash2, Award, BookOpen, Sparkles, Loader2, Search, ArrowUpDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadResume, listResumes, deleteResume, Resume } from '../api/resumes'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'
import clsx from 'clsx'

const tabVariants = {
  initial: { opacity: 0, x: 5 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, x: -5, transition: { duration: 0.12, ease: "easeIn" } },
}

export default function ResumePage() {
  const { user } = useAuthStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'strengths' | 'weaknesses' | 'recommendations'>('strengths')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isGuest = Boolean(user?.is_guest)
  const isGuestResumeLimitReached = isGuest && user?.resumes_remaining === 0

  // Search & Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const data = await listResumes()
      setResumes(data)
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data[0])
      }
    } catch (err: any) {
      console.error('Failed to fetch resumes', err)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (isGuestResumeLimitReached) {
      setError('Guest limit reached (2/2 resume analyses). Please create an account!')
      toast.error('Guest limit reached. Sign up for unlimited ATS scans!')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.')
      toast.error('Only PDF documents are supported')
      return
    }
    setError('')
    setIsUploading(true)
    setUploadProgress(10)

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      const result = await uploadResume(file)
      clearInterval(interval)
      setUploadProgress(100)

      setTimeout(() => {
        setIsUploading(false)
        setResumes((prev) => [result, ...prev])
        setSelectedResume(result)
        toast.success('Resume uploaded & analyzed successfully!')
      }, 500)
    } catch (err: any) {
      setIsUploading(false)
      const msg = err?.response?.data?.detail || 'Failed to analyze resume. Please verify the file is not corrupted.'
      setError(msg)
      toast.error('Analysis failed')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      await deleteResume(id)
      setResumes((prev) => prev.filter((r) => r.id !== id))
      toast.success('Resume deleted')
      if (selectedResume?.id === id) {
        setSelectedResume(null)
      }
    } catch (err) {
      toast.error('Deletion failed')
      console.error('Failed to delete resume', err)
    }
  }

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-450 stroke-emerald-500'
    if (score >= 60) return 'text-yellow-400 stroke-yellow-500'
    return 'text-red-400 stroke-red-500'
  }

  const getScoreGlowStyle = (score: number) => {
    if (score >= 80) return 'rgba(52, 211, 153, 0.25)'
    if (score >= 60) return 'rgba(250, 204, 21, 0.25)'
    return 'rgba(248, 113, 113, 0.25)'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    return 'bg-red-500/10 text-red-400 border border-red-500/20'
  }

  // Filter & Sort list
  const filteredResumes = resumes
    .filter((r) => r.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const timeA = new Date(a.uploaded_at).getTime()
      const timeB = new Date(b.uploaded_at).getTime()
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB
    })

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 font-display">
          Resume Analyzer <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">Check your ATS score and get insights on your resume</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left panel: Upload & History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Guest Limit Warning Banner */}
          {isGuestResumeLimitReached ? (
            <div className="flex flex-col items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 text-xs">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Guest limit reached (2/2 resumes analyzed)</p>
                  <p className="text-slate-300 mt-0.5">Create a free account to unlock unlimited ATS analyses & history.</p>
                </div>
              </div>
              <Link
                to="/register"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase text-[10px] tracking-wider px-3.5 py-1.5 rounded-full mt-1 shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Guest Mode: <strong className="text-amber-300">{user?.resumes_remaining ?? 2}</strong> resume scans remaining.
              </span>
            </div>
          ) : null}

          {/* Upload Area */}
          <div
            className={clsx(
              'border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-350 cursor-pointer relative overflow-hidden',
              dragActive
                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgb(var(--primary)/0.15)] scale-[1.01] animate-pulse'
                : 'border-white/5 bg-slate-900/60 hover:bg-slate-900 hover:border-white/10'
            )}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileInput}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="py-6 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-200">Analyzing your Resume...</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono uppercase">processing ATS tags</p>
                </div>
                <div className="w-full bg-slate-950 border border-white/5 rounded-full h-1.5 overflow-hidden max-w-[200px] mx-auto">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-center mx-auto text-primary group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {dragActive ? 'Drop Resume Here' : 'Drag & Drop Resume PDF'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse from computer (Max 5MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resume History */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Previous Analysis</h2>

            {/* Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl pl-9 pr-3 py-2 text-slate-200 text-xs outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest'))}
                title="Sort order"
                className="p-2 bg-slate-950/60 hover:bg-slate-850 border border-white/5 rounded-xl text-slate-400 hover:text-slate-200 transition"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {filteredResumes.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-xs font-mono">
                {searchQuery ? 'NO MATCHES FOUND.' : 'NO ANALYSIS HISTORY.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredResumes.map((resume) => {
                  const isSelected = selectedResume?.id === resume.id
                  return (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedResume(resume)}
                      className={clsx(
                        'flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200',
                        isSelected
                          ? 'bg-slate-800/60 border-primary/30 shadow-[0_0_10px_rgb(var(--primary)/0.05)]'
                          : 'bg-slate-950/20 border-white/5 hover:border-white/10 hover:bg-slate-950/40'
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="truncate">
                          <p className={clsx('font-semibold truncate text-xs transition-colors', isSelected ? 'text-white' : 'text-slate-300')}>
                            {resume.file_name}
                          </p>
                          <p className="text-slate-500 mt-0.5 font-mono text-[9px]">
                            {new Date(resume.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {resume.analysis && (
                          <span className={clsx(
                            'text-[9px] font-bold px-2 py-0.5 rounded-full font-mono',
                            getScoreBgColor(resume.analysis.ats_score)
                          )}>
                            {resume.analysis.ats_score}%
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDelete(resume.id, e)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Details Analysis */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl shadow-black/30 relative border-glow-primary overflow-hidden">
              {/* File Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight font-display">{selectedResume.file_name}</h2>
                  <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">
                    Uploaded: {new Date(selectedResume.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedResume.analysis && (
                    <div className="flex items-center gap-4 bg-slate-950/60 border border-white/5 px-4.5 py-3.5 rounded-2xl relative shadow-md">
                      {/* SVG Circular score gauge */}
                      {(() => {
                        const score = selectedResume.analysis.ats_score
                        const radius = 28
                        const circ = 2 * Math.PI * radius
                        const offset = circ - (score / 100) * circ
                        const colorClass = getScoreColorClass(score)
                        const glowStyle = getScoreGlowStyle(score)

                        return (
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-16 h-16 -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                className="stroke-slate-800"
                                strokeWidth="4.5"
                                fill="transparent"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r={radius}
                                className={colorClass.split(' ')[1]}
                                strokeWidth="4.5"
                                fill="transparent"
                                strokeDasharray={circ}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{
                                  filter: `drop-shadow(0 0 4px ${glowStyle})`
                                }}
                              />
                            </svg>
                            <span className={clsx('absolute text-sm font-black font-mono', colorClass.split(' ')[0])}>
                              {score}
                            </span>
                          </div>
                        )
                      })()}

                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">ATS INDEX</p>
                        <p className={clsx(
                          'text-xs font-bold tracking-wide mt-0.5',
                          getScoreColorClass(selectedResume.analysis.ats_score).split(' ')[0]
                        )}>
                          {selectedResume.analysis.ats_score >= 80 ? 'ATS Optimization Complete' :
                           selectedResume.analysis.ats_score >= 60 ? 'Candidate Score Profile Match' :
                           'Needs Keyword Revision'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedResume.analysis ? (
                <div className="space-y-6">
                  {/* Navigation Tabs Pill selector */}
                  <div className="flex bg-slate-950/60 p-1 border border-white/5 rounded-full w-max gap-1">
                    {(['strengths', 'weaknesses', 'recommendations'] as const).map((tab) => {
                      const isActive = activeTab === tab
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className="relative px-5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-full transition-colors font-mono"
                        >
                          <span className={clsx('relative z-10 transition-colors duration-200', isActive ? 'text-white' : 'text-slate-500 hover:text-slate-350')}>
                            {tab}
                          </span>
                          {isActive && (
                            <motion.div
                              layoutId="activeTabPill"
                              className="absolute inset-0 bg-primary/20 border border-primary/25 rounded-full"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Tab Contents with Framer Motion Animation */}
                  <div className="min-h-[220px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        variants={tabVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        {activeTab === 'strengths' && (
                          <>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Key strengths identified on your resume:</p>
                            {selectedResume.analysis.strengths.map((str, idx) => (
                              <div key={idx} className="flex gap-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4.5">
                                <Award className="w-5 h-5 text-emerald-450 shrink-0 mt-0.5" />
                                <p className="text-slate-300 text-xs leading-relaxed">{str}</p>
                              </div>
                            ))}
                          </>
                        )}

                        {activeTab === 'weaknesses' && (
                          <>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Gaps or areas holding your resume back:</p>
                            {selectedResume.analysis.weaknesses.map((weak, idx) => (
                              <div key={idx} className="flex gap-3.5 bg-red-500/5 border border-red-500/10 rounded-xl p-4.5">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-slate-300 text-xs leading-relaxed">{weak}</p>
                              </div>
                            ))}
                          </>
                        )}

                        {activeTab === 'recommendations' && (
                          <>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider font-mono">Actions to optimize ATS rating:</p>
                            {selectedResume.analysis.recommendations.map((rec, idx) => (
                              <div key={idx} className="flex gap-3.5 bg-primary/5 border border-primary/10 rounded-xl p-4.5">
                                <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-slate-300 text-xs leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs uppercase tracking-wider">
                  No analysis report generated.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <FileText className="w-12 h-12 text-slate-750 mb-4" />
              <h3 className="font-bold text-lg text-slate-300 font-display">Select a Resume File</h3>
              <p className="text-xs text-slate-500 mt-1">Or upload a new resume on the left to start parsing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
