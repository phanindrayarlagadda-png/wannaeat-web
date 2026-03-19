import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import { getOrderDetails, cancelOrder } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import { buildImageUrl } from '../../utils/imageUrl'
import { Order } from '../../types'
import toast from 'react-hot-toast'

const STATUS_MAP: Record<number, { label: string; color: string; step: number }> = {
  0: { label: 'Order placed', color: 'text-yellow-600', step: 0 },
  1: { label: 'Preparing', color: 'text-orange-600', step: 1 },
  2: { label: 'Out for delivery', color: 'text-purple-600', step: 2 },
  3: { label: 'Delivered', color: 'text-green-600', step: 3 },
  4: { label: 'Canceled', color: 'text-red-600', step: -1 },
  5: { label: 'Accepted by chef', color: 'text-blue-600', step: 1 },
}

const STEPS = ['Order Placed', 'Accepted', 'Preparing', 'On the Way', 'Delivered']

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentExpanded, setPaymentExpanded] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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

  const statusCode = order.statusCode ?? (typeof order.status === 'number' ? order.status : 0)
  const statusInfo = STATUS_MAP[statusCode] || STATUS_MAP[0]
  const isCancelled = statusCode === 4
  const isDelivered = statusCode === 3
  const canCancel = statusCode === 0 && !order.cancelButtonHide

  // Group dishes by chef
  const dishData = order.dishData || order.items || []
  const chefGroups: { chefName: string; dishes: any[] }[] = []
  dishData.forEach((item: any) => {
    const name = item.chefName || item.fullName || 'Chef'
    let group = chefGroups.find(g => g.chefName === name)
    if (!group) {
      group = { chefName: name, dishes: [] }
      chefGroups.push(group)
    }
    if (item.dishes) item.dishes.forEach((d: any) => group!.dishes.push(d))
    else group.dishes.push(item)
  })

  const handleCancel = async () => {
    if (!orderId) return
    setCancelling(true)
    try {
      await cancelOrder(orderId, { reason: 'Cancelled by user' })
      toast.success('Order cancelled')
      setCancelModal(false)
      navigate('/orders')
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <PageHeader title={`Order #${order.orderNumber || orderId}`} />

      <div className="space-y-4">
        {/* Status tracker */}
        {!isCancelled ? (
          <div className="card p-5">
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(Math.max(statusInfo.step, 0) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between relative z-10">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      i <= statusInfo.step
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-300 text-gray-300'
                    }`}>
                      {i < statusInfo.step ? (
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

        {/* Order info */}
        <div className="card p-4 space-y-2">
          {order.userAddress && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-500">{order.userAddress || `${order.address?.street}, ${order.address?.city}`}</p>
              </div>
            </div>
          )}
          {order.orderType && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Order Type</span>
              <span className="font-medium">{order.orderType}</span>
            </div>
          )}
          {order.deliveryOrPickupWindow && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery/Pick-Up Time</p>
                <p className="text-sm text-gray-500">{order.deliveryOrPickupWindow}</p>
              </div>
            </div>
          )}
          {order.deliveryPreference && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-500">Delivery/Pick-up</span>
              <span className="font-medium capitalize">{order.deliveryPreference}</span>
            </div>
          )}
        </div>

        {/* Chef groups with dishes */}
        {chefGroups.map((group, gi) => (
          <div key={gi} className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-pink-50 border-b border-pink-100">
              <p className="text-sm font-semibold text-gray-900">
                {chefGroups.length > 1 ? `${gi + 1}. ` : ''}Chef: <span className="font-bold">{group.chefName}</span>
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Dishes Ordered</p>
              <div className="grid grid-cols-2 gap-3">
                {group.dishes.map((dish: any, di: number) => {
                  const img = dish.dishImage || dish.image
                  const name = dish.dishName || dish.name || 'Dish'
                  const qty = dish.quantity || dish.qty || 1
                  return (
                    <div key={di} className="flex items-center gap-2">
                      {img && (
                        <img src={buildImageUrl(img)} alt={name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{name}</p>
                        <p className="text-xs text-gray-500">Qty: {qty}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Special instructions */}
        {(order.spiceLevel || order.orderInstructions || order.driverInstructions) && (
          <div className="card p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900 mb-1">Special Instructions</p>
            {order.spiceLevel && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Spice Level</span>
                <span className="font-medium">{order.spiceLevel}</span>
              </div>
            )}
            {order.orderInstructions && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Chef Instructions</span>
                <span className="font-medium text-right max-w-[60%]">{order.orderInstructions}</span>
              </div>
            )}
            {order.driverInstructions && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Driver Instructions</span>
                <span className="font-medium text-right max-w-[60%]">{order.driverInstructions}</span>
              </div>
            )}
          </div>
        )}

        {/* Payment details (collapsible) */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setPaymentExpanded(!paymentExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="text-sm font-semibold text-gray-900">Payment Details</span>
            {paymentExpanded
              ? <ChevronUp size={16} className="text-gray-400" />
              : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {paymentExpanded && (
            <div className="px-4 pb-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sub-Total</span>
                <span className="font-medium">${(order.subTotal || order.summary?.subtotal || 0).toFixed(2)}</span>
              </div>
              {(order.smallOrderCharge || 0) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Small Order Charge(s)</span>
                  <span className="font-medium">${order.smallOrderCharge!.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-medium">${(order.deliveryFees || order.summary?.deliveryFee || 0).toFixed(2)}</span>
              </div>
              {(order.driverTip || 0) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Driver Tip</span>
                  <span className="font-medium">${order.driverTip!.toFixed(2)}</span>
                </div>
              )}
              {(order.couponDiscount || 0) > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Coupon Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="font-medium">-${order.couponDiscount!.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="font-medium">${(order.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total Price</span>
                <span className="text-primary">${(order.totalPrice || order.summary?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canCancel && (
            <button
              onClick={() => setCancelModal(true)}
              className="w-full text-center text-sm text-primary font-medium underline py-2"
            >
              Cancel Order
            </button>
          )}
          {isDelivered && !order.reviewOrder && (
            <Button fullWidth onClick={() => navigate(`/orders/${orderId}/rate`)}>
              Rate & Review
            </Button>
          )}
          {isDelivered && !order.orderIssue && (
            <Button variant="ghost" fullWidth onClick={() => navigate(`/orders/${orderId}/report`)}>
              Report an issue
            </Button>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Order?">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle size={24} className="text-red-500" />
          </div>
          <p className="text-gray-600">Do you really want to cancel the order?</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setCancelModal(false)}>No</Button>
          <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>Yes</Button>
        </div>
      </Modal>
    </div>
  )
}
