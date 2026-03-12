import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MapPin, CreditCard, Clock } from 'lucide-react'
import { RootState } from '../../redux/store'
import { selectCartSubtotal } from '../../redux/slices/cartSlice'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'

export default function OrderSummary() {
  const navigate = useNavigate()
  const items = useSelector((state: RootState) => state.cart.items)
  const subtotal = useSelector(selectCartSubtotal)
  const scheduledDate = useSelector((state: RootState) => state.cart.scheduledDate)
  const deliveryFee = 4.99
  const total = subtotal + deliveryFee

  return (
    <div>
      <PageHeader title="Order Summary" />

      <div className="space-y-4">
        {/* Items */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.dishId} className="flex items-center gap-3">
                {item.image && (
                  <img src={item.image} alt={item.dishName} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1">
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
              <p className="text-sm text-gray-500">Selected address</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Payment Method</p>
              <p className="text-sm text-gray-500">Selected card</p>
            </div>
          </div>
          {scheduledDate && (
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Scheduled Delivery</p>
                <p className="text-sm text-gray-500">{new Date(scheduledDate).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bill */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Edit Order</Button>
          <Button onClick={() => navigate('/checkout')}>Confirm & Pay</Button>
        </div>
      </div>
    </div>
  )
}
