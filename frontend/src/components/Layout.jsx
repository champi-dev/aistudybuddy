import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh-screen bg-background app-content-offset">
      {/* Top Navigation */}
      <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 2xl:p-8 lg:ml-64 w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl 3xl:max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}