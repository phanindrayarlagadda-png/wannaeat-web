import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Search, X } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getConversations } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { buildImageUrl } from '../../utils/imageUrl'
import { Conversation } from '../../types'

dayjs.extend(relativeTime)

export default function MyChat() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchMode, setSearchMode] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Filter conversations by chef name (case insensitive)
  const filtered = useMemo(() => {
    if (!searchText.trim()) return conversations
    const q = searchText.toLowerCase()
    return conversations.filter(c =>
      c.participantName?.toLowerCase().includes(q)
    )
  }, [conversations, searchText])

  // Sort by latest message first
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    ),
    [filtered]
  )

  return (
    <div>
      {/* Header with search toggle */}
      {searchMode ? (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setSearchMode(false); setSearchText('') }} className="p-2 text-gray-500">
            <X size={20} />
          </button>
          <input
            autoFocus
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by chef name..."
            className="flex-1 text-sm border-none outline-none bg-gray-100 rounded-full px-4 py-2.5"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <PageHeader title="Messages" showBack={false} />
          <button
            onClick={() => setSearchMode(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full -mt-4"
          >
            <Search size={20} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={56} strokeWidth={1} />}
          title={searchText ? 'No results found' : 'No conversations yet'}
          description={searchText ? 'Try a different search' : 'Messages from chefs will appear here'}
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {sorted.map(conv => (
            <button
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
            >
              {/* Avatar */}
              {conv.participantImage ? (
                <img
                  src={buildImageUrl(conv.participantImage)}
                  alt={conv.participantName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                  {conv.participantName?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${
                    conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                  }`}>
                    {conv.participantName}
                  </p>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {dayjs(conv.lastMessageAt).fromNow()}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${
                    conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                  }`}>
                    {conv.lastMessage && conv.lastMessage.length > 25
                      ? conv.lastMessage.substring(0, 25) + '...'
                      : conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-primary text-white text-[10px] font-bold rounded-full h-[17px] min-w-[17px] flex items-center justify-center px-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
