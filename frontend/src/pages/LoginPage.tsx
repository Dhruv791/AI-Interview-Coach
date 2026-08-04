import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { loginUser } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/auth'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const tokenData = await loginUser(email, password)
      localStorage.setItem('auth_token', tokenData.access_token)
      const user = await getMe()
      setAuth(tokenData.access_token, user)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants supporting prefers-reduced-motion
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cardVariants = {
    hidden: { opacity: 0, y: isReduced ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: isReduced ? 0 : 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: isReduced ? 1 : 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your interview prep account</p>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl shadow-black/40 relative border-glow-primary"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <motion.div 
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-400 text-sm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email */}
            <motion.div className="space-y-1.5" variants={itemVariants}>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-650 text-sm transition-all outline-none"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div className="space-y-1.5" variants={itemVariants}>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-slate-650 text-sm transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={itemVariants} className="pt-2">
              <Magnetic>
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 border border-primary/20"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </Magnetic>
            </motion.div>
          </form>

          {/* Register link */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
