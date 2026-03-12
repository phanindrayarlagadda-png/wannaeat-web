import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Clock, CheckCircle, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { getOrderDetails } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import { Order } from '../../types'

const STEPS = ['Order Placed', 'Confirmed', 'Preparing', 'On the Way', 'Delivered']
const STATUS_STEP: Record<string, number> = {
  pending: 0, confirmed: 1, preparing: 2, out_for_delivery: 3, delivered: 4,
}

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    getOrderDetails(orderId)
      .then(res => setOrder(res.data?.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (!order) {
    return (
      <div>
        <PageHeader title="Order Details" />
        <p className="text-center text-gray-500 py-12">Order not found</p>
      </div>
    )
  }

  const currentStep = STATUS_STEP[order.status] ?? 0
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'

  return (
    <div>
      <PageHeader title={`Order #${order.orderNumber}`} />

      <div className="space-y-4">
        {/* Status tracker */}
        {!isCancelled ? (
          <div className="card p-5">
            <div className="relative">
              {/* Progress line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between relative z-10">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      i <= currentStep
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-300 text-gray-300'
                    }`}>
                      {i < currentStep ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className="text-xs text-center text-gray-500 max-w-[52px] leading-tight">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-4 flex items-center gap-3 bg-red-50 border-red-100">
            <XCircle size={24} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Order Cancelled</p>
              <p className="text-sm text-red-500">This order has been cancelled</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card p-4">
          <p className="font-semibold text-gray-900 mb-3">Items</p>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.dishId} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.dishName}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery info */}
        <div className="card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Delivery Address</p>
              <p className="text-sm text-gray-500">{order.address?.street}, {order.address?.city}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ordered At</p>
              <p className="text-sm text-gray-500">{dayjs(order.createdAt).format('MMM D, YYYY · h:mm A')}</p>
            </div>
          </div>
          {order.chefName && (
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Chef</p>
                <p className="text-sm text-gray-500">{order.chefName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bill */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>${order.summary?.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span><span>${order.summary?.deliveryFee?.toFixed(2)}</span>
          </div>
          {order.summary?.tip > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tip</span><span>${order.summary?.tip?.toFixed(2)}</span>
            </div>
          )}
          {order.summary?.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-${order.summary?.discount?.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>${order.summary?.total?.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isDelivered && !order.rating && (
            <Button fullWidth onClick={() => navigate(`/orders/${orderId}/rate`)}>
              Rate Your Order
            </Button>
          )}
          {!isCancelled && !isDelivered && (
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(`/orders/${orderId}/cancel`)}
            >
              Cancel Order
            </Button>
          )}
          {isDelivered && (
            <Button
              variant="ghost"
              fullWidth
              onClick={() => navigate(`/orders/${orderId}/report`)}
            >
              Report Issue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
