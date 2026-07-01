import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import clsx from 'clsx'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main area: shifts right based on sidebar width */}
      <div
        className={clsx(
          'flex-1 flex flex-col transition-all duration-300',
          collapsed ? 'md:ml-16' : 'md:ml-56'
        )}
      >
        <Topbar sidebarCollapsed={collapsed} onMobileMenuClick={() => setMobileOpen(true)} />

        {/* Page content — below the fixed topbar */}
        <main className="flex-1 pt-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs text-slate-600 border-t border-white/5">
          InterviewAI &nbsp;·&nbsp; v1.0 &nbsp;·&nbsp; Made with React + FastAPI + Gemini
        </footer>
      </div>
    </div>
  )
}
