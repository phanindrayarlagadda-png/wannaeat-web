import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Star, ArrowLeft, Check } from 'lucide-react'
import { getTodayMenu } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { Dish } from '../../types'
import { buildImageUrl } from '../../utils/imageUrl'
import AddToCartModal, { AddToCartDish } from '../../components/cart/AddToCartModal'

function formatOrderBy(dateStr: string) {
  try {
    // Match mobile's moment format: 'ddd, DD MMM - hh:mm a'
    // Use local timezone (same as moment default)
    const d = new Date(dateStr)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })
    const date = String(d.getDate()).padStart(2, '0')
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const hours = d.getHours()
    const mins = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    const h12 = hours % 12 || 12
    return `${day}, ${date} ${month} - ${String(h12).padStart(2, '0')}:${mins} ${ampm}`
  } catch {
    return dateStr
  }
}

function isDishAvailableToday(dish: Dish): boolean {
  if (dish.availableToday === true) return true
  if (typeof dish.availableToday === 'string') {
    return new Date().toDateString() === new Date(dish.availableToday).toDateString()
  }
  if (dish.orderByDateNew && dish.menuDate) {
    const today = new Date().toDateString()
    return new Date(dish.orderByDateNew).toDateString() === today && new Date(dish.menuDate).toDateString() === today
  }
  return false
}

function checkOrderByDateAndCurrentSame(dish: Dish): boolean {
  const today = new Date().toLocaleDateString()
  const orderDate = new Date(dish.orderByDateNew || '').toLocaleDateString()
  const menuDate = new Date(dish.menuDate || '').toLocaleDateString()
  return today === orderDate && today === menuDate
}

function isDishAvailable(dish: Dish): boolean {
  return new Date(dish.orderByDateNew || '') > new Date() && (dish.totalServings || 0) > 0
}

