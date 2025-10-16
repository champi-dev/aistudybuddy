import { useState } from 'react'
import { User, LogOut, Settings, Menu } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import Button from './ui/Button'

export default function TopNav({ onMenuClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <nav className="h-16 bg-surface border-b border-surface-light fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-full">
        {/* Mobile Menu Button + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-text-primary truncate">
            AI Study Buddy
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-1 sm:space-x-2 p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light"
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-light rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-surface-light">
                    <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                    <p className="text-xs text-text-secondary">{user?.email}</p>
                  </div>
                  
                  <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-light flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-light flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}