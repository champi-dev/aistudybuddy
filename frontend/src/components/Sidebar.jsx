import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react'
import CreateDeckModal from './CreateDeckModal'

export default function Sidebar({ isOpen, onClose }) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings }
  ]

  const handleNavClick = () => {
    // Close mobile menu when navigation item is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside className={`
      app-sidebar fixed left-0 w-64 max-w-[85vw] bg-surface border-r border-surface-light
      transition-transform duration-300 ease-in-out z-50
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
      </div>

      {/* Create Deck Modal */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </aside>
  )
}