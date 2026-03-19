import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Package, Tag, MessageCircle, Info, X } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { getNotifications, markNotificationsRead, clearAllNotifications, clearNotificationById } from '../../helper/api'
import { setNotifications, markAllRead, markRead, removeNotification, clearAll } from '../../redux/slices/notificationSlice'
import { RootState } from '../../redux/store'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'

dayjs.extend(relativeTime)

const TYPE_ICON: Record<string, { icon: typeof Bell; color: string }> = {
  order: { icon: Package, color: 'bg-blue-50 text-blue-500' },
  promo: { icon: Tag, color: 'bg-yellow-50 text-yellow-500' },
  chat: { icon: MessageCircle, color: 'bg-green-50 text-green-500' },
  general: { icon: Info, color: 'bg-gray-50 text-gray-500' },
}

function getRelativeTime(date: string | Date): string {
  const now = dayjs()
  const d = dayjs(date)
  const diffMin = now.diff(d, 'minute')
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  const diffHr = now.diff(d, 'hour')
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  const diffDay = now.diff(d, 'day')
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  const diffWeek = now.diff(d, 'week')
  return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
}

export default function Notifications() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const notifications = useSelector((state: RootState) => state.notification.notifications)
  const [loading, setLoading] = useState(true)
  const [clearModal, setClearModal] = useState(false)

  useEffect(() => {
    getNotifications()
      .then(res => dispatch(setNotifications(res.data?.data || [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dispatch])

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead()
      dispatch(markAllRead())
    } catch {
      dispatch(markAllRead())
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAllNotifications()
      dispatch(clearAll())
      toast.success('All notifications cleared')
    } catch {
      toast.error('Failed to clear notifications')
    }
    setClearModal(false)
  }

  const handleDeleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await clearNotificationById(id)
      dispatch(removeNotification(id))
    } catch {
      dispatch(removeNotification(id))
    }
  }

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    // Mark as read on click
    if (!notif.isRead) {
      dispatch(markRead(notif.id))
    }
    if (notif.type === 'order' && notif.data?.orderId) {
      navigate(`/orders/${notif.data.orderId}`)
    } else if (notif.type === 'chat' && notif.data?.conversationId) {
      navigate(`/chat/${notif.data.conversationId}`)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        rightAction={
          notifications.length > 0 ? (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline font-medium">
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setClearModal(true)}
                className="text-sm text-red-500 font-medium hover:underline"
              >
                Clear All
              </button>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={56} strokeWidth={1} />}
          title="No notifications found!"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {notifications.map(notif => {
            const { icon: Icon, color } = TYPE_ICON[notif.type] || TYPE_ICON.general
            return (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 group ${
                  !notif.isRead ? 'bg-white' : 'bg-gray-50/80'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm line-clamp-1 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 line-clamp-2 ${!notif.isRead ? 'text-gray-600' : 'text-gray-400'}`}>
                    {notif.body}
                  </p>
                </div>

                {/* Unread dot + Delete button */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  <button
                    onClick={e => handleDeleteOne(e, notif.id)}
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete notification"
                  >
                    <X size={14} />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Clear All confirmation modal */}
      <Modal isOpen={clearModal} onClose={() => setClearModal(false)} title="Clear All Notifications?">
        <p className="text-gray-600 mb-6">Are you sure you want to clear all notifications? This action cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setClearModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleClearAll}>Clear All</Button>
        </div>
      </Modal>
    </div>
  )
}
