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

export const forgotPassword = (data: { email: string }) =>
  apiClient.post('public/access/forgotPassword', data)

export const resetPassword = (data: object) =>
  apiClient.post('public/access/resetPassword', data)

export const logout = () =>
  apiClient.post('private/access/logout')

// ─── Home ────────────────────────────────────────────────────────────────────
export const getHomeData = (params?: object) =>
  apiClient.get('private/home', { params })

export const getPopularChefs = (params?: object) =>
  apiClient.get('private/chef/popular', { params })

export const getPopularDishes = (params?: object) =>
  apiClient.get('private/dish/popular', { params })

export const getAvailableToday = (params?: object) =>
  apiClient.get('private/chef/availableToday', { params })

export const getBanners = () =>
  apiClient.get('private/banner/list')

// ─── Search ──────────────────────────────────────────────────────────────────
export const search = (params: { q: string; type?: 'chef' | 'dish' }) =>
  apiClient.get('private/search', { params })

// ─── Chef ────────────────────────────────────────────────────────────────────
export const getChefProfile = (chefId: string) =>
  apiClient.get(`private/chef/${chefId}`)

export const getChefMenu = (chefId: string, params?: object) =>
  apiClient.get(`private/chef/${chefId}/menu`, { params })

export const favouriteChef = (chefId: string) =>
  apiClient.post(`private/chef/${chefId}/favourite`)

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
  apiClient.get(`private/order/${orderId}`)

export const cancelOrder = (orderId: string, data: object) =>
  apiClient.post(`private/order/${orderId}/cancel`, data)

export const rateOrder = (orderId: string, data: object) =>
  apiClient.post(`private/order/${orderId}/rate`, data)

export const reportIssue = (orderId: string, data: object) =>
  apiClient.post(`private/order/${orderId}/report`, data)

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = () =>
  apiClient.get('private/user/profile')

export const updateProfile = (data: object) =>
  apiClient.put('private/user/profile', data)

export const uploadProfileImage = (formData: FormData) =>
  apiClient.post('private/user/profileImage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ─── Address ─────────────────────────────────────────────────────────────────
export const getAddresses = () =>
  apiClient.get('private/address/list')

export const addAddress = (data: object) =>
  apiClient.post('private/address/add', data)

export const updateAddress = (addressId: string, data: object) =>
  apiClient.put(`private/address/${addressId}`, data)

export const deleteAddress = (addressId: string) =>
  apiClient.delete(`private/address/${addressId}`)

export const setDefaultAddress = (addressId: string) =>
  apiClient.post(`private/address/${addressId}/setDefault`)

// ─── Payment ─────────────────────────────────────────────────────────────────
export const getPaymentCards = () =>
  apiClient.get('private/card/list')

export const addPaymentCard = (data: object) =>
  apiClient.post('private/card/addPaymentCard', data)

export const deletePaymentCard = (cardId: string) =>
  apiClient.delete(`private/card/${cardId}`)

export const setDefaultCard = (cardId: string) =>
  apiClient.post(`private/card/${cardId}/setDefault`)

export const getSetupIntent = () =>
  apiClient.post('private/card/setupIntent')

// ─── Wallet ──────────────────────────────────────────────────────────────────
export const getWallet = () =>
  apiClient.get('private/wallet')

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
  apiClient.put('private/notification/settings', data)

// ─── Chat ────────────────────────────────────────────────────────────────────
export const getConversations = () =>
  apiClient.get('private/chat/conversations')

export const getMessages = (conversationId: string, params?: object) =>
  apiClient.get(`private/chat/${conversationId}/messages`, { params })

export const sendMessage = (conversationId: string, data: object) =>
  apiClient.post(`private/chat/${conversationId}/send`, data)

// ─── CMS ─────────────────────────────────────────────────────────────────────
export const getCmsPage = (slug: string) =>
  apiClient.get(`public/cms/${slug}`)

// ─── Premium ─────────────────────────────────────────────────────────────────
export const getPremiumPlans = () =>
  apiClient.get('private/premium/plans')

export const subscribePremium = (data: object) =>
  apiClient.post('private/premium/subscribe', data)
