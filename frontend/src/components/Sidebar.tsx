import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Mic2, FileText, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Sparkles, X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/interviews/setup',  icon: Mic2,            label: 'Mock Interviews' },
  { to: '/resume',            icon: FileText,        label: 'Resume Analyzer' },
  { to: '/analytics',         icon: BarChart3,       label: 'Analytics' },
  { to: '/settings',          icon: Settings,        label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-base tracking-tight font-display transition-all">
            InterviewAI
          </span>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex ml-auto p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-primary/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgb(var(--primary))]" />
                )}
                <Icon className={clsx('w-5 h-5 shrink-0 transition-transform group-hover:scale-105', isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200')} />
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-150 group"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!collapsed && <span className="text-sm font-medium tracking-wide">Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden md:flex flex-col h-screen bg-slate-950/60 backdrop-blur-md border-r border-white/5 fixed left-0 top-0 z-40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-slate-950/90 backdrop-blur-lg border-r border-white/5 z-50 md:hidden transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
