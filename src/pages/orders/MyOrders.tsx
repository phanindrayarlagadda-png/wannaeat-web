import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'
import { getOpenOrders, getScheduledOrders, getDeliveredOrders, cancelOrder } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import { buildImageUrl } from '../../utils/imageUrl'
import toast from 'react-hot-toast'

type Tab = 'today' | 'scheduled' | 'history'

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Order placed', color: 'bg-yellow-50 text-yellow-700' },
  1: { label: 'Preparing', color: 'bg-orange-50 text-orange-700' },
  2: { label: 'Out for delivery', color: 'bg-purple-50 text-purple-700' },
  3: { label: 'Delivered', color: 'bg-green-50 text-green-700' },
  4: { label: 'Canceled', color: 'bg-red-50 text-red-700' },
  5: { label: 'Accepted by chef', color: 'bg-blue-50 text-blue-700' },
}

function getStatusInfo(status: number | string) {
  const code = typeof status === 'number' ? status : parseInt(status as string) || 0
  return STATUS_MAP[code] || STATUS_MAP[0]
}

export default function MyOrders() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('today')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchOrders = () => {
    setLoading(true)
    let promise: Promise<any>
    if (tab === 'today') {
      promise = getOpenOrders(dayjs().format('YYYY-MM-DD'))
    } else if (tab === 'scheduled') {
      promise = getScheduledOrders()
    } else {
      promise = getDeliveredOrders()
    }
    promise
      .then(res => {
        const data = res.data?.data
        setOrders(Array.isArray(data) ? data : [])
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(fetchOrders, [tab])

  const handleCancel = async (orderId: string) => {
    setCancelling(true)
    try {
      await cancelOrder(orderId, { reason: 'Cancelled by user' })
      toast.success('Order cancelled')
      setCancelModal(null)
      fetchOrders()
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  // Group order dishes by chef
  const getChefGroups = (order: any) => {
    const dishData = order.dishData || order.items || []
    const groups: Record<string, { chefName: string; dishes: any[] }> = {}
    dishData.forEach((item: any) => {
      const key = item.chefId || item.chefName || 'unknown'
      if (!groups[key]) groups[key] = { chefName: item.chefName || item.fullName || 'Chef', dishes: [] }
      // item could have nested dishes array or be a single dish
      if (item.dishes) {
        item.dishes.forEach((d: any) => groups[key].dishes.push(d))
      } else {
        groups[key].dishes.push(item)
      }
    })
    return Object.values(groups)
  }

  const getDeliveryWindowLabel = (window: string | string[]) => {
    if (!window) return ''
    if (Array.isArray(window)) return window.join(', ')
    const w = window.toLowerCase()
    if (w.includes('10') || w.includes('lunch')) return 'Lunch [10am-1pm]'
    if (w.includes('4') || w.includes('dinner')) return 'Dinner [4pm-7pm]'
    return window
  }

  return (
    <div>
      <PageHeader title="Orders" showBack={false} />

      {/* 3-Tab navigation matching mobile */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {(['today', 'scheduled', 'history'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
          title="No Orders Found"
          description={
            tab === 'today' ? "You don't have any orders today"
            : tab === 'scheduled' ? "No scheduled orders"
            : "Your order history is empty"
          }
          actionLabel="Order Now"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order, idx) => {
            const orderId = order.orderId || order._id || order.id || idx
            const status = order.status ?? order.statusCode ?? 0
            const statusInfo = getStatusInfo(status)
            const chefGroups = getChefGroups(order)
            const isPaymentExpanded = expandedPayment === orderId
            const orderDate = order.deliveryDate || order.menuDate || order.createdAt
            const canCancel = (tab === 'today' || tab === 'scheduled') && status === 0 && !order.cancelButtonHide
            const canRate = tab === 'history' && status !== 4 && !order.reviewOrder
            const canReport = tab === 'history' && status !== 4 && !order.orderIssue

            return (
              <div key={orderId} className="card overflow-hidden">
                {/* Date header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {dayjs(orderDate).format('DD-MMM-YYYY')}
                    </p>
                    <p className="text-xs text-gray-500">{dayjs(orderDate).format('dddd')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Order info rows */}
                <div className="px-4 py-3 space-y-2 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Order Id:</span>
                    <span className="font-medium text-gray-900">#{orderId}</span>
                  </div>
                  {order.userAddress && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{order.userAddress}</span>
                    </div>
                  )}
                  {order.orderType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Order Type:</span>
                      <span className="font-medium text-gray-900">{order.orderType}</span>
                    </div>
                  )}
                  {order.deliveryOrPickupWindow && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery/Pick-Up Time:</span>
                      <span className="font-medium text-gray-900">{getDeliveryWindowLabel(order.deliveryOrPickupWindow)}</span>
                    </div>
                  )}
                  {order.deliveryPreference && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery/Pick-up:</span>
                      <span className="font-medium text-gray-900 capitalize">{order.deliveryPreference}</span>
                    </div>
                  )}
                </div>

                {/* Chef groups with dishes */}
                {chefGroups.map((group, gi) => (
                  <div key={gi} className="border-b border-gray-100">
                    <div className="px-4 py-2.5 bg-pink-50">
                      <p className="text-sm font-semibold text-gray-900">
                        {chefGroups.length > 1 ? `${gi + 1}. ` : ''}Chef: <span className="font-bold">{group.chefName}</span>
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Dishes Ordered</p>
                      <div className="grid grid-cols-2 gap-3">
                        {group.dishes.map((dish: any, di: number) => {
                          const dishImg = dish.dishImage || dish.image || dish.dishId?.dishImage
                          const dishName = dish.dishName || dish.name || dish.dishId?.name || 'Dish'
                          const qty = dish.quantity || dish.qty || 1
                          return (
                            <div key={di} className="flex items-center gap-2">
                              {dishImg && (
                                <img
                                  src={buildImageUrl(dishImg)}
                                  alt={dishName}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{dishName}</p>
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
                  <div className="px-4 py-3 border-b border-gray-100 space-y-1">
                    {order.spiceLevel && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Spice Level:</span>
                        <span className="font-medium">{order.spiceLevel}</span>
                      </div>
                    )}
                    {order.orderInstructions && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Chef Instructions:</span>
                        <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.orderInstructions}</span>
                      </div>
                    )}
                    {order.driverInstructions && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Driver Instructions:</span>
                        <span className="font-medium text-gray-900 text-right max-w-[60%]">{order.driverInstructions}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Details (collapsible) */}
                <div>
                  <button
                    onClick={() => setExpandedPayment(isPaymentExpanded ? null : orderId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="text-sm font-semibold text-gray-900">Payment Details</span>
                    {isPaymentExpanded
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </button>
                  {isPaymentExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Sub-Total</span>
                        <span className="font-medium">${(order.subTotal || order.summary?.subtotal || 0).toFixed(2)}</span>
                      </div>
                      {(order.smallOrderCharge || 0) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Small Order Charge(s)</span>
                          <span className="font-medium">${order.smallOrderCharge.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Delivery Fee</span>
                        <span className="font-medium">${(order.deliveryFees || order.summary?.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      {(order.driverTip || 0) > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Driver Tip</span>
                          <span className="font-medium">${order.driverTip.toFixed(2)}</span>
                        </div>
                      )}
                      {(order.couponDiscount || 0) > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Coupon Discount {order.couponCode && `(${order.couponCode})`}</span>
                          <span className="font-medium">-${order.couponDiscount.toFixed(2)}</span>
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

                {/* Action buttons */}
                {(canCancel || canRate || canReport) && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-6">
                    {canCancel && (
                      <button
                        onClick={() => setCancelModal(orderId)}
                        className="text-sm text-primary font-medium underline"
                      >
                        Cancel Order
                      </button>
                    )}
                    {canRate && (
                      <button
                        onClick={() => navigate(`/orders/${orderId}/rate`)}
                        className="text-sm text-primary font-medium underline"
                      >
                        Rate & Review
                      </button>
                    )}
                    {canReport && (
                      <button
                        onClick={() => navigate(`/orders/${orderId}/report`)}
                        className="text-sm text-primary font-medium underline"
                      >
                        Report an issue
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel order modal */}
      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Order?">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <Package size={24} className="text-red-500" />
          </div>
          <p className="text-gray-600">Do you really want to cancel the order?</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setCancelModal(null)}>No</Button>
          <Button variant="danger" fullWidth loading={cancelling} onClick={() => cancelModal && handleCancel(cancelModal)}>Yes</Button>
        </div>
      </Modal>
    </div>
  )
}
