import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { clearCart } from '../../redux/slices/cartSlice'
import Button from '../../components/common/Button'

export default function OrderPlaced() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    // Clear cart on successful order
    dispatch(clearCart())
  }, [dispatch])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {/* Success animation */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={56} className="text-green-500" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-2">
        Your order has been confirmed and is being prepared.
      </p>
      {orderId && (
        <p className="text-sm text-gray-400 mb-8">
          Order ID: <span className="font-mono font-medium text-gray-600">#{orderId}</span>
        </p>
      )}

      <div className="space-y-3 w-full max-w-xs">
        <Button
          fullWidth
          onClick={() => navigate(`/orders/${orderId}`)}
          leftIcon={<ShoppingBag size={18} />}
        >
          Track Order
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>

      {/* Steps */}
      <div className="mt-10 w-full max-w-sm">
        <div className="flex justify-between items-center text-xs text-gray-500">
          {['Order Placed', 'Preparing', 'On the way', 'Delivered'].map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className="text-center leading-tight max-w-[50px]">{step}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-200 rounded-full mt-3 relative">
          <div className="absolute left-0 top-0 h-full bg-green-500 rounded-full" style={{ width: '10%' }} />
        </div>
      </div>
    </div>
  )
}
