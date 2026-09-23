import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './components/ThemeProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Route-level code-splitting with React.lazy
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ResumePage = lazy(() => import('./pages/ResumePage'))
const InterviewSetupPage = lazy(() => import('./pages/InterviewSetupPage'))
const InterviewSessionPage = lazy(() => import('./pages/InterviewSessionPage'))
const InterviewFeedbackPage = lazy(() => import('./pages/InterviewFeedbackPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

// Sleek fallback loader for Suspense transitions
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-mono tracking-wider uppercase">Loading module...</p>
      </div>
    </div>
  )
}

function App() {
  const { hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — wrapped in a single Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/interviews/setup" element={<InterviewSetupPage />} />
              <Route path="/interviews/:id" element={<InterviewSessionPage />} />
              <Route path="/interviews/:id/feedback" element={<InterviewFeedbackPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      {/* Global toast notification system */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#12131C',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            color: '#f8fafc',
            borderRadius: '16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
    </ThemeProvider>
  )
}

export default App
