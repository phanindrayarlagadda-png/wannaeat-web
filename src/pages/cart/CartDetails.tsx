import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tag, X, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCheckoutDetails, applyCoupon, removeCoupon, getAddresses } from '../../helper/api'
import { buildImageUrl } from '../../utils/imageUrl'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'

export default function CartDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const cartState = location.state as {
    minimumOrderLimit?: number
    smallOrderCharge?: number
    spiceLevel?: string
    deliveryPreference?: string
    chefInstructions?: string
    driverInstructions?: string
  } | null

  const [loading, setLoading] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [addresses, setAddresses] = useState<any[]>([])
  const [checkoutData, setCheckoutData] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      getCheckoutDetails().catch(() => ({ data: { data: {} } })),
      getAddresses().catch(() => ({ data: { data: [] } })),
    ]).then(([checkoutRes, addrRes]) => {
      const raw = checkoutRes.data?.data || {}
      // API returns { cartData, userData, couponData, totalItems }
      const cart = raw.cartData || raw
      setCheckoutData(cart)

      // Map addresses
      const addrRaw = addrRes.data?.data
      const addrArr = Array.isArray(addrRaw) ? addrRaw : (addrRaw?.addressBook || [])
      const mapped = addrArr.map((a: any) => ({
        id: a._id?.toString() || a.id || '',
        street: a.address1 || a.street || '',
        city: `${a.city || ''}${a.state ? ', ' + a.state : ''} ${a.zipCode || ''}`.trim(),
        isDefault: a.defaultAddress || a.isDefault || false,
        zipCode: a.zipCode || '',
        lat: a.location?.coordinates?.[1] || a.lat,
        lng: a.location?.coordinates?.[0] || a.lng,
        fullAddress: a,
      }))
      setAddresses(mapped)

      setDiscount(raw.couponData?.discount || cart.discountAmt || 0)
      setAppliedCoupon(raw.couponData?.couponCode || '')
      const def = mapped.find((a: any) => a.isDefault)
      if (def) setSelectedAddress(def.id)
    }).finally(() => setLoading(false))
  }, [])

  // Pricing from checkout API
  const subTotal = checkoutData?.subTotal || 0
  const deliveryFee = checkoutData?.deliveryFee || checkoutData?.deliveryFees || 0
  const tax = checkoutData?.tax || 0
  const total = subTotal + deliveryFee + tax - discount

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
        <PageHeader title="Order Summary" />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    )
  }

  const selectedAddr = addresses.find((a: any) => a.id === selectedAddress)

  return (
    <div>
      <PageHeader title="Order Summary" />

      <div className="space-y-4">
        {/* Order items */}
        {checkoutData?.dishData?.length > 0 && (
          <div className="card overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
              Order Items ({checkoutData.dishData.reduce((s: number, d: any) => s + (d.qty || 1), 0)})
            </div>
            <div className="divide-y divide-gray-100">
              {checkoutData.dishData.map((item: any, idx: number) => (
                <div key={item._id || idx} className="p-4 flex items-center gap-3">
                  {(item.dishId?.dishImage) && (
                    <img
                      src={buildImageUrl(item.dishId.dishImage)}
                      alt={item.dishId?.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                      {item.dishId?.name || 'Dish'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.qty || 1} × ${(item.dishId?.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-sm text-primary">
                    ${((item.dishId?.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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
          {addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.slice(0, 3).map((addr: any) => (
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
          <p className="font-semibold text-gray-900 mb-2">Payment Details</p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Sub-Total</span><span>${subTotal.toFixed(2)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-${discount.toFixed(2)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span><span>${Number(tax).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/checkout', {
            state: {
              ...cartState,
              selectedAddress: selectedAddr,
              discount,
              coupon: appliedCoupon,
            },
          })}
          disabled={!selectedAddress && addresses.length > 0}
        >
          Proceed to Pay — ${total.toFixed(2)}
        </Button>
      </div>
    </div>
  )
}
