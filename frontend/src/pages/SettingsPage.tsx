import React, { useState } from 'react'
import {
  User, Lock, Bell, Trash2, Shield, Sun, Moon, Monitor, Save,
  Eye, EyeOff, AlertTriangle, Check
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../components/ThemeProvider'
import { toast } from 'sonner'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'profile',       icon: User,       label: 'Profile' },
  { id: 'theme',         icon: Sun,        label: 'Theme' },
  { id: 'password',      icon: Lock,       label: 'Password' },
  { id: 'notifications', icon: Bell,       label: 'Notifications' },
  { id: 'danger',        icon: Trash2,     label: 'Danger Zone' },
]

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, preferences, and security</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Section Nav */}
        <aside className="md:w-48 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full',
                  activeSection === id
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
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

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" /> Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition placeholder:text-slate-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-[1.02] active:scale-100"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}

          {/* Theme */}
          {activeSection === 'theme' && (
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sun className="w-5 h-5 text-indigo-400" /> Theme
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'light',  icon: Sun,     label: 'Light',  desc: 'Bright interface' },
                  { key: 'dark',   icon: Moon,    label: 'Dark',   desc: 'Easy on the eyes' },
                  { key: 'system', icon: Monitor, label: 'System', desc: 'Follows OS setting' },
                ] as const).map(({ key, icon: Icon, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => { setTheme(key); toast.success(`Theme set to ${label}`) }}
                    className={clsx(
                      'flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-center',
                      theme === key
                        ? 'border-indigo-500/50 bg-indigo-600/10 text-indigo-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-white/4'
                    )}
                  >
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', theme === key ? 'bg-indigo-600/20' : 'bg-slate-800')}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{desc}</p>
                    </div>
                    {theme === key && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Password */}
          {activeSection === 'password' && (
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" /> Change Password
              </h2>
              <div className="space-y-4">
                {(['current', 'next', 'confirm'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                      {{ current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' }[field]}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={passwordForm[field]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition placeholder:text-slate-500"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowPw((v) => !v)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPw ? 'Hide' : 'Show'} passwords
                </button>
              </div>
              <button
                onClick={handleSavePassword}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-100"
              >
                <Shield className="w-4 h-4" /> Update Password
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" /> Notifications
              </h2>
              <div className="space-y-4">
                {([
                  { key: 'interview_complete', label: 'Interview Completed', desc: 'When an AI evaluation finishes' },
                  { key: 'resume_analyzed',    label: 'Resume Analyzed',     desc: 'When ATS analysis is ready' },
                  { key: 'weekly_report',      label: 'Weekly Progress',     desc: 'Sunday summary email' },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotifications((v) => ({ ...v, [key]: !v[key] }))
                        toast.success('Preference saved')
                      }}
                      className={clsx(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifications[key] ? 'bg-indigo-600' : 'bg-slate-700'
                      )}
                    >
                      <span
                        className={clsx(
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                          notifications[key] ? 'translate-x-5' : 'translate-x-0'
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
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" /> Danger Zone
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-slate-400">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                    Type <span className="font-mono text-red-400 font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full bg-red-500/5 border border-red-500/30 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition placeholder:text-slate-600"
                    placeholder="DELETE"
                  />
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-100"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
