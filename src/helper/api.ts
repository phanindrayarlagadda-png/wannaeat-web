import apiClient from '../services/api'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const checkAppVersion = (data: object) =>
  apiClient.post('public/access/checkAppVersion', data)

export const login = (data: { email: string; password: string }) =>
  apiClient.post('public/access/login', data)

export const socialLogin = (data: object) =>
  apiClient.post('public/access/socialLogin', data)

export const signUp = (data: object) =>
  apiClient.post('public/access/register', data)

export const sendOTP = (data: { phone?: string; email?: string }) =>
  apiClient.post('public/access/sendOtp', data)

export const verifyOTP = (data: { otp: string; phone?: string; email?: string }) =>
  apiClient.post('public/access/verifyOtp', data)

export const forgotPassword = (data: { email?: string; phoneNumber?: string; countryCode?: string }) =>
  apiClient.post('public/access/forgotPassword', data)

export const resetPassword = (data: { newPassword: string; confirmPassword: string; phoneNumber: string; countryCode: string }) =>
  apiClient.post('public/access/resetPassword', data)

export const logout = () =>
  apiClient.post('private/access/logout')

// ─── Home ────────────────────────────────────────────────────────────────────
export const getHomeData = (params?: object) =>
  apiClient.get('private/home/getData', { params })

export const getPopularChefs = (params?: object) =>
  apiClient.get('private/home/popularChefs', { params })

export const getPopularDishes = (params?: object) =>
  apiClient.get('private/home/popularDishes', { params })

export const getAvailableToday = (params?: object) =>
  apiClient.get('private/home/availableToday', { params })

export const getBanners = () =>
  apiClient.get('private/banner/list')

export const getNextClosedDate = (data: { date: string; chefId?: string; lat?: number; lng?: number; zipCode?: string }) =>
  apiClient.post('public/homeScreen/getNextClosedDate', data)

// ─── Search ──────────────────────────────────────────────────────────────────
export const search = (params: {
  q: string
  type?: 'chef' | 'dish'
  userLat?: number
  userLng?: number
  zipCode?: string
  cuisines?: string[]
  dietary?: string[]
}) =>
  apiClient.post('private/search/searchByKeyword', {
    keyword: params.q,
    currentUtcDate: new Date().toISOString(),
    cuisines: params.cuisines || [],
    dietary: params.dietary || [],
    ...(params.userLat != null && { userLat: params.userLat }),
    ...(params.userLng != null && { userLng: params.userLng }),
    ...(params.zipCode && { zipCode: params.zipCode }),
  })

// ─── Chef ────────────────────────────────────────────────────────────────────
export const getChefProfile = (chefId: string) =>
  apiClient.get('private/chef/getProfile', { params: { chefId } })

export const getChefMenu = (chefId: string, params?: object) =>
  apiClient.get('private/chef/getMenu', { params: { chefId, ...params } })

export const favouriteChef = (chefId: string) =>
  apiClient.post('private/chef/favourite', { chefId })

// ─── Cart ────────────────────────────────────────────────────────────────────
export const clearCart = () =>
  apiClient.post('private/cart/clearCart')

export const getCheckoutDetails = () =>
  apiClient.get('private/cart/getCheckOutDetails')

export const addToCartScheduled = (data: object) =>
  apiClient.post('private/cart/addToCartScheduled', data)

export const applyCoupon = (data: { code: string }) =>
  apiClient.post('private/v2/cart/applyCoupon', data)

export const removeCoupon = () =>
  apiClient.post('private/cart/removeCoupon')

// ─── Orders ──────────────────────────────────────────────────────────────────
export const placeOrder = (data: object) =>
  apiClient.post('private/cart/placeOrder', data)

export const getOrders = (params?: object) =>
  apiClient.get('private/order/list', { params })

export const getOrderDetails = (orderId: string) =>
  apiClient.post('private/order/details', { orderId })

export const cancelOrder = (orderId: string, data: object) =>
  apiClient.post('private/order/cancel', { orderId, ...data })

export const rateOrder = (orderId: string, data: object) =>
  apiClient.post('private/order/rate', { orderId, ...data })

export const reportIssue = (orderId: string, data: object) =>
  apiClient.post('private/order/report', { orderId, ...data })

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = () =>
  apiClient.get('private/access/getProfile')

export const updateProfile = (data: object) =>
  apiClient.post('private/access/updateProfile', data)

// Note: uploadProfileImage endpoint was removed from the API.
// Profile image upload should be done via updateProfile with base64 or FormData.

// ─── Address ─────────────────────────────────────────────────────────────────
export const getAddresses = () =>
  apiClient.get('private/address/list')

export const addAddress = (data: object) =>
  apiClient.post('private/address/add', data)

export const updateAddress = (addressId: string, data: object) =>
  apiClient.post('private/address/update', { addressId, ...data })

export const deleteAddress = (addressId: string) =>
  apiClient.post('private/address/remove', { addressId })

export const setDefaultAddress = (addressId: string) =>
  apiClient.post('private/address/setDefault', { addressId })

// ─── Payment ─────────────────────────────────────────────────────────────────
export const getPaymentCards = () =>
  apiClient.get('private/card/list')

export const addPaymentCard = (data: object) =>
  apiClient.post('private/card/addPaymentCard', data)

export const deletePaymentCard = (cardId: string) =>
  apiClient.post('private/card/deleteCard', { cardId })

export const setDefaultCard = (cardId: string) =>
  apiClient.post('private/card/setDefault', { cardId })

export const getSetupIntent = () =>
  apiClient.post('private/card/setupIntent')

// ─── Wallet ──────────────────────────────────────────────────────────────────
export const getWallet = () =>
  apiClient.get('private/wallet/getBalance')

export const getWalletTransactions = (params?: object) =>
  apiClient.get('private/wallet/transactions', { params })

// ─── Offers ──────────────────────────────────────────────────────────────────
export const getOffers = () =>
  apiClient.get('private/offer/list')

// ─── Notifications ───────────────────────────────────────────────────────────
export const getNotifications = (params?: object) =>
  apiClient.get('private/notification/list', { params })

export const markNotificationsRead = () =>
  apiClient.post('private/notification/markAllRead')

export const updatePushToken = (data: { token: string }) =>
  apiClient.post('private/notification/updateToken', data)

export const getNotificationSettings = () =>
  apiClient.get('private/notification/settings')

export const updateNotificationSettings = (data: object) =>
  apiClient.post('private/notification/updateSettings', data)

// ─── Chat ────────────────────────────────────────────────────────────────────
export const getConversations = () =>
  apiClient.get('private/chat/conversations')

export const getMessages = (conversationId: string, params?: object) =>
  apiClient.get('private/chat/messages', { params: { conversationId, ...params } })

export const sendMessage = (conversationId: string, data: object) =>
  apiClient.post('private/chat/send', { conversationId, ...data })

// ─── CMS ─────────────────────────────────────────────────────────────────────
export const getCmsPage = (slug: string) =>
  apiClient.get('public/cms/getPage', { params: { slug } })

// ─── Premium ─────────────────────────────────────────────────────────────────
export const getPremiumPlans = () =>
  apiClient.get('private/premium/plans')

export const subscribePremium = (data: object) =>
  apiClient.post('private/premium/subscribe', data)
