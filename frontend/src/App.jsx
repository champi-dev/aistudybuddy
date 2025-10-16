import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DeckDetail from './pages/DeckDetail'
import Study from './pages/Study'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
// import './utils/resetApp' // Auto-clean bad cached data - temporarily disabled

function App() {
  const { token, isLoading, refreshUser } = useAuthStore()

  // Refresh user data (including daily token usage) on app load
  useEffect(() => {
    if (token) {
      refreshUser()
    }
  }, [token, refreshUser])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Landing page */}
        <Route
          path="/"
          element={!token ? <Landing /> : <Navigate to="/dashboard" replace />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!token ? <Register /> : <Navigate to="/dashboard" replace />}
        />

        {/* Protected routes */}
        <Route path="/" element={token ? <Layout /> : <Navigate to="/" replace />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="decks/:id" element={<DeckDetail />} />
          <Route path="study/:deckId" element={<Study />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App