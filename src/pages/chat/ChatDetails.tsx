import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Image } from 'lucide-react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import dayjs from 'dayjs'
import { getMessages, sendMessage } from '../../helper/api'
import { RootState } from '../../redux/store'
import { SOCKET_URL } from '../../services/config'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'
import { ChatMessage } from '../../types'

export default function ChatDetails() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const token = useSelector((state: RootState) => state.auth.token)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!conversationId) return

    // Load history
    getMessages(conversationId)
      .then(res => setMessages(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      query: { conversationId },
    })

    socketRef.current.on('newMessage', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [conversationId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending || !conversationId) return
    const msgText = text.trim()
    setText('')
    setSending(true)

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUser?.id || '',
      receiverId: '',
      text: msgText,
      createdAt: new Date().toISOString(),
      isRead: false,
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      await sendMessage(conversationId, { text: msgText })
    } catch {
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setText(msgText)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      <PageHeader title="Chat" />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 px-0">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === currentUser?.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                    {dayjs(msg.createdAt).format('h:mm A')}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 pt-3 pb-1">
        <div className="flex items-end gap-2">
          <button className="p-3 text-gray-400 hover:text-primary transition-colors flex-shrink-0">
            <Image size={20} />
          </button>
          <textarea
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="p-3 bg-primary text-white rounded-full flex-shrink-0 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
