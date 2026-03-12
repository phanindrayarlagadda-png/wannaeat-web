import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { updateQuantity, removeItem, clearCart, selectCartSubtotal } from '../../redux/slices/cartSlice'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { useState } from 'react'
import Modal from '../../components/common/Modal'

const TIP_OPTIONS = [0, 2, 3, 5]

export default function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector((state: RootState) => state.cart.items)
  const subtotal = useSelector(selectCartSubtotal)
  const [tip, setTip] = useState(0)
  const [customTip, setCustomTip] = useState('')
  const [clearModal, setClearModal] = useState(false)

  const deliveryFee = items.length > 0 ? 4.99 : 0
  const tipAmount = customTip ? parseFloat(customTip) : tip
  const total = subtotal + deliveryFee + (isNaN(tipAmount) ? 0 : tipAmount)

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState
          icon={<ShoppingCart size={64} strokeWidth={1} />}
          title="Your cart is empty"
          description="Add some delicious dishes to get started"
          actionLabel="Browse Chefs"
          onAction={() => navigate('/chefs')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Cart"
        rightAction={
          <button
            onClick={() => setClearModal(true)}
            className="text-sm text-red-500 font-medium hover:underline"
          >
            Clear
          </button>
        }
      />

      <div className="space-y-4">
        {/* Items */}
        <div className="card divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.dishId} className="p-4 flex items-center gap-3">
              {item.image && (
                <img src={item.image} alt={item.dishName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 line-clamp-1">{item.dishName}</p>
                <p className="text-sm text-gray-500">{item.chefName}</p>
                <p className="font-bold text-primary mt-1">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => dispatch(updateQuantity({ dishId: item.dishId, quantity: item.quantity - 1 }))}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => dispatch(updateQuantity({ dishId: item.dishId, quantity: item.quantity + 1 }))}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-600"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => dispatch(removeItem(item.dishId))}
                  className="ml-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="card p-4">
          <p className="font-semibold text-gray-900 mb-3">Add a tip for your chef</p>
          <div className="flex gap-2 flex-wrap">
            {TIP_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => { setTip(t); setCustomTip('') }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tip === t && !customTip ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t === 0 ? 'No Tip' : `$${t}`}
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              value={customTip}
              onChange={e => { setCustomTip(e.target.value); setTip(0) }}
              className="w-24 px-3 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="card p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tip</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/cart/details')}
        >
          Proceed to Checkout — ${total.toFixed(2)}
        </Button>
      </div>

      {/* Clear cart modal */}
      <Modal isOpen={clearModal} onClose={() => setClearModal(false)} title="Clear Cart?">
        <p className="text-gray-600 mb-6">Are you sure you want to remove all items from your cart?</p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setClearModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={() => { dispatch(clearCart()); setClearModal(false) }}>
            Clear Cart
          </Button>
        </div>
      </Modal>
    </div>
  )
}
