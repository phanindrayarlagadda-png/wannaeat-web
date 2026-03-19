import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, MapPin } from 'lucide-react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { clearCart, setCartCount } from '../../redux/slices/cartSlice'
import { getPaymentCards, getAddresses, placeOrder } from '../../helper/api'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import { PaymentCard, Address } from '../../types'

export default function Checkout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const navState = location.state as {
    selectedAddress?: any
    discount?: number
    coupon?: string
    spiceLevel?: string
    deliveryPreference?: string
  } | null

  const [cards, setCards] = useState<PaymentCard[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      getPaymentCards().catch(() => ({ data: { data: [] } })),
      getAddresses().catch(() => ({ data: { data: [] } })),
    ]).then(([cardsRes, addrRes]) => {
      const fetchedCards: PaymentCard[] = cardsRes.data?.data || []
      const addrRaw = addrRes.data?.data
      const addrArr = Array.isArray(addrRaw) ? addrRaw : (addrRaw?.addressBook || [])
      const fetchedAddresses: Address[] = addrArr.map((a: any) => ({
        id: a._id?.toString() || a.id || '',
        label: a.label || a.addressType || '',
        street: a.address1 || a.placeName || a.street || '',
        address2: a.address2 || '',
        city: a.city || '',
        state: a.state || '',
        zipCode: a.zipCode || '',
        isDefault: a.defaultAddress || a.isDefault || false,
        lat: a.location?.coordinates?.[1] || a.lat || undefined,
        lng: a.location?.coordinates?.[0] || a.lng || undefined,
      }))
      setCards(fetchedCards)
      setAddresses(fetchedAddresses)
      const defCard = fetchedCards.find(c => c.isDefault)
      const defAddr = fetchedAddresses.find(a => a.isDefault)
      if (defCard) setSelectedCard(defCard.id)
      // Use navState address if provided, otherwise default
      if (navState?.selectedAddress?.id) {
        setSelectedAddress(navState.selectedAddress.id)
      } else if (defAddr) {
        setSelectedAddress(defAddr.id)
      }
    })
  }, [navState?.selectedAddress?.id])

  const handlePlaceOrder = async () => {
    if (!selectedCard) { toast.error('Please select a payment method'); return }
    if (!selectedAddress) { toast.error('Please select a delivery address'); return }

    const addr = addresses.find(a => a.id === selectedAddress)

    setLoading(true)
    try {
      // Match mobile's placeOrder body
      const res = await placeOrder({
        placeOrderDate: new Date().toISOString(),
        userAddress: addr ? {
          address1: addr.street,
          address2: addr.address2,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
        } : undefined,
        userLocation: addr?.lat && addr?.lng ? { lat: addr.lat, lng: addr.lng } : undefined,
        cardId: selectedCard,
      })

      if (res.data?.status === 1 || res.data?.data?.orderId) {
        const orderId = res.data?.data?.orderId || res.data?.orderId || ''
        dispatch(clearCart())
        dispatch(setCartCount(0))
        toast.success(res.data?.message || 'Order placed successfully!')
        navigate(`/order-placed/${orderId}`)
      } else {
        toast.error(res.data?.message || 'Failed to place order')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Checkout" />

      <div className="space-y-4">
        {/* Delivery Address */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Delivery Address
            </h3>
            <button onClick={() => navigate('/account/addresses')} className="text-sm text-primary hover:underline">
              Add New
            </button>
          </div>
          {addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map(addr => (
                <label key={addr.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    {addr.label && <p className="text-sm font-semibold text-gray-900">{addr.label}</p>}
                    <p className="text-sm text-gray-700">{addr.street}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                    <p className="text-xs text-gray-500">{addr.city}, {addr.state} {addr.zipCode}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate('/account/addresses')}
              className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary hover:text-primary"
            >
              + Add delivery address
            </button>
          )}
        </div>

        {/* Payment method */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              Payment Method
            </h3>
            <button onClick={() => navigate('/account/payment-methods')} className="text-sm text-primary hover:underline">
              Add Card
            </button>
          </div>
          {cards.length > 0 ? (
            <div className="space-y-2">
              {cards.map(card => (
                <label key={card.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="card"
                    value={card.id}
                    checked={selectedCard === card.id}
                    onChange={() => setSelectedCard(card.id)}
                    className="accent-primary"
                  />
                  <CreditCard size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires {card.expMonth}/{card.expYear}
                    </p>
                  </div>
                  {card.isDefault && (
                    <span className="ml-auto text-xs text-primary font-medium">Default</span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <button
              onClick={() => navigate('/account/payment-methods')}
              className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary hover:text-primary"
            >
              + Add payment method
            </button>
          )}
        </div>

        <Button fullWidth size="lg" loading={loading} onClick={handlePlaceOrder}>
          Place Order
        </Button>
      </div>
    </div>
  )
}
