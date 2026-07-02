import {Variants } from "framer-motion";

import React, { useState, useEffect, useRef } from 'react'
import {
  Upload, FileText, AlertCircle,
  Trash2, Award, BookOpen, Sparkles, Loader2, Search, ArrowUpDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadResume, listResumes, deleteResume, Resume } from '../api/resumes'
import { toast } from 'sonner'
import clsx from 'clsx'


const tabVariants: Variants = {
  initial: {
    opacity: 0,
    x: 5,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: -5,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'strengths' | 'weaknesses' | 'recommendations'>('strengths')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-450 border-emerald-500/20'
    if (score >= 60) return 'text-yellow-450 border-yellow-500/20'
    return 'text-red-450 border-red-500/20'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10'
    if (score >= 60) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  // Filter & Sort list
  const filteredResumes = resumes
    .filter((r) => r.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const timeA = new Date(a.uploaded_at).getTime()
      const timeB = new Date(b.uploaded_at).getTime()
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB
    })

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          Resume Analyzer <Sparkles className="w-6 h-6 text-indigo-400" />
        </h1>
        <p className="text-slate-400 text-sm mt-1">Check your ATS score and get insights on your resume</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left panel: Upload & History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload Area */}
          <div
            className={clsx(
              'border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer relative overflow-hidden hover:scale-[1.01] active:scale-100',
              dragActive
                ? 'border-indigo-500 bg-indigo-600/8 shadow-lg shadow-indigo-600/10 scale-[1.02]'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
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
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">Analyzing your Resume...</p>
                  <p className="text-xs text-slate-500 mt-1">This will take a few seconds</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden max-w-[200px] mx-auto">
                  <div
                    className="bg-indigo-650 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 bg-slate-800/80 rounded-xl flex items-center justify-center mx-auto text-indigo-400">
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
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Previous Analysis</h2>

            {/* Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest'))}
                title="Sort order"
                className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 hover:text-slate-200 transition"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {filteredResumes.length === 0 ? (
              <div className="text-center py-6 text-slate-650 text-xs">
                {searchQuery ? 'No matching resumes found.' : 'No resumes uploaded yet.'}
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
                        'flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-150',
                        isSelected
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'bg-slate-900 border-white/5 hover:border-slate-700 hover:bg-slate-850'
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div className="truncate text-sm">
                          <p className={clsx('font-medium truncate text-xs', isSelected ? 'text-indigo-300' : 'text-slate-300')}>
                            {resume.file_name}
                          </p>
                          <p className="text-slate-550 mt-0.5" style={{ fontSize: '10px' }}>
                            {new Date(resume.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {resume.analysis && (
                          <span className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            getScoreBgColor(resume.analysis.ats_score),
                            getScoreColor(resume.analysis.ats_score).split(' ')[0]
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
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl shadow-black/20">
              {/* File Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-6 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{selectedResume.file_name}</h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Uploaded on {new Date(selectedResume.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedResume.analysis && (
                    <div className="flex items-center gap-3 bg-slate-950/40 border border-white/6 px-4 py-2.5 rounded-2xl">
                      {/* Enlarged Circle Gauge */}
                      <div className={clsx(
                        'w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center font-black text-xl shadow-inner',
                        getScoreColor(selectedResume.analysis.ats_score).split(' ')[0],
                        selectedResume.analysis.ats_score >= 80 ? 'border-emerald-500/40 bg-emerald-500/5' :
                        selectedResume.analysis.ats_score >= 60 ? 'border-yellow-500/40 bg-yellow-500/5' :
                        'border-red-500/40 bg-red-500/5'
                      )}>
                        {selectedResume.analysis.ats_score}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ATS SCORE</p>
                        <p className={clsx(
                          'text-xs font-black',
                          getScoreColor(selectedResume.analysis.ats_score).split(' ')[0]
                        )}>
                          {selectedResume.analysis.ats_score >= 80 ? 'Excellent · Top 10% · ATS Ready' :
                           selectedResume.analysis.ats_score >= 60 ? 'Good Potential · Match' :
                           'Needs Revision'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedResume.analysis ? (
                <div className="space-y-6">
                  {/* Navigation Tabs */}
                  <div className="flex border-b border-slate-800/60 gap-1">
                    {(['strengths', 'weaknesses', 'recommendations'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                          'px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors',
                          activeTab === tab
                            ? 'text-indigo-400 border-indigo-600'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                        )}
                      >
                        {tab}
                      </button>
                    ))}
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
                            <p className="text-xs text-slate-450 mb-2">Key assets identified on your resume:</p>
                            {selectedResume.analysis.strengths.map((str, idx) => (
                              <div key={idx} className="flex gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-slate-250 text-sm leading-relaxed">{str}</p>
                              </div>
                            ))}
                          </>
                        )}

                        {activeTab === 'weaknesses' && (
                          <>
                            <p className="text-xs text-slate-450 mb-2">Gaps or areas holding your resume back:</p>
                            {selectedResume.analysis.weaknesses.map((weak, idx) => (
                              <div key={idx} className="flex gap-3 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-slate-255 text-sm leading-relaxed">{weak}</p>
                              </div>
                            ))}
                          </>
                        )}

                        {activeTab === 'recommendations' && (
                          <>
                            <p className="text-xs text-slate-450 mb-2">Step-by-step actions to optimize ATS rating:</p>
                            {selectedResume.analysis.recommendations.map((rec, idx) => (
                              <div key={idx} className="flex gap-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                                <BookOpen className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-slate-255 text-sm leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No analysis report generated.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-slate-350">Select a Resume</h3>
              <p className="text-sm text-slate-550 mt-1">Or upload a new resume on the left to start the analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
