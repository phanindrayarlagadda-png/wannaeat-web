import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { getOrders } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Order, OrderStatus } from '../../types'

type Tab = 'active' | 'past'

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  preparing: 'bg-orange-50 text-orange-700',
  out_for_delivery: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function MyOrders() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('active')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getOrders({ type: tab })
      .then(res => setOrders(res.data?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div>
      <PageHeader title="My Orders" showBack={false} />

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'past'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package size={56} strokeWidth={1} />}
          title="No orders yet"
          description={tab === 'active' ? "You don't have any active orders" : "Your order history is empty"}
          actionLabel="Order Now"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="card p-4 w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{order.chefName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {dayjs(order.createdAt).format('MMM D, YYYY · h:mm A')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                  <p className="font-bold text-gray-900">${order.summary?.total?.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                </p>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
