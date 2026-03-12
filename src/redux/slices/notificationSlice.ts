import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Notification } from '../../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload
      state.unreadCount = action.payload.filter(n => !n.isRead).length
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload)
      if (!action.payload.isRead) state.unreadCount++
    },
    markAllRead(state) {
      state.notifications = state.notifications.map(n => ({ ...n, isRead: true }))
      state.unreadCount = 0
    },
    markRead(state, action: PayloadAction<string>) {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
  },
})

export const { setNotifications, addNotification, markAllRead, markRead } = notificationSlice.actions
export default notificationSlice.reducer
