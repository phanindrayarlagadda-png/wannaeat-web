// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  // API returns firstName/lastName separately; name is a computed convenience field
  name?: string
  firstName?: string
  lastName?: string
  fullName?: string
  email: string
  phone?: string
  phoneNumber?: string
  profileImage?: string
  isPremium?: boolean
  membership?: string
  walletBalance?: number
}

// ─── Chef ────────────────────────────────────────────────────────────────────
export interface Chef {
  id: string
  name: string
  profileImage?: string
  coverImage?: string
  rating: number
  reviewCount: number
  cuisine: string[]
  bio?: string
  isAvailableToday: boolean
  deliveryTime?: string
  minimumOrder?: number
}

// ─── Dish ────────────────────────────────────────────────────────────────────
export interface Dish {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  chefId: string
  chefName?: string
  category?: string
  mealTime?: 'breakfast' | 'lunch' | 'dinner'
  isVeg?: boolean
  rating?: number
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string
  dishId: string
  dishName: string
  chefId: string
  chefName?: string
  price: number
  quantity: number
  image?: string
  note?: string
}

export interface CartSummary {
  subtotal: number
  deliveryFee: number
  tip: number
  discount: number
  total: number
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  items: CartItem[]
  summary: CartSummary
  address: Address
  chefId: string
  chefName?: string
  createdAt: string
  deliveredAt?: string
  scheduledAt?: string
  rating?: number
}

// ─── Address ─────────────────────────────────────────────────────────────────
export interface Address {
  id: string
  label?: string
  street: string
  address2?: string
  placeName?: string
  city: string
  state: string
  zipCode: string
  country?: string
  isDefault?: boolean
  lat?: number
  lng?: number
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface PaymentCard {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}

// ─── Notification ────────────────────────────────────────────────────────────
export interface Notification {
  id: string
  title: string
  body: string
  type: 'order' | 'promo' | 'chat' | 'general'
  isRead: boolean
  createdAt: string
  data?: Record<string, string>
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  text: string
  createdAt: string
  isRead: boolean
}

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantImage?: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

// ─── Offer ───────────────────────────────────────────────────────────────────
export interface Offer {
  id: string
  title: string
  description: string
  code?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  expiresAt?: string
  image?: string
}

// ─── Wallet ──────────────────────────────────────────────────────────────────
export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  createdAt: string
}

// ─── API Response ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// ─── Redux State ─────────────────────────────────────────────────────────────
export interface RootState {
  auth: AuthState
  cart: CartState
  notification: NotificationState
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export interface CartState {
  items: CartItem[]
  chefId: string | null
  scheduledDate?: string
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}
