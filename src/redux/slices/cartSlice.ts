import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CartItem } from '../../types'

interface CartState {
  items: CartItem[]
  chefId: string | null
  scheduledDate?: string
  /** Server cart count — updated after add/remove API calls */
  serverCartCount: number
  /** Full server cart data (from getCartDetails API) */
  serverCart: any | null
}

const initialState: CartState = {
  items: [],
  chefId: null,
  serverCartCount: 0,
  serverCart: null,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(i => i.dishId === action.payload.dishId)
      if (existing) {
        existing.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
        if (!state.chefId) state.chefId = action.payload.chefId
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.dishId !== action.payload)
      if (state.items.length === 0) state.chefId = null
    },
    updateQuantity(state, action: PayloadAction<{ dishId: string; quantity: number }>) {
      const item = state.items.find(i => i.dishId === action.payload.dishId)
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(i => i.dishId !== action.payload.dishId)
          if (state.items.length === 0) state.chefId = null
        } else {
          item.quantity = action.payload.quantity
        }
      }
    },
    clearCart(state) {
      state.items = []
      state.chefId = null
      state.scheduledDate = undefined
      state.serverCartCount = 0
      state.serverCart = null
    },
    setScheduledDate(state, action: PayloadAction<string | undefined>) {
      state.scheduledDate = action.payload
    },
    /** Increment cart count after successful addToCart API call */
    incrementCartCount(state) {
      state.serverCartCount += 1
    },
    /** Set cart count from server response */
    setCartCount(state, action: PayloadAction<number>) {
      state.serverCartCount = action.payload
    },
    /** Store full server cart data from getCartDetails API */
    setServerCart(state, action: PayloadAction<any>) {
      state.serverCart = action.payload
      // Also update serverCartCount from dish data
      const dishData = action.payload?.cartDataFinal?.[0]?.dishData || []
      state.serverCartCount = dishData.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
    },
  },
})

export const {
  addItem, removeItem, updateQuantity, clearCart, setScheduledDate,
  incrementCartCount, setCartCount, setServerCart,
} = cartSlice.actions

// Selectors
export const selectCartItemCount = (state: { cart: CartState }) =>
  // Prefer server cart count, fallback to local items count
  state.cart.serverCartCount || state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

export default cartSlice.reducer
