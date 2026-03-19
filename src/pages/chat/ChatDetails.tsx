import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Image as ImageIcon, Search, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import { getMessages, sendMessage } from '../../helper/api'
import { RootState } from '../../redux/store'
import { SOCKET_URL } from '../../services/config'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'
import { buildImageUrl } from '../../utils/imageUrl'
import { ChatMessage } from '../../types'

dayjs.extend(isToday)
dayjs.extend(isYesterday)

function getDateLabel(dateStr: string) {
  const d = dayjs(dateStr)
  if (d.isToday()) return 'Today'
  if (d.isYesterday()) return 'Yesterday'
  const diff = dayjs().diff(d, 'day')
  if (diff < 7) return d.format('dddd')
  return d.format('MMM D, YYYY')
}

// Group messages by date for headers
function groupByDate(messages: ChatMessage[]) {
  const groups: { label: string; date: string; messages: ChatMessage[] }[] = []
  let lastDate = ''
  messages.forEach(msg => {
    const msgDate = dayjs(msg.createdAt).format('YYYY-MM-DD')
    if (msgDate !== lastDate) {
      lastDate = msgDate
      groups.push({ label: getDateLabel(msg.createdAt), date: msgDate, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  })
  return groups
}

export default function ChatDetails() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchIdx, setSearchIdx] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!conversationId) return

    getMessages(conversationId)
      .then(res => setMessages(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      query: { conversationId },
    })

    socketRef.current.on('newMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })

    return () => { socketRef.current?.disconnect() }
  }, [conversationId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchText.trim()) return []
    const q = searchText.toLowerCase()
    return messages.reduce<number[]>((acc, msg, i) => {
      if (msg.text?.toLowerCase().includes(q)) acc.push(i)
      return acc
    }, [])
  }, [messages, searchText])

  const handleSend = async () => {
    if (!text.trim() || sending || !conversationId) return
    const msgText = text.trim()
    setText('')
    setSending(true)

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUser?.id || '',
      receiverId: '',
      text: msgText,
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true,
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      await sendMessage(conversationId, { text: msgText })
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setText(msgText)
    } finally {
      setSending(false)
    }
  }

  const dateGroups = useMemo(() => groupByDate(messages), [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Header */}
      {searchMode ? (
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-2">
          <button onClick={() => { setSearchMode(false); setSearchText(''); setSearchIdx(0) }} className="p-1 text-gray-500">
            <X size={18} />
          </button>
          <input
            autoFocus
            type="text"
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setSearchIdx(0) }}
            placeholder="Search messages..."
            className="flex-1 text-sm bg-gray-100 rounded-full px-4 py-2 outline-none"
          />
          {searchMatches.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{searchIdx + 1}/{searchMatches.length}</span>
              <button onClick={() => setSearchIdx(Math.max(0, searchIdx - 1))} className="p-1">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => setSearchIdx(Math.min(searchMatches.length - 1, searchIdx + 1))} className="p-1">
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
          <PageHeader title="Chat" />
          <button
            onClick={() => setSearchMode(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full -mt-4"
          >
            <Search size={18} />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-2 px-0">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            No messages yet. Start the conversation!
          </div>
        ) : (
          dateGroups.map(group => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex justify-center my-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {group.label}
                </span>
              </div>

              {/* Messages in this date group */}
              {group.messages.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id
                const isHighlighted = searchMatches.length > 0 && searchMatches[searchIdx] === messages.indexOf(msg)
                const isRestricted = msg.isRestricted

                return (
                  <div key={msg.id} className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {/* Chef avatar (left side for received) */}
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1">
                        <span className="text-xs font-bold text-gray-500">C</span>
                      </div>
                    )}

                    <div className={`max-w-[70%] ${isOwn ? 'mr-2' : 'ml-0'}`}>
                      {/* Images */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-1">
                          {msg.images.map((imgUrl, ii) => (
                            <img
                              key={ii}
                              src={buildImageUrl(imgUrl)}
                              alt="attachment"
                              className="w-[150px] h-[150px] rounded-lg object-cover cursor-pointer"
                            />
                          ))}
                        </div>
                      )}

                      {/* Text bubble */}
                      {(msg.text || isRestricted) && (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isOwn
                            ? 'bg-pink-50 text-gray-900 rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        } ${isHighlighted ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
                          {isRestricted ? (
                            <div className="flex items-center gap-2 text-red-500">
                              <AlertTriangle size={14} />
                              <span className="text-xs font-medium">Restricted Content</span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {msg.isSending && <Spinner size="sm" />}
                            {msg.error && <AlertTriangle size={10} className="text-red-500" />}
                            <span className={`text-[10px] ${isOwn ? 'text-gray-400' : 'text-gray-400'}`}>
                              {dayjs(msg.createdAt).format('h:mm A')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User avatar (right side for sent) */}
                    {isOwn && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-auto mb-1">
                        <span className="text-xs font-bold text-primary">
                          {currentUser?.firstName?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 pt-3 pb-1 bg-gray-50 -mx-4 px-4 lg:-mx-0 lg:px-0 lg:bg-transparent">
        <div className="flex items-end gap-2">
          <button className="p-3 text-gray-400 hover:text-primary transition-colors flex-shrink-0">
            <ImageIcon size={20} />
          </button>
          <textarea
            rows={1}
            value={text}
            onChange={e => {
              if (e.target.value.length <= 1000) setText(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Type Message"
            className="flex-1 resize-none bg-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:bg-gray-100 max-h-32 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-3 bg-gray-200 text-gray-600 rounded-full flex-shrink-0 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        {text.length > 900 && (
          <p className="text-xs text-right text-gray-400 mt-1">{text.length}/1000</p>
        )}
      </div>
    </div>
  )
}
