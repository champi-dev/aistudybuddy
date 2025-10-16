import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Settings,
  Zap,
  Plus
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import CreateDeckModal from './CreateDeckModal'

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings }
  ]

  const tokensUsed = user?.tokensUsed || 0
  const tokenLimit = user?.dailyTokenLimit || 10000
  const tokenPercentage = Math.min((tokensUsed / tokenLimit) * 100, 100)

  const handleNavClick = () => {
    // Close mobile menu when navigation item is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside className={`
      fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-surface border-r border-surface-light
      transition-transform duration-300 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
          
          {/* Quick Actions */}
          <div className="pt-4 mt-4 border-t border-surface-light">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
              Quick Actions
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-light">
              <Plus className="h-5 w-5 mr-3" />
              Create Deck
            </button>
          </div>
        </nav>

        {/* Token Usage Widget */}
        <div className="p-4 border-t border-surface-light">
          <div className="bg-background rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-secondary mr-1" />
                <span className="text-xs font-medium text-text-primary">AI Tokens</span>
              </div>
              <span className="text-xs text-text-secondary">
                {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-surface-light rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  tokenPercentage > 90 
                    ? 'bg-error' 
                    : tokenPercentage > 70 
                    ? 'bg-warning' 
                    : 'bg-success'
                }`}
                style={{ width: `${tokenPercentage}%` }}
              />
            </div>
            
            <p className="text-xs text-text-secondary mt-1">
              {tokenPercentage > 90 
                ? 'Almost at daily limit' 
                : `${Math.round(100 - tokenPercentage)}% remaining`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Create Deck Modal */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </aside>
  )
}