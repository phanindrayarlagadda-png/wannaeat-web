import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import AppLayout from '../components/layout/AppLayout'

// Auth pages
import Login from '../pages/auth/Login'
import SignUp from '../pages/auth/SignUp'
import OTP from '../pages/auth/OTP'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'

// Main pages
import Home from '../pages/home/Home'
import Search from '../pages/home/Search'
import Offers from '../pages/offers/Offers'
import Wallet from '../pages/wallet/Wallet'
import MyOrders from '../pages/orders/MyOrders'

// Chef pages
import PopularChefs from '../pages/chef/PopularChefs'
import PopularDishes from '../pages/chef/PopularDishes'
import AvailableToday from '../pages/chef/AvailableToday'
import ChefProfile from '../pages/chef/ChefProfile'

// Cart + Checkout
import Cart from '../pages/cart/Cart'
import CartDetails from '../pages/cart/CartDetails'
import Checkout from '../pages/checkout/Checkout'
import OrderSummary from '../pages/checkout/OrderSummary'
import OrderPlaced from '../pages/checkout/OrderPlaced'

// Orders
import OrderDetails from '../pages/orders/OrderDetails'
import CancelOrder from '../pages/orders/CancelOrder'
import RateOrder from '../pages/orders/RateOrder'
import ReportIssue from '../pages/orders/ReportIssue'

// Account
import MyAccount from '../pages/account/MyAccount'
import Profile from '../pages/account/Profile'
import AddressBook from '../pages/account/AddressBook'
import PaymentMethods from '../pages/account/PaymentMethods'
import Settings from '../pages/account/Settings'
import Services from '../pages/account/Services'
import PremiumMembership from '../pages/account/PremiumMembership'

// Chat
import MyChat from '../pages/chat/MyChat'
import ChatDetails from '../pages/chat/ChatDetails'

// Favorites
import Favorites from '../pages/favorites/Favorites'

// Notifications
import Notifications from '../pages/notifications/Notifications'

// CMS
import Privacy from '../pages/cms/Privacy'
import Terms from '../pages/cms/Terms'
import CMSPage from '../pages/cms/CMSPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/otp" element={<GuestRoute><OTP /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

      {/* Public CMS routes */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cms/:slug" element={<CMSPage />} />

      {/* Protected routes inside AppLayout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/orders" element={<MyOrders />} />

        {/* Chef */}
        <Route path="/chefs" element={<PopularChefs />} />
        <Route path="/dishes" element={<PopularDishes />} />
        <Route path="/available-today" element={<AvailableToday />} />
        <Route path="/chef/:chefId" element={<ChefProfile />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/cart/details" element={<CartDetails />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/summary" element={<OrderSummary />} />
        <Route path="/order-placed/:orderId" element={<OrderPlaced />} />

        {/* Orders */}
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/orders/:orderId/cancel" element={<CancelOrder />} />
        <Route path="/orders/:orderId/rate" element={<RateOrder />} />
        <Route path="/orders/:orderId/report" element={<ReportIssue />} />

        {/* Account */}
        <Route path="/account" element={<MyAccount />} />
        <Route path="/account/profile" element={<Profile />} />
        <Route path="/account/addresses" element={<AddressBook />} />
        <Route path="/account/payment-methods" element={<PaymentMethods />} />
        <Route path="/account/settings" element={<Settings />} />
        <Route path="/account/services" element={<Services />} />
        <Route path="/account/premium" element={<PremiumMembership />} />

        {/* Settings CMS pages */}
        <Route path="/settings/faq" element={<CMSPage />} />
        <Route path="/settings/contact" element={<CMSPage />} />
        <Route path="/settings/terms" element={<CMSPage />} />
        <Route path="/settings/privacy" element={<CMSPage />} />
        <Route path="/settings/about" element={<CMSPage />} />

        {/* Favorites */}
        <Route path="/favorites" element={<Favorites />} />

        {/* Chat */}
        <Route path="/chat" element={<MyChat />} />
        <Route path="/chat/:conversationId" element={<ChatDetails />} />

        {/* Notifications */}
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
