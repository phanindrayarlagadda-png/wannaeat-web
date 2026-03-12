import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Bell, Search, MapPin } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { selectCartItemCount } from '../../redux/slices/cartSlice'

export default function Header() {
  const navigate = useNavigate()
  const cartCount = useSelector(selectCartItemCount)
  const unreadCount = useSelector((state: RootState) => state.notification.unreadCount)
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-2xl font-bold text-primary">Wanna</span>
          <span className="text-2xl font-bold text-gray-900">Eat</span>
        </Link>

        {/* Location (hidden on small mobile) */}
        <button
          className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
          onClick={() => navigate('/account/addresses')}
        >
          <MapPin size={16} className="text-primary" />
          <span className="max-w-[140px] truncate">
            {user ? 'Deliver to me' : 'Set location'}
          </span>
        </button>

        {/* Search bar - desktop */}
        <button
          className="hidden md:flex flex-1 max-w-sm items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 transition-colors"
          onClick={() => navigate('/search')}
        >
          <Search size={16} />
          <span>Search chefs or dishes...</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications */}
              <button
                className="relative p-2 text-gray-600 hover:text-primary transition-colors"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                className="relative p-2 text-gray-600 hover:text-primary transition-colors"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>

              {/* Avatar */}
              <button onClick={() => navigate('/account')} className="shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-5">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
