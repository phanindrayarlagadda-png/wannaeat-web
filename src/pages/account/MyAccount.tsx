import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  User, MapPin, CreditCard, Settings, MessageCircle,
  Bell, LogOut, ChevronRight, ClipboardList, Heart, Utensils
} from 'lucide-react'
import toast from 'react-hot-toast'
import { RootState } from '../../redux/store'
import { logout } from '../../redux/slices/authSlice'
import { buildImageUrl } from '../../utils/imageUrl'

const MENU_ITEMS = [
  { icon: User, label: 'Profile', to: '/account/profile', color: 'text-blue-500' },
  { icon: Utensils, label: 'Services', to: '/account/services', color: 'text-indigo-500' },
  { icon: MapPin, label: 'Address Book', to: '/account/addresses', color: 'text-green-500' },
  { icon: CreditCard, label: 'Payment', to: '/account/payment-methods', color: 'text-purple-500' },
  { icon: Bell, label: 'Notifications', to: '/notifications', color: 'text-orange-500' },
  { icon: Settings, label: 'Settings', to: '/account/settings', color: 'text-gray-500' },
]

export default function MyAccount() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const anyUser = user as any

  // Resolve display name from API fields (firstName/lastName) or fallback
  const displayName = anyUser
    ? (`${anyUser.firstName || ''} ${anyUser.lastName || ''}`.trim() || anyUser.name || anyUser.fullName || '')
    : ''
  const displayPhone = anyUser?.phoneNumber || anyUser?.phone || ''
  const isPremium = anyUser?.membership === 'premium' || anyUser?.isPremium

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="card p-5 flex items-center gap-4">
        <button onClick={() => navigate('/account/profile')} className="relative flex-shrink-0">
          {user?.profileImage ? (
            <img src={buildImageUrl(user.profileImage)} alt={displayName || 'Profile'} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          {isPremium && (
            <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-full text-yellow-900">
              PRO
            </span>
          )}
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{displayName || 'My Account'}</h2>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {displayPhone && <p className="text-sm text-gray-500">{displayPhone}</p>}
          {anyUser?.walletBalance !== undefined && (
            <p className="text-sm font-semibold text-primary mt-1">
              Wallet: ${(anyUser.walletBalance || 0).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Quick Action Cards - matching mobile's Orders, Favorites, Messages */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Orders</span>
        </button>
        <button
          onClick={() => navigate('/favorites')}
          className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Heart size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Favorites</span>
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow relative"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <MessageCircle size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">Messages</span>
        </button>
      </div>

      {/* Menu items */}
      <div className="card divide-y divide-gray-100">
        {MENU_ITEMS.map(({ icon: Icon, label, to, color }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <div className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="flex-1 font-medium text-gray-900">{label}</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full card p-4 flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
          <LogOut size={20} />
        </div>
        <span className="font-semibold">Sign Out</span>
      </button>

      <p className="text-center text-xs text-gray-400 pb-4">WannaEat v1.0.0</p>
    </div>
  )
}
