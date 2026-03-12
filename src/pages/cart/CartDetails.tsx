import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, X, MapPin } from 'lucide-react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { RootState } from '../../redux/store'
import { selectCartSubtotal } from '../../redux/slices/cartSlice'
import { getCheckoutDetails, applyCoupon, removeCoupon } from '../../helper/api'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'

interface CheckoutDetails {
  deliveryFee: number
  discount: number
  couponCode?: string
  addresses: { id: string; street: string; city: string; isDefault?: boolean }[]
}

export default function CartDetails() {
  const navigate = useNavigate()
  const items = useSelector((state: RootState) => state.cart.items)
  const subtotal = useSelector(selectCartSubtotal)
  const [details, setDetails] = useState<CheckoutDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  useEffect(() => {
    getCheckoutDetails()
      .then(res => {
        const data = res.data?.data || {}
        setDetails(data)
        setDiscount(data.discount || 0)
        setAppliedCoupon(data.couponCode || '')
        const def = data.addresses?.find((a: { isDefault?: boolean }) => a.isDefault)
        if (def) setSelectedAddress(def.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const deliveryFee = details?.deliveryFee ?? 4.99
  const total = subtotal + deliveryFee - discount

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await applyCoupon({ code: couponInput.trim() })
      setDiscount(res.data?.data?.discount || 0)
      setAppliedCoupon(couponInput.trim())
      setCouponInput('')
      toast.success('Coupon applied!')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Invalid coupon code')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon()
      setAppliedCoupon('')
      setDiscount(0)
      toast.success('Coupon removed')
    } catch {
      toast.error('Failed to remove coupon')
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Cart Details" />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Cart Details" />

      <div className="space-y-4">
        {/* Items summary */}
        <div className="card p-4">
          <p className="font-semibold text-gray-900 mb-3">Items ({items.length})</p>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.dishId} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.dishName} × {item.quantity}</span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery address */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Delivery Address
            </p>
            <button
              onClick={() => navigate('/account/addresses')}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          </div>
          {details?.addresses?.length ? (
            <div className="space-y-2">
              {details.addresses.slice(0, 3).map(addr => (
                <label key={addr.id} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{addr.street}</p>
                    <p className="text-xs text-gray-500">{addr.city}</p>
                  </div>
                  {addr.isDefault && (
                    <span className="ml-auto text-xs text-primary font-medium">Default</span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate('/account/addresses')}
              className="w-full text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              + Add delivery address
            </button>
          )}
        </div>

        {/* Coupon */}
        <div className="card p-4">
          <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            Promo Code
          </p>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-green-700">{appliedCoupon}</p>
                <p className="text-xs text-green-600">-${discount.toFixed(2)} discount applied</p>
              </div>
              <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="Enter promo code"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
              />
              <Button
                variant="outline"
                onClick={handleApplyCoupon}
                loading={couponLoading}
                disabled={!couponInput.trim()}
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Bill summary */}
        <div className="card p-4 space-y-2">
          <p className="font-semibold text-gray-900 mb-2">Bill Summary</p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Item total</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/checkout')}
          disabled={!selectedAddress && !!details?.addresses?.length}
        >
          Continue to Payment — ${total.toFixed(2)}
        </Button>
      </div>
    </div>
  )
}
