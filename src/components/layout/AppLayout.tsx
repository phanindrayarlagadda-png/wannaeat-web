import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header (visible on all sizes) */}
      <Header />

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Sidebar: visible only on lg+ */}
        <aside className="hidden lg:block w-64 shrink-0 pt-6 pr-4">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-6 pt-4 px-4 lg:px-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav: visible only on mobile/tablet */}
      <BottomNav />
    </div>
  )
}
