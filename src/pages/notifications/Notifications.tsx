import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Package, Tag, MessageCircle, Info } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useDispatch, useSelector } from 'react-redux'
import { getNotifications, markNotificationsRead } from '../../helper/api'
import { setNotifications, markAllRead } from '../../redux/slices/notificationSlice'
import { RootState } from '../../redux/store'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { useState } from 'react'

dayjs.extend(relativeTime)

const TYPE_ICON: Record<string, { icon: typeof Bell; color: string }> = {
  order: { icon: Package, color: 'bg-blue-50 text-blue-500' },
  promo: { icon: Tag, color: 'bg-yellow-50 text-yellow-500' },
  chat: { icon: MessageCircle, color: 'bg-green-50 text-green-500' },
  general: { icon: Info, color: 'bg-gray-50 text-gray-500' },
}

export default function Notifications() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const notifications = useSelector((state: RootState) => state.notification.notifications)
  const [loading, setLoading] = useState(true)

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

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
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
          unreadCount > 0 ? (
            <button onClick={handleMarkAllRead} className="text-sm text-primary hover:underline font-medium">
              Mark all read
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={56} strokeWidth={1} />}
          title="No notifications"
          description="You're all caught up! New notifications will appear here."
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map(notif => {
            const { icon: Icon, color } = TYPE_ICON[notif.type] || TYPE_ICON.general
            return (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notif.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium line-clamp-1 ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">{dayjs(notif.createdAt).fromNow()}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
