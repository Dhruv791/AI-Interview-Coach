import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Lock, Bell, Trash2, Shield, Sun, Moon, Monitor, Save,
  Eye, EyeOff, AlertTriangle, Check, Sparkles
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../components/ThemeProvider'
import { toast } from 'sonner'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Magnetic } from '../components/Magnetic'

const ALL_SECTIONS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'theme', icon: Sun, label: 'Theme' },
  { id: 'password', icon: Lock, label: 'Password' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'danger', icon: Trash2, label: 'Danger Zone' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const isGuest = Boolean(user?.is_guest)

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [notifications, setNotifications] = useState({
    interview_complete: true,
    resume_analyzed: true,
    weekly_report: false,
  })
  const [activeSection, setActiveSection] = useState('profile')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully')
  }

  const handleSavePassword = () => {
    if (isGuest) {
      toast.info('Please create an account to set a custom password')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.next.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    toast.success('Password updated successfully')
    setPasswordForm({ current: '', next: '', confirm: '' })
  }

  const handleDeleteAccount = () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    toast.error('Account deletion is disabled in this demo')
  }

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white font-display">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, preferences, and security</p>
      </div>

      {/* Guest Mode Conversion Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-cyan-500/15 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">You are using a Temporary Guest Account</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Guest sessions auto-expire in 24 hours. Sign up now to permanently preserve your mock interview scores and ATS analyses.
              </p>
            </div>
          </div>
          <Magnetic>
            <Link
              to="/register"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-md shrink-0"
            >
              Save Progress (Sign Up)
            </Link>
          </Magnetic>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Section Nav */}
        <aside className="md:w-48 shrink-0">
          <nav className="flex md:flex-col gap-1.5">
            {ALL_SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={clsx(
                  'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left w-full border font-mono',
                  activeSection === id
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-glow-primary/5'
                    : 'text-slate-450 border-transparent hover:bg-white/5 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: isReduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5 border-glow-primary">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base flex items-center gap-2 text-slate-250 font-display">
                    <User className="w-5 h-5 text-primary" /> Profile Settings
                  </h2>
                  {isGuest && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Guest Session
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl px-4 py-3 text-slate-100 text-sm transition outline-none"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-455 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full bg-slate-950/30 border border-white/5 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed outline-none font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-550 mt-1.5 font-mono uppercase">
                      {isGuest ? 'Temporary auto-generated email. Convert to a real account to set your email.' : 'Email registry change is restricted'}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Magnetic>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-lg shadow-primary/20 border border-primary/20"
                    >
                      <Save className="w-4 h-4" /> Save Profile Changes
                    </button>
                  </Magnetic>
                </div>
              </div>
            )}

            {/* Theme */}
            {activeSection === 'theme' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5 border-glow-primary">
                <h2 className="font-bold text-base flex items-center gap-2 text-slate-250 font-display">
                  <Sun className="w-5 h-5 text-primary" /> Display Interface Theme
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { key: 'light', icon: Sun, label: 'Light', desc: 'High-contrast light interface' },
                    { key: 'dark', icon: Moon, label: 'Dark', desc: 'Ultra-dark coding console' },
                    { key: 'system', icon: Monitor, label: 'System', desc: 'Syncs with user OS variables' },
                  ] as const).map(({ key, icon: Icon, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => { setTheme(key); toast.success(`Theme set to ${label}`) }}
                      className={clsx(
                        'flex flex-col items-center gap-3.5 p-4 rounded-xl border transition-all text-center relative overflow-hidden',
                        theme === key
                          ? 'border-primary/45 bg-primary/5 text-primary'
                          : 'border-white/5 text-slate-400 hover:border-white/10 hover:bg-slate-950/40'
                      )}
                    >
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border',
                        theme === key ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-950/60 border-white/5 text-slate-500'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider font-mono">{label}</p>
                        <p className="text-[10px] opacity-60 mt-1">{desc}</p>
                      </div>
                      {theme === key && (
                        <Check className="absolute top-3 right-3 w-3.5 h-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Password */}
            {activeSection === 'password' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5 border-glow-primary">
                <h2 className="font-bold text-base flex items-center gap-2 text-slate-250 font-display">
                  <Lock className="w-5 h-5 text-primary" /> Change Password
                </h2>
                {isGuest ? (
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-5 text-center space-y-3">
                    <Lock className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-300">Password management is disabled for Guest Mode</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Guest accounts do not have a password. Create a permanent account to configure your credentials.
                    </p>
                    <div className="pt-2">
                      <Magnetic>
                        <button
                          onClick={() => navigate('/register')}
                          className="bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
                        >
                          Sign Up Now
                        </button>
                      </Magnetic>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {(['current', 'next', 'confirm'] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                            {{ current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' }[field]}
                          </label>
                          <div className="relative">
                            <input
                              type={showPw ? 'text' : 'password'}
                              value={passwordForm[field]}
                              onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                              className="w-full bg-slate-950/60 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl px-4 py-3 text-slate-100 text-sm transition outline-none"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="text-[10px] font-mono uppercase font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1.5"
                      >
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPw ? 'Hide' : 'Show'} passwords
                      </button>
                    </div>
                    <div className="pt-2">
                      <Magnetic>
                        <button
                          onClick={handleSavePassword}
                          className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-lg shadow-primary/20 border border-primary/20"
                        >
                          <Shield className="w-4 h-4" /> Update Password
                        </button>
                      </Magnetic>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-5 border-glow-primary">
                <h2 className="font-bold text-base flex items-center gap-2 text-slate-250 font-display">
                  <Bell className="w-5 h-5 text-primary" /> Notification Triggers
                </h2>
                <div className="space-y-4">
                  {([
                    { key: 'interview_complete', label: 'Interview Completed', desc: 'When an AI mock evaluation finishes rendering report details' },
                    { key: 'resume_analyzed', label: 'Resume Analyzed', desc: 'When an ATS check compiler finishes analysis updates' },
                    { key: 'weekly_report', label: 'Weekly Progress Digest', desc: 'Sunday summaries of review performance indices' },
                  ] as const).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          setNotifications((v) => ({ ...v, [key]: !v[key] }))
                          toast.success('Preference saved')
                        }}
                        className={clsx(
                          'relative w-11 h-6 rounded-full transition-colors border',
                          notifications[key] ? 'bg-primary border-primary/20 shadow-glow-primary/5' : 'bg-slate-950 border-white/5'
                        )}
                      >
                        <span
                          className={clsx(
                            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform',
                            notifications[key] ? 'translate-x-5 bg-white' : 'translate-x-0 bg-slate-500'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 space-y-5 shadow-lg shadow-red-500/5">
                <h2 className="font-bold text-base flex items-center gap-2 text-red-400 font-display">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>
                {isGuest ? (
                  <div className="space-y-2 text-xs text-slate-400">
                    <p>
                      You are in a <span className="text-amber-400 font-semibold">temporary guest session</span>.
                    </p>
                    <p className="text-slate-500">
                      Guest accounts are automatically purged after 24 hours. No manual account deletion is required.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Permanently delete your profile workspace account and clean all recorded analytics, resumes, and logs. This process is irreversible.
                    </p>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                        Type <span className="font-mono text-red-400 font-black">DELETE</span> below to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="w-full bg-red-500/5 border border-red-500/20 focus:border-red-500/50 rounded-xl px-4 py-3 text-slate-100 text-sm transition outline-none placeholder:text-slate-650"
                        placeholder="DELETE"
                      />
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Account Registry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
