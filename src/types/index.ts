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
  _id?: string
  name: string
  fullName?: string
  profileImage?: string
  coverImage?: string
  rating: number
  chefRating?: number
  reviewCount: number
  cuisine: string[]
  cuisineOffered?: string
  bio?: string
  isAvailableToday: boolean
  availableToday?: boolean | string
  deliveryTime?: string
  minimumOrder?: number
  deliveryOrPickupWindow?: string
}

// ─── Dish ────────────────────────────────────────────────────────────────────
export interface Dish {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  dishImage?: string
  chefId: string
  chefName?: string
  category?: string
  mealTime?: 'breakfast' | 'lunch' | 'dinner'
  isVeg?: boolean
  rating?: number
  // Mobile-specific fields from getTodayMenuCopy
  menuId?: string
  menuDate?: string
  dishRating?: number
  totalServings?: number
  availableToday?: boolean | string
  orderByDateNew?: string
  deliveryOrPickupWindow?: string
  deliveryWindow?: boolean
  pickupWindow?: boolean
  distance?: string
  chefRating?: number
  serviceable?: boolean
  // Alternate field names from different API responses
  dishId?: string
  dishName?: string
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
  orderId?: string
  status: OrderStatus
  // Mobile uses numeric status: 0=placed, 1=preparing, 2=out_for_delivery, 3=delivered, 4=cancelled, 5=accepted
  statusCode?: number
  orderType?: string
  items: CartItem[]
  // Mobile groups items by chef
  dishData?: any[]
  summary: CartSummary
  address: Address
  userAddress?: string
  chefId: string
  chefName?: string
  createdAt: string
  deliveredAt?: string
  scheduledAt?: string
  deliveryDate?: string
  deliveryOrPickupWindow?: string
  deliveryPreference?: string
  rating?: number
  reviewOrder?: boolean
  orderIssue?: boolean
  cancelButtonHide?: boolean
  // Special instructions
  spiceLevel?: string
  orderInstructions?: string
  driverInstructions?: string
  // Payment details
  subTotal?: number
  smallOrderCharge?: number
  deliveryFees?: number
  driverTip?: number
  couponCode?: string
  couponDiscount?: number
  tax?: number
  totalPrice?: number
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
  images?: string[]
  isRestricted?: boolean
  isSending?: boolean
  error?: boolean
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
