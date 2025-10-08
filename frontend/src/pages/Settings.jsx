import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import Button from '../components/ui/Button'
import { User, Shield, Bell, Palette, LogOut } from 'lucide-react'

export default function Settings() {
  const { user, logout, switchUser } = useAuthStore()
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

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
              className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-secondary"
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
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={darkMode} 
                onChange={(e) => setDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-medium">Study Reminders</p>
              <p className="text-sm text-text-secondary">Get notified to maintain study streaks</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={notifications} 
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
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