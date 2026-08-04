import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { registerUser, getMe } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 8 ? 2 : 3
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']
  const strengthColors = ['', 'bg-red-500/80', 'bg-yellow-500/80', 'bg-primary/80']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      const tokenData = await registerUser({ email, password, full_name: fullName || undefined })
      localStorage.setItem('auth_token', tokenData.access_token)
      const user = await getMe()
      setAuth(tokenData.access_token, user)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants supporting prefers-reduced-motion
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const containerVariants = {
    hidden: { opacity: 0, scale: isReduced ? 1 : 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px] relative border-glow-primary z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Right Panel: Solid Color Welcome Panel (Rendered on top in mobile, right in desktop) */}
        <div className="md:w-[40%] md:order-2 bg-gradient-to-br from-primary via-primary/90 to-cyan-500 text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden rounded-b-[40px] md:rounded-b-none md:rounded-l-[100px] z-20 shadow-xl">
          {/* Subtle inside glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm font-display tracking-wider">InterviewAI</span>
          </div>

          <div className="relative z-10 space-y-3.5 my-12 md:my-0">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display leading-tight">Hello, Friend!</h2>
            <p className="text-xs text-white/80 leading-relaxed font-sans max-w-xs">
              Enter your personal details and start your journey with our AI-powered mock interview sessions today.
            </p>
          </div>

          <div className="relative z-10 space-y-2">
            <p className="text-[9px] uppercase font-mono tracking-widest text-white/60">Already registered?</p>
            <Magnetic>
              <Link
                to="/login"
                className="inline-block border border-white/35 hover:border-white hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all"
              >
                Sign In
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* Left Panel: Form Panel (Rendered bottom in mobile, left in desktop) */}
        <div className="md:w-[60%] md:order-1 p-8 md:p-12 flex flex-col justify-center relative bg-slate-900/60 backdrop-blur-sm z-10">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">Create Account</h1>
              <p className="text-slate-400 text-xs mt-1">Configure your mock coaching profile</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="register-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  Full Name <span className="text-slate-650">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="register-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-655 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="register-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-655 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="register-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-455">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-655 text-sm transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-primary'}`}>
                      {strengthLabels[passwordStrength]} password
                    </p>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Magnetic>
                  <button
                    id="register-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/95 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 border border-primary/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
