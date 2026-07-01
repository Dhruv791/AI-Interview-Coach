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
        'fixed top-0 right-0 z-30 h-14 bg-slate-950/80 backdrop-blur-sm border-b border-white/8 flex items-center px-4 gap-3 transition-all duration-300',
        sidebarCollapsed ? 'md:left-16' : 'md:left-56',
        'left-0'
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="flex items-center gap-0.5 bg-slate-900 border border-white/8 rounded-lg p-1">
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
              'w-7 h-7 rounded-md flex items-center justify-center transition-all',
              theme === key
                ? 'bg-indigo-600 text-white shadow-sm'
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
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl border border-white/8 bg-slate-900 hover:bg-slate-800 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <span className="hidden sm:block text-xs text-slate-300 font-medium max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className={clsx('w-3.5 h-3.5 text-slate-500 transition-transform', avatarOpen && 'rotate-180')} />
        </button>

        {avatarOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/8 rounded-xl shadow-xl py-1 z-50">
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { navigate('/settings'); setAvatarOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/6 hover:text-white transition"
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => { navigate('/settings'); setAvatarOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-white/6 hover:text-white transition"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <div className="border-t border-white/8 mt-1 pt-1">
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
