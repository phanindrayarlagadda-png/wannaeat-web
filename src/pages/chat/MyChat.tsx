import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getConversations } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Conversation } from '../../types'

dayjs.extend(relativeTime)

export default function MyChat() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Messages" showBack={false} />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={56} strokeWidth={1} />}
          title="No conversations yet"
          description="Messages from chefs will appear here"
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              {conv.participantImage ? (
                <img
                  src={conv.participantImage}
                  alt={conv.participantName}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {conv.participantName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 truncate">{conv.participantName}</p>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {dayjs(conv.lastMessageAt).fromNow()}
                  </p>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="ml-2 flex-shrink-0 bg-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
