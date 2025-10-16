import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import { User, Shield, Palette, LogOut } from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuthStore()

  // Initialize from localStorage or default to dark
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true // Default to dark mode
  })

  // Apply theme whenever darkMode changes
  useEffect(() => {
    const html = document.documentElement

    if (darkMode) {
      html.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.add('light')
      localStorage.setItem('theme', 'light')
    }

    // Comprehensive debugging
    const root = document.getElementById('root')
    const bodyStyles = window.getComputedStyle(document.body)
    const rootStyles = root ? window.getComputedStyle(root) : null
    const htmlStyles = window.getComputedStyle(html)

    console.group('🎨 Theme Debug')
    console.log('Mode:', darkMode ? 'DARK' : 'LIGHT')
    console.log('HTML classes:', html.classList.toString())
    console.log('CSS Variables:', {
      '--bg-background': htmlStyles.getPropertyValue('--bg-background'),
      '--bg-surface': htmlStyles.getPropertyValue('--bg-surface'),
      '--text-primary': htmlStyles.getPropertyValue('--text-primary')
    })
    console.log('Body background:', bodyStyles.backgroundColor)
    console.log('Body color:', bodyStyles.color)
    if (rootStyles) {
      console.log('#root background:', rootStyles.backgroundColor)
      console.log('#root color:', rootStyles.color)
    }
    console.groupEnd()
  }, [darkMode])

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      
      {/* Profile Section */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
            <input 
              type="text" 
              value={user?.username || ''} 
              disabled 
              className="w-full px-3 py-2 bg-surface border border-surface-light rounded-lg text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="w-full px-3 py-2 bg-surface border border-surface-light rounded-lg text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">AI Token Usage</label>
            <div className="text-text-secondary">
              {user?.tokensUsed || 0} / {user?.dailyTokenLimit || 10000} tokens used today
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <div className="flex items-center mb-4">
          <Palette className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-text-primary">Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-medium">Dark Mode</p>
              <p className="text-sm text-text-secondary">Toggle dark theme appearance</p>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className="relative inline-flex items-center cursor-pointer"
              type="button"
            >
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleToggleDarkMode}
                className="sr-only peer"
                aria-label="Toggle dark mode"
              />
              <div className="w-11 h-6 bg-surface-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </button>
          </div>
        </div>
      </div>


      {/* Account Actions */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold text-text-primary">Account</h2>
        </div>
        <div className="space-y-4">
          <Button 
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}