export default function PopularDishes() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as {
    serveWindow?: string
    dishes?: Dish[]
    selectedDate?: string
  } | null

  const serveWindow = state?.serveWindow || '10am-1pm'
  const passedDishes = state?.dishes
  const selectedDate = state?.selectedDate

  const [dishes, setDishes] = useState<Dish[]>(passedDishes || [])
  const [loading, setLoading] = useState(!passedDishes)
  const [cartModalDish, setCartModalDish] = useState<AddToCartDish | null>(null)
  const [cartModalOpen, setCartModalOpen] = useState(false)

  const openAddToCart = (dish: Dish) => {
    setCartModalDish({
      dishId: dish.dishId || dish.id || (dish as any)._id || '',
      name: dish.name || dish.dishName || '',
      price: dish.price || 0,
      image: dish.image || dish.dishImage,
      totalServings: dish.totalServings || 99,
      menuId: dish.menuId || '',
      menuDate: dish.menuDate || selectedDate || new Date().toISOString(),
      deliveryWindow: dish.deliveryWindow ?? true,
      deliveryOrPickupWindow: serveWindow,
      isDeliveryWindow: dish.deliveryWindow ?? true,
    })
    setCartModalOpen(true)
  }

  const title = serveWindow === '10am-1pm' ? 'Lunch Dishes' : 'Dinner Dishes'
  const deliveryWindowText = serveWindow === '10am-1pm' ? '10am - 1pm' : '4pm - 7pm'

  // Fetch from API if no dishes passed via state
  const fetchDishes = useCallback(async () => {
    if (passedDishes && passedDishes.length > 0) return
    try {
      setLoading(true)
      const dateStr = selectedDate || new Date().toISOString()
      const res = await getTodayMenu({
        date: new Date(dateStr).toISOString(),
        currentDate: new Date().toISOString(),
      })
      const popularDishes: any[] = res.data?.data?.popularDishes || []

      const allDishes: Dish[] = []
      for (const menu of popularDishes) {
        if (!menu?.dishes) continue
        const chefObj = typeof menu.chefId === 'object' ? menu.chefId : null
        const chefIdStr = chefObj?._id || menu.chefId
        const chefFullName = chefObj?.fullName || chefObj?.kitchenName || menu.chefName || ''
        for (const item of menu.dishes) {
          const dishData = item.dishId || item
          const windowArr: string[] = Array.isArray(item.deliveryOrPickupWindow)
            ? item.deliveryOrPickupWindow
            : item.deliveryOrPickupWindow ? [item.deliveryOrPickupWindow] : []
          allDishes.push({
            id: dishData._id || dishData.id,
            menuId: menu._id,
            menuDate: menu.menuDate,
            chefId: chefIdStr,
            name: dishData.name,
            image: dishData.dishImage || dishData.image,
            dishImage: dishData.dishImage,
            price: dishData.price,
            dishRating: item.dishRating,
            totalServings: item.totalServings,
            availableToday: item.availableToday,
            orderByDateNew: item.orderByDateNew,
            deliveryOrPickupWindow: windowArr.join(', '),
            deliveryWindow: item.deliveryWindow ?? windowArr.some((w: string) => w.includes('10am') || w.includes('4pm')),
            pickupWindow: item.pickupWindow,
            distance: item.distance,
            chefName: chefFullName,
            chefRating: item.chefRating,
          } as Dish)
        }
      }

      // Filter by serveWindow
      const filtered = allDishes.filter(d =>
        d.deliveryOrPickupWindow?.includes(serveWindow)
      )
      setDishes(filtered.length > 0 ? filtered : allDishes)
    } catch {
      setDishes([])
    } finally {
      setLoading(false)
    }
  }, [passedDishes, selectedDate, serveWindow])

  useEffect(() => {
    fetchDishes()
  }, [fetchDishes])

  return (
    <div className="bg-white min-h-screen">
      {/* Header — matches mobile: back arrow + title */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-800" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#292D32]">{title}</h1>
      </div>

      {/* Dishes grid — 2 columns like mobile */}
      <div className="px-2.5 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : dishes.length === 0 ? (
          <EmptyState title="Sorry no dishes available!" description="" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dishes.map((dish, index) => {
              const isAvailToday = checkOrderByDateAndCurrentSame(dish) && isDishAvailableToday(dish)
              const isPreorder = !isAvailToday
              const canAddToCart = isDishAvailable(dish)
              const dishImage = dish.image || dish.dishImage
              const rating = dish.dishRating ?? dish.rating

              return (
                <button
                  key={dish.id || index}
                  onClick={() => navigate(`/chef/${dish.chefId}`)}
                  className="bg-white rounded-lg overflow-hidden text-left shadow-sm border border-gray-100"
                >
                  {/* Image with badges */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={buildImageUrl(dishImage) || `https://picsum.photos/seed/${dish.id}/200/150`}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      style={{ borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                    />

                    {/* Rating badge — green, top-left */}
                    {rating != null && rating > 0 && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 bg-[#2E9216] text-white px-1.5 rounded-[5px]"
                        style={{ height: 18, minWidth: 45, justifyContent: 'center' }}
                      >
                        <Star size={12} fill="white" stroke="white" />
                        <span className="text-xs font-semibold ml-0.5">{rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Available Today / Preorder badge */}
                    <div
                      className="absolute text-white text-xs font-semibold px-2 rounded-[5px]"
                      style={{
                        bottom: 42,
                        left: 10,
                        backgroundColor: isAvailToday ? '#8D126E' : 'black',
                        paddingTop: 2,
                        paddingBottom: 2,
                      }}
                    >
                      {isAvailToday ? 'Available Today' : 'Preorder'}
                    </div>

                    {/* Add to Cart / Sold Out button */}
                    <button
                      className="absolute bottom-2.5 right-2.5 text-white text-[13px] px-1.5 py-1.5 rounded-[5px]"
                      style={{
                        backgroundColor: canAddToCart ? '#FD207A' : '#8895A1',
                        fontFamily: 'Lato, sans-serif',
                      }}
                      disabled={!canAddToCart}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (canAddToCart) openAddToCart(dish)
                      }}
                    >
                      {canAddToCart ? 'Add to Cart' : 'Sold Out'}
                    </button>
                  </div>

                  {/* Content below image */}
                  <div className="p-2.5 space-y-0.5">
                    {/* Name + Price */}
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-black flex-1">{dish.name}</p>
                      <span className="text-sm font-bold text-[#FD207A] whitespace-nowrap pl-1">
                        ${dish.price?.toFixed(2)}
                      </span>
                    </div>

                    {/* Chef name */}
                    {dish.chefName && (
                      <p className="text-xs text-[#4E555D]">{dish.chefName}</p>
                    )}

                    {/* Order By (shown for preorder items) */}
                    {isPreorder && dish.orderByDateNew && (
                      <div className="flex items-start gap-1 text-xs text-[#4E555D]">
                        <span className="font-semibold">Order By:</span>
                        <span>{formatOrderBy(dish.orderByDateNew)}</span>
                      </div>
                    )}

                    {/* Servings Available (shown for available today) */}
                    {isAvailToday && (
                      <div className="flex items-center gap-1 text-xs text-[#4E555D]">
                        <span className="font-semibold">
                          {(dish.totalServings || 0) <= 1 ? 'Serving' : 'Servings'} Available:
                        </span>
                        <span className="text-[#99A0A7]">
                          {canAddToCart ? dish.totalServings : 0}
                        </span>
                      </div>
                    )}

                    {/* Delivery Window */}
                    <div className="flex items-center gap-1 text-xs text-[#4E555D]">
                      <span className="font-semibold">Delivery Window:</span>
                      <span>{deliveryWindowText}</span>
                    </div>

                    {/* Delivery / Pickup section */}
                    <div className="space-y-0.5 mt-0.5">
                      {dish.deliveryWindow && (
                        <div className="flex items-center gap-1 text-xs text-[#4E555D]">
                          <Check size={12} className="text-[#FD207A]" />
                          <span>Delivery</span>
                        </div>
                      )}
                      {dish.pickupWindow && (
                        <div className="flex items-center gap-1 text-xs text-[#4E555D]">
                          <Check size={12} className="text-[#FD207A]" />
                          <span>Pickup: {dish.distance || ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Add to Cart Modal */}
      <AddToCartModal
        dish={cartModalDish}
        isOpen={cartModalOpen}
        onClose={() => { setCartModalOpen(false); setCartModalDish(null) }}
      />
    </div>
  )
}
