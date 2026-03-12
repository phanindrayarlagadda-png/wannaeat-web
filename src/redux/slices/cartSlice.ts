import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CartItem } from '../../types'

interface CartState {
  items: CartItem[]
  chefId: string | null
  scheduledDate?: string
}

const initialState: CartState = {
  items: [],
  chefId: null,
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
    },
    setScheduledDate(state, action: PayloadAction<string | undefined>) {
      state.scheduledDate = action.payload
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart, setScheduledDate } = cartSlice.actions

// Selectors
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

export default cartSlice.reducer
