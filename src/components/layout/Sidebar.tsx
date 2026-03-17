import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Tag, Wallet, ClipboardList, User, MapPin,
  CreditCard, Settings, Star, MessageCircle, Bell, LogOut, ChevronRight
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { RootState } from '../../redux/store'
import toast from 'react-hot-toast'

const mainNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/offers', icon: Tag, label: 'Offers' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/orders', icon: ClipboardList, label: 'My Orders' },
]

const accountNav = [
  { to: '/account/profile', icon: User, label: 'Profile' },
  { to: '/account/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/account/payment-methods', icon: CreditCard, label: 'Payment Methods' },
  { to: '/account/premium', icon: Star, label: 'Premium' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/account/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="card p-4 space-y-6">
      {/* User info */}
      {user && (
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          {user.profileImage ? (
            <img src={user.profileImage} alt={(user as any).firstName || user.name || 'Profile'} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {((user as any).firstName || user.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {`${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="space-y-1">
        {mainNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Account nav */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Account</p>
        <nav className="space-y-1">
          {accountNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  )
}
