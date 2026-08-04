import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Monitor, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTheme } from './ThemeProvider'
import clsx from 'clsx'

interface TopbarProps {
  sidebarCollapsed: boolean
  onMobileMenuClick: () => void
}

export function Topbar({ sidebarCollapsed, onMobileMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const displayName = user?.full_name ?? user?.email ?? 'User'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-30 h-14 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center px-4 gap-3 transition-all duration-300',
        sidebarCollapsed ? 'md:left-16' : 'md:left-56',
        'left-0'
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="flex items-center gap-0.5 bg-slate-900/60 border border-white/5 rounded-xl p-1">
        {([
          { key: 'light', icon: Sun,     title: 'Light' },
          { key: 'dark',  icon: Moon,    title: 'Dark' },
          { key: 'system',icon: Monitor, title: 'System' },
        ] as const).map(({ key, icon: Icon, title }) => (
          <button
            key={key}
            title={title}
            onClick={() => setTheme(key)}
            className={clsx(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
              theme === key
                ? 'bg-primary text-white shadow-glow-primary/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Avatar Dropdown */}
      <div className="relative" ref={avatarRef}>
        <button
          onClick={() => setAvatarOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-850 transition-all shadow-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold shadow-glow-primary/25">
            {initials}
          </div>
          <span className="hidden sm:block text-xs text-slate-300 font-medium max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-500 transition-transform duration-200', avatarOpen && 'rotate-180')} />
        </button>

        {avatarOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl shadow-black/50 py-1 z-50 animate-fadeIn">
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { navigate('/settings'); setAvatarOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              <User className="w-4 h-4 text-primary" /> Profile
            </button>
            <button
              onClick={() => { navigate('/settings'); setAvatarOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
            >
              <Settings className="w-4 h-4 text-primary" /> Settings
            </button>
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
