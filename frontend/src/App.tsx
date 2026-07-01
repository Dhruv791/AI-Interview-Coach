import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import { ThemeProvider } from './components/ThemeProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ResumePage from './pages/ResumePage'
import InterviewSetupPage from './pages/InterviewSetupPage'
import InterviewSessionPage from './pages/InterviewSessionPage'
import InterviewFeedbackPage from './pages/InterviewFeedbackPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const { hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [])

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — all wrapped in a single Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"                  element={<DashboardPage />} />
            <Route path="/resume"                     element={<ResumePage />} />
            <Route path="/interviews/setup"           element={<InterviewSetupPage />} />
            <Route path="/interviews/:id"             element={<InterviewSessionPage />} />
            <Route path="/interviews/:id/feedback"    element={<InterviewFeedbackPage />} />
            <Route path="/analytics"                  element={<AnalyticsPage />} />
            <Route path="/settings"                   element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global toast notification system */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f1f5f9',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </ThemeProvider>
  )
}

export default App
