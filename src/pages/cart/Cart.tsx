import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, ChevronDown, ChevronUp, Truck, MapPin, Info } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { setServerCart, setCartCount } from '../../redux/slices/cartSlice'
import { getCartDetails, updateDishQty, removeDishFromCart, clearCartApi, checkOutDetails, getProfile } from '../../helper/api'
import { buildImageUrl } from '../../utils/imageUrl'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const SPICE_LEVELS = [
  { label: 'Mild', emoji: '🌶️', value: 'Mild' },
  { label: 'Medium', emoji: '🌶️🌶️', value: 'Medium' },
  { label: 'Hot', emoji: '🌶️🌶️🌶️', value: 'Hot' },
]

export default function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [clearModal, setClearModal] = useState(false)
  const [spiceLevel, setSpiceLevel] = useState('Medium')
  const [deliveryPreference, setDeliveryPreference] = useState<'Delivery' | 'Pick-up'>('Delivery')
  const [chefInstructions, setChefInstructions] = useState('')
  const [driverInstructions, setDriverInstructions] = useState('')
  const [showChefInstructions, setShowChefInstructions] = useState(false)
  const [showDriverInstructions, setShowDriverInstructions] = useState(false)

  // Server cart data
  const [cartData, setCartData] = useState<any>(null)
  const [settingResult, setSettingResult] = useState<any>(null)
  const [zipcodeResult, setZipcodeResult] = useState<any>(null)
  const [emptyCart, setEmptyCart] = useState(false)
  const [userZipCode, setUserZipCode] = useState('')
  const [zipReady, setZipReady] = useState(false)

  const DEFAULT_ZIP = '07078'

  // Fetch user zipCode once
  useEffect(() => {
    getProfile().then(res => {
      const data = res.data?.data || res.data
      const addr = data?.addressBook?.[0]
      setUserZipCode(addr?.zipCode || DEFAULT_ZIP)
    }).catch(() => {
      setUserZipCode(DEFAULT_ZIP)
    }).finally(() => {
      setZipReady(true)
    })
  }, [])

  // Fetch cart from server (matches mobile's getCartOrders)
  const fetchCart = useCallback(async () => {
    if (!zipReady) return // Wait until zipCode is resolved
    try {
      const res = await getCartDetails({ zipCode: userZipCode || DEFAULT_ZIP })
      const data = res.data?.data
      const cartDataFinal = data?.cartDataFinal?.[0]
      const settings = data?.settingResult
      const zipResult = data?.zipcodeResult

      if (!cartDataFinal || !cartDataFinal.dishData?.length) {
        setEmptyCart(true)
        setCartData(null)
        dispatch(setCartCount(0))
        return
      }

      // Enrich dishData items with orderByDate & totalServings from menu data
      const menuDishes = (cartDataFinal.cartDishData || []).flatMap(
        (cd: any) => cd?.MenuData?.dishes || []
      )
      for (const item of cartDataFinal.dishData) {
        const dishId = item.dishId?._id || item.dishId
        const menuDish = menuDishes.find(
          (md: any) => md.dishId?.toString() === dishId?.toString()
        )
        if (menuDish) {
          item.orderByDate = menuDish.orderByDate
          item.totalServings = menuDish.totalServings
        }
      }

      setCartData(cartDataFinal)
      setSettingResult(settings)
      setZipcodeResult(zipResult)
      setEmptyCart(false)

      // Update Redux cart count
      const totalQty = cartDataFinal.dishData.reduce((sum: number, item: any) => sum + (item.qty || 1), 0)
      dispatch(setCartCount(totalQty))
      dispatch(setServerCart(data))
    } catch (err: any) {
      console.log('[Cart] fetchCart error:', err)
      setEmptyCart(true)
      setCartData(null)
      dispatch(setCartCount(0))
    } finally {
      setLoading(false)
    }
  }, [userZipCode, zipReady, dispatch])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Handle quantity change (matches mobile handleItemQuantity)
  const handleQuantityChange = async (item: any, change: number) => {
    if (item.qty === 1 && change === -1) {
      // Remove item
      handleDeleteItem(item)
      return
    }
    setActionLoading(true)
    try {
      await updateDishQty({
        dishId: item.dishId?._id || item.dishId,
        qty: change,
        scheduledDate: item.scheduledDate,
        zipCode: userZipCode,
      })
      await fetchCart()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update quantity')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete item (matches mobile deleteItemFromCart)
  const handleDeleteItem = async (item: any) => {
    setActionLoading(true)
    try {
      await removeDishFromCart({
        dishId: item._id,
        dishPrice: item.dishId?.price || 0,
        dishQty: item.qty || 1,
        zipCode: userZipCode,
      })
      await fetchCart()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove item')
    } finally {
      setActionLoading(false)
    }
  }

  // Clear entire cart
  const handleClearCart = async () => {
    setClearModal(false)
    setActionLoading(true)
    try {
      await clearCartApi()
      setCartData(null)
      setEmptyCart(true)
      dispatch(setCartCount(0))
    } catch {
      toast.error('Failed to clear cart')
    } finally {
      setActionLoading(false)
    }
  }

  // Check if dish is sold out (matches mobile soldOutCheck)
  const isSoldOut = (item: any) => {
    return !(new Date(item.orderByDate) > new Date() && (item?.totalServings || 0) > 0)
  }

  // Calculate pricing (matches mobile's getTotalPrice/getTaxPrice)
  const subTotal = cartData?.subTotal || 0
  const dishItems = cartData?.dishData || []

  // Group items by chef for small order charge
  const chefGroups: Record<string, { items: any[]; totalPrice: number }> = {}
  for (const item of dishItems) {
    const cId = item.chefId?._id || item.chefId || 'unknown'
    if (!chefGroups[cId]) chefGroups[cId] = { items: [], totalPrice: 0 }
    chefGroups[cId].items.push(item)
    chefGroups[cId].totalPrice += (item.dishId?.price || 0) * (item.qty || 1)
  }

  // Small order charge per chef if below minimum
  const minimumOrderLimit = zipcodeResult?.minimumOrderLimit || 0
  let smallOrderCharge = 0
  for (const group of Object.values(chefGroups)) {
    if (minimumOrderLimit > 0 && group.totalPrice < minimumOrderLimit) {
      smallOrderCharge += minimumOrderLimit - group.totalPrice
    }
  }

  // Delivery fee: only for delivery, per unique chef
  const uniqueChefsForDelivery = deliveryPreference === 'Delivery'
    ? Object.keys(chefGroups).length
    : 0
  const deliveryChargePerChef = settingResult?.deliveryCharges || 0
  const deliveryFee = uniqueChefsForDelivery * deliveryChargePerChef

  // Discount from coupon
  const discountAmount = cartData?.offerAppliedDetails?.discount || cartData?.couponId?.discount || 0

  // Tax: (subTotal + smallOrderCharge + deliveryFee - discount) × tax%
  const taxRate = (settingResult?.tax || 0) / 100
  const taxableAmount = subTotal + smallOrderCharge + deliveryFee - discountAmount
  const tax = Math.max(0, taxableAmount * taxRate)

  // Total
  const total = subTotal + smallOrderCharge + deliveryFee + tax - discountAmount

  // Checkout handler (matches mobile's Checkout function)
  const handleCheckout = async () => {
    // Validate no sold-out items
    const hasSoldOut = dishItems.some((item: any) => isSoldOut(item))
    if (hasSoldOut) {
      toast.error('Please remove sold-out dishes')
      return
    }
    if (chefInstructions.length > 250) {
      toast.error('Chef instructions cannot be more than 250 characters')
      return
    }

    setActionLoading(true)
    try {
      const body = {
        dishData: dishItems.map((item: any) => ({
          dishId: item.dishId?._id || item.dishId,
          qty: item.qty,
          scheduledDate: item.scheduledDate,
          menuId: item.menuId,
          deliveryPreference,
          smallOrderCharge: 0,
          deliveryOrPickupWindow: item.deliveryOrPickupWindow,
          chefId: item.chefId?._id || item.chefId,
          discountAmt: 0,
          isDeliveryWindow: item.isDeliveryWindow ?? true,
          price: item.dishId?.price || 0,
        })),
        orderInstructions: chefInstructions,
        driverInstructions: deliveryPreference === 'Delivery' ? driverInstructions : '',
        deliveryFees: deliveryFee,
        subTotal,
        tax: Number(tax).toFixed(2),
        total: total.toFixed(2),
        discountAmt: discountAmount,
        discount: discountAmount,
        smallOrderCharge: Number(smallOrderCharge).toFixed(2),
        zipCode: userZipCode,
        spiceLevel,
      }
      const res = await checkOutDetails(body)
      if (res.data?.status === 1) {
        navigate('/cart/details', {
          state: {
            minimumOrderLimit,
            smallOrderCharge,
            spiceLevel,
            deliveryPreference,
            chefInstructions,
            driverInstructions,
          },
        })
      } else {
        toast.error(res.data?.message || 'Checkout failed')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Checkout failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Cart" />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (emptyCart || !cartData) {
    return (
      <div>
        <PageHeader title="Cart" />
        <EmptyState
          icon={<ShoppingCart size={64} strokeWidth={1} />}
          title="Your cart is empty"
          description="Feeling hungry? Add dishes to your cart, checkout, and satiate your hunger."
          actionLabel="Browse Chefs"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  // Group items by scheduledDate → deliveryWindow → chef (like mobile)
  const groupedItems: Record<string, Record<string, Record<string, any[]>>> = {}
  for (const item of dishItems) {
    const dateKey = item.scheduledDate || 'today'
    const windowKey = item.deliveryOrPickupWindow || 'other'
    const chefKey = item.chefId?._id || item.chefId || 'unknown'
    if (!groupedItems[dateKey]) groupedItems[dateKey] = {}
    if (!groupedItems[dateKey][windowKey]) groupedItems[dateKey][windowKey] = {}
    if (!groupedItems[dateKey][windowKey][chefKey]) groupedItems[dateKey][windowKey][chefKey] = []
    groupedItems[dateKey][windowKey][chefKey].push(item)
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
        {/* Items grouped by date → window → chef */}
        {Object.entries(groupedItems).map(([dateKey, windowGroups]) => (
          <div key={dateKey}>
            {Object.entries(windowGroups).map(([windowKey, chefGroupsInWindow]) => (
              <div key={windowKey}>
                {/* Window header */}
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  {windowKey === '10am-1pm' ? 'Lunch · 10am - 1pm' : windowKey === '4pm-7pm' ? 'Dinner · 4pm - 7pm' : windowKey}
                </div>

                {Object.entries(chefGroupsInWindow).map(([chefKey, items]) => (
                  <div key={chefKey} className="card overflow-hidden mb-3">
                    {/* Chef header */}
                    <div className="bg-pink-50 px-4 py-2.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {items[0]?.chefId?.fullName || items[0]?.chefId?.kitchenName || 'Chef'}
                      </p>
                      {items[0]?.chefId?.kitchenName && items[0]?.chefId?.fullName && (
                        <p className="text-xs text-gray-500">{items[0].chefId.kitchenName}</p>
                      )}
                    </div>

                    {/* Dishes */}
                    <div className="divide-y divide-gray-100">
                      {items.map((item: any, idx: number) => {
                        const soldOut = isSoldOut(item)
                        return (
                          <div key={item._id || idx} className="p-4 flex items-center gap-3">
                            {item.dishId?.dishImage && (
                              <img
                                src={buildImageUrl(item.dishId.dishImage)}
                                alt={item.dishId?.name}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                                {item.dishId?.name || 'Dish'}
                              </p>
                              <p className="font-bold text-primary text-sm mt-0.5">
                                ${(item.dishId?.price || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Servings Left: {soldOut ? 0 : item.totalServings || 0}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {soldOut ? (
                                <div className="bg-[#8895A1] rounded px-2 py-1">
                                  <span className="text-white text-xs font-medium">Sold Out</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleQuantityChange(item, -1)}
                                    disabled={actionLoading}
                                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="font-bold text-sm w-5 text-center">{item.qty || 1}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item, 1)}
                                    disabled={actionLoading}
                                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 disabled:opacity-50"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteItem(item)}
                                disabled={actionLoading}
                                className="ml-1 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Spice Level */}
        <div className="card p-4">
          <p className="font-semibold text-sm text-gray-900 mb-3">Spice Level Preference</p>
          <div className="flex gap-2">
            {SPICE_LEVELS.map(s => (
              <button
                key={s.value}
                onClick={() => setSpiceLevel(s.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  spiceLevel === s.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="block text-base">{s.emoji}</span>
                <span className="text-xs">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Preference */}
        <div className="card p-4">
          <p className="font-semibold text-sm text-gray-900 mb-3">Delivery Preference</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeliveryPreference('Delivery')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                deliveryPreference === 'Delivery'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Truck size={18} />
              Delivery
            </button>
            <button
              onClick={() => setDeliveryPreference('Pick-up')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                deliveryPreference === 'Pick-up'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <MapPin size={18} />
              Pick-up
            </button>
          </div>
        </div>

        {/* Chef Instructions */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowChefInstructions(!showChefInstructions)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-semibold text-sm text-gray-900">Instructions for Chef</span>
            {showChefInstructions ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {showChefInstructions && (
            <div className="px-4 pb-4">
              <textarea
                value={chefInstructions}
                onChange={e => setChefInstructions(e.target.value.slice(0, 250))}
                placeholder="Any special instructions for the chef..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:border-primary"
                maxLength={250}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{chefInstructions.length}/250</p>
            </div>
          )}
        </div>

        {/* Driver Instructions (only for delivery) */}
        {deliveryPreference === 'Delivery' && (
          <div className="card overflow-hidden">
            <button
              onClick={() => setShowDriverInstructions(!showDriverInstructions)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <span className="font-semibold text-sm text-gray-900">Instructions for Driver</span>
              {showDriverInstructions ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {showDriverInstructions && (
              <div className="px-4 pb-4">
                <textarea
                  value={driverInstructions}
                  onChange={e => setDriverInstructions(e.target.value.slice(0, 250))}
                  placeholder="Any delivery instructions..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none h-20 focus:outline-none focus:border-primary"
                  maxLength={250}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{driverInstructions.length}/250</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Details (matches mobile layout) */}
        <div className="card p-4 space-y-2.5">
          <p className="font-semibold text-sm text-gray-900 pb-2 border-b border-gray-100">Payment Details</p>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Sub-Total</span>
            <span className="font-medium">${subTotal.toFixed(2)}</span>
          </div>

          {smallOrderCharge > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                Small Order Charge
                <Info size={12} className="text-gray-400" />
              </span>
              <span className="font-medium">${smallOrderCharge.toFixed(2)}</span>
            </div>
          )}

          {deliveryPreference === 'Delivery' && (
            <div className="flex justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                Delivery Fee
                <Info size={12} className="text-gray-400" />
              </span>
              <span className="font-medium">${deliveryFee.toFixed(2)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Coupon/Discount</span>
              <span className="font-medium">-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>

          <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900">
            <span>Total Price</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          fullWidth
          size="lg"
          loading={actionLoading}
          onClick={handleCheckout}
        >
          Checkout — ${total.toFixed(2)}
        </Button>
      </div>

      {/* Clear cart modal */}
      <Modal isOpen={clearModal} onClose={() => setClearModal(false)} title="Clear Cart?">
        <p className="text-gray-600 mb-6">Are you sure you want to remove all items from your cart?</p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setClearModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={handleClearCart}>
            Clear Cart
          </Button>
        </div>
      </Modal>
    </div>
  )
}
