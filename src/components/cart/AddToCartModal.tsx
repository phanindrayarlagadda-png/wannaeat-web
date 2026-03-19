import { useState, useEffect, useRef } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import Modal from '../common/Modal'
import { addToCartScheduled, getAddresses } from '../../helper/api'
import { buildImageUrl } from '../../utils/imageUrl'
import { incrementCartCount } from '../../redux/slices/cartSlice'

export interface AddToCartDish {
  dishId: string
  name: string
  price: number
  image?: string
  totalServings: number
  menuId: string
  menuDate: string // scheduledDate — the actual menuDate from the DB (ISO string or date)
  deliveryWindow: boolean
  deliveryOrPickupWindow: string // '10am-1pm' or '4pm-7pm'
  isDeliveryWindow?: boolean
}

interface Props {
  dish: AddToCartDish | null
  isOpen: boolean
  onClose: () => void
  zipCode?: string
}

// Default fallback zip code for staging (Short Hills, NJ)
const DEFAULT_ZIP = '07078'

export default function AddToCartModal({ dish, isOpen, onClose, zipCode }: Props) {
  const dispatch = useDispatch()
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const resolvedZip = useRef(zipCode || '')

  // Fetch user's zipCode from saved addresses if not provided
  useEffect(() => {
    if (zipCode) {
      resolvedZip.current = zipCode
      return
    }
    getAddresses()
      .then((res) => {
        const raw = res.data?.data
        const addrArr = Array.isArray(raw) ? raw : (raw?.addressBook || [])
        const def = addrArr.find((a: any) => a.defaultAddress) || addrArr[0]
        resolvedZip.current = def?.zipCode || def?.zip || DEFAULT_ZIP
      })
      .catch(() => {
        resolvedZip.current = DEFAULT_ZIP
      })
  }, [zipCode])

  if (!dish) return null

  const maxServings = dish.totalServings || 99

  const handleClose = () => {
    setQty(1)
    onClose()
  }

  const handleAdd = async () => {
    if (qty === 0) {
      toast.error('Please add at least 1 serving')
      return
    }
    if (qty > maxServings) {
      toast.error(`Only ${maxServings} serving${maxServings === 1 ? '' : 's'} available`)
      return
    }

    setLoading(true)
    try {
      // The backend matches scheduledDate against menuDate in DB using setHours(0,0,0,0)
      // so we need to send the actual menuDate, not just today's date
      const scheduledDate = dish.menuDate || new Date().toISOString()

      const body = {
        dishDetails: [
          {
            dishId: dish.dishId,
            qty,
            scheduledDate,
            menuid: dish.menuId,
            deliveryPreference: dish.deliveryWindow ? 'Delivery' : 'Pick-up',
            deliveryOrPickupWindow: dish.deliveryOrPickupWindow || '10am-1pm',
            price: dish.price,
          },
        ],
        currentDate: new Date().toISOString(),
        zipCode: resolvedZip.current || DEFAULT_ZIP,
        isDeliveryWindow: dish.isDeliveryWindow ?? dish.deliveryWindow ?? true,
        deliveryOrPickupWindow: dish.deliveryOrPickupWindow || '10am-1pm',
      }

      const res = await addToCartScheduled(body)
      if (res.data?.status === 1 || res.data?.data) {
        toast.success('Dish Added to Cart')
        dispatch(incrementCartCount())
        handleClose()
      } else {
        toast.error(res.data?.message || 'Failed to add to cart')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Select Servings" size="sm">
      {/* Dish info */}
      <div className="flex items-center gap-3 mb-6">
        {dish.image && (
          <img
            src={buildImageUrl(dish.image)}
            alt={dish.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#292D32] text-sm line-clamp-2">{dish.name}</p>
          <p className="text-[#FD207A] font-bold text-sm mt-0.5">${dish.price.toFixed(2)}</p>
          {maxServings < 99 && (
            <p className="text-xs text-[#8895A1] mt-0.5">
              {maxServings} serving{maxServings !== 1 ? 's' : ''} available
            </p>
          )}
        </div>
      </div>

      {/* Quantity selector */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <button
          onClick={() => setQty(q => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={18} />
        </button>
        <span className="text-2xl font-bold text-[#292D32] w-10 text-center">{qty}</span>
        <button
          onClick={() => setQty(q => Math.min(maxServings, q + 1))}
          disabled={qty >= maxServings}
          className="w-10 h-10 rounded-full bg-[#FD207A] text-white flex items-center justify-center hover:bg-[#e01b6d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Continue button */}
      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full bg-[#FD207A] text-white rounded-xl py-3.5 font-bold text-base flex items-center justify-center gap-2 hover:bg-[#e01b6d] disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <ShoppingCart size={18} />
            Continue — ${(dish.price * qty).toFixed(2)}
          </>
        )}
      </button>
    </Modal>
  )
}
