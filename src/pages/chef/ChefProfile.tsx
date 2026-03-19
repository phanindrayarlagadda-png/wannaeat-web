import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Heart, ChevronLeft, ShoppingCart, CalendarDays, Check } from 'lucide-react'
import { useSelector } from 'react-redux'
import { getChefDetails, getNextClosedDate, favouriteChef, getChefReviews, getProfile, getAddresses } from '../../helper/api'
import { selectCartItemCount } from '../../redux/slices/cartSlice'
import Spinner from '../../components/common/Spinner'
// Types used via 'any' since the getChefDetails response has a different shape
import { buildImageUrl } from '../../utils/imageUrl'
import AddToCartModal, { AddToCartDish } from '../../components/cart/AddToCartModal'

/* ─── Haversine distance (miles) ──────────────────────────────────────────── */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return `${d.toFixed(1)} mi`
}

/* ─── Date helpers (match mobile's moment format) ──────────────────────────── */
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${day} ${mm}/${dd}`
}

function toLocalDateKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function formatOrderBy(dateStr: string) {
  try {
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

function isDishAvailable(item: any): boolean {
  return new Date(item.orderByDate || item.orderByDateNew || '') > new Date() && (item.totalServings || 0) > 0
}

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function ChefProfile() {
  const { chefId } = useParams<{ chefId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { selectedDate?: string } | null

  const [loading, setLoading] = useState(true)
  const [chefData, setChefData] = useState<any>(null)
  const [lunchDishes, setLunchDishes] = useState<any[]>([])
  const [dinnerDishes, setDinnerDishes] = useState<any[]>([])
  const [menuId, setMenuId] = useState('')
  const [liked, setLiked] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])

  const [activeDates, setActiveDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [noActiveDishes, setNoActiveDishes] = useState(false)

  const [kitchenPhotos, setKitchenPhotos] = useState<string[]>([])
  const [activePhoto, setActivePhoto] = useState(0)

  const cartCount = useSelector(selectCartItemCount)

  // User location for delivery/pickup distance
  const [userLat, setUserLat] = useState<number | undefined>()
  const [userLng, setUserLng] = useState<number | undefined>()
  const [userZipCode, setUserZipCode] = useState<string>('')
  const [locationReady, setLocationReady] = useState(false)

  // Add to cart modal state
  const [cartModalDish, setCartModalDish] = useState<AddToCartDish | null>(null)
  const [cartModalOpen, setCartModalOpen] = useState(false)

  const openAddToCart = (item: any, deliveryWindow: string) => {
    const dishData = item.dishId || item
    setCartModalDish({
      dishId: dishData._id || dishData.id || '',
      name: dishData.name || '',
      price: dishData.price || 0,
      image: dishData.dishImage || dishData.image,
      totalServings: item.totalServings || 99,
      menuId: menuId || '',
      menuDate: item.menuDate || item.availableToday || selectedDate || new Date().toISOString(),
      deliveryWindow: item.deliveryWindow ?? true,
      deliveryOrPickupWindow: deliveryWindow,
      isDeliveryWindow: item.deliveryWindow ?? true,
    })
    setCartModalOpen(true)
  }

  // Deduplicate dates by local calendar day
  const uniqueDates = useMemo(() => {
    const seen = new Set<string>()
    return activeDates.filter(d => {
      const key = toLocalDateKey(d)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activeDates])

  /* ─── Fetch user location (same pattern as Home.tsx) ──────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const profileRes = await getProfile()
        const profileData = profileRes.data?.data || profileRes.data
        const addressBook = profileData?.addressBook || []
        if (addressBook.length > 0) {
          const addr = addressBook[0]
          const coords = addr.location?.coordinates
          if (Array.isArray(coords) && coords.length >= 2) {
            setUserLat(coords[1])
            setUserLng(coords[0])
          } else if (addr.location?.lat) {
            setUserLat(addr.location.lat)
            setUserLng(addr.location.lng)
          }
          if (addr.zipCode || addr.zip) {
            setUserZipCode(addr.zipCode || addr.zip)
          }
        }
        if (!userZipCode) {
          try {
            const addrRes = await getAddresses()
            const list = addrRes.data?.data || []
            const def = list.find((a: any) => a.isDefault) || list[0]
            if (def) {
              const coords = def.location?.coordinates
              if (Array.isArray(coords) && coords.length >= 2) {
                setUserLat(coords[1])
                setUserLng(coords[0])
              } else if (def.location?.lat) {
                setUserLat(def.location.lat)
                setUserLng(def.location.lng)
              }
              if (def.zipCode || def.zip) setUserZipCode(def.zipCode || def.zip)
            }
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
      setLocationReady(true)
    })()
  }, [])

  /* ─── Fetch chef details for a given date ──────────────────────────────── */
  const fetchChefForDate = useCallback(async (dateStr: string) => {
    if (!chefId) return
    try {
      setLoading(true)
      // Normalize to local midnight then convert to ISO (matches mobile's setHours(0,0,0,0) approach)
      const dateObj = new Date(dateStr)
      dateObj.setHours(0, 0, 0, 0)
      const offerDate = dateObj.toISOString()

      console.log('[ChefProfile] fetching for offerDate:', offerDate, 'chefId:', chefId, 'lat:', userLat, 'lng:', userLng, 'zip:', userZipCode)
      const res = await getChefDetails({
        chefId,
        date: new Date().toISOString(),
        offerDate,
        userLat,
        userLng,
        zipCode: userZipCode || undefined,
      })
      // API may return data at res.data or res.data.data
      const data = res.data?.data || res.data
      console.log('[ChefProfile] API response:', JSON.stringify(data).substring(0, 500))

      setChefData(data?.chefData || null)
      setLiked(data?.favChef || false)
      setMenuId(data?.dishesOffered?._id || '')

      // Build kitchen photos
      const photos: string[] = []
      if (data?.chefData?.profileImage) photos.push(data.chefData.profileImage)
      if (data?.chefData?.kitchenPhotos?.length > 0) {
        photos.push(...data.chefData.kitchenPhotos)
      }
      setKitchenPhotos(photos)

      // Split dishes by delivery window (matches mobile exactly)
      // deliveryOrPickupWindow can be an array like ["10am-1pm","4pm-7pm"] or a string
      const menuDate = data?.dishesOffered?.menuDate
      const allDishes = data?.dishesOffered?.dishes || []

      // Compute distance client-side if backend didn't (missing GOOGLE_MAP_API_KEY)
      const chefCoords = data?.chefData?.location?.coordinates
      const chefHasCoords = Array.isArray(chefCoords) && chefCoords.length >= 2
      if (userLat && userLng && chefHasCoords) {
        const computedDist = haversineDistance(userLat, userLng, chefCoords[1], chefCoords[0])
        for (const dish of allDishes) {
          if (!dish.distance || dish.distance === 0 || dish.distance === '0') {
            dish.distance = computedDist
            dish.deliveryWindow = true
            dish.pickupWindow = true
          }
        }
      }

      const lunch = allDishes
        .filter((item: any) => {
          const w = item.deliveryOrPickupWindow
          if (Array.isArray(w)) return w.includes('10am-1pm')
          return typeof w === 'string' && w.includes('10am-1pm')
        })
        .map((item: any) => ({ availableToday: menuDate, menuDate, ...item }))

      const dinner = allDishes
        .filter((item: any) => {
          const w = item.deliveryOrPickupWindow
          if (Array.isArray(w)) return w.includes('4pm-7pm')
          return typeof w === 'string' && w.includes('4pm-7pm')
        })
        .map((item: any) => ({ availableToday: menuDate, menuDate, ...item }))

      setLunchDishes(lunch)
      setDinnerDishes(dinner)
    } catch (err) {
      console.error('fetchChefForDate error', err)
    } finally {
      setLoading(false)
    }
  }, [chefId, userLat, userLng, userZipCode])

  /* ─── Fetch active dates ───────────────────────────────────────────────── */
  const fetchActiveDates = useCallback(async () => {
    if (!chefId) return
    try {
      const res = await getNextClosedDate({ date: new Date().toISOString(), chefId })
      const rawDates: string[] = res.data?.data?.date || res.data?.data || []

      // Deduplicate by local calendar day
      const seen = new Set<string>()
      const dates = rawDates.filter(d => {
        const key = toLocalDateKey(d)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (dates.length > 0) {
        // If we have a navState date, ensure it's in the list and use it as initial
        let initialDate = dates[0]
        if (navState?.selectedDate) {
          const navKey = toLocalDateKey(navState.selectedDate)
          const match = dates.find(d => toLocalDateKey(d) === navKey)
          if (match) {
            initialDate = match
          } else {
            // The navState date isn't in the chef's active dates — prepend it
            // so the user sees the date they came from
            dates.unshift(navState.selectedDate)
            initialDate = navState.selectedDate
          }
        }
        setActiveDates(dates)
        setNoActiveDishes(false)
        setSelectedDate(initialDate)
        fetchChefForDate(initialDate)
      } else {
        // No active dates from API — use navState date or today
        const dateToUse = navState?.selectedDate || new Date().toISOString()
        setActiveDates([dateToUse])
        setNoActiveDishes(false)
        setSelectedDate(dateToUse)
        fetchChefForDate(dateToUse)
      }
    } catch {
      const dateToUse = navState?.selectedDate || new Date().toISOString()
      setActiveDates([dateToUse])
      setNoActiveDishes(false)
      setSelectedDate(dateToUse)
      fetchChefForDate(dateToUse)
    }
  }, [chefId, navState?.selectedDate, fetchChefForDate])

  useEffect(() => {
    if (!locationReady) return
    fetchActiveDates()
    // Fetch reviews
    if (chefId) {
      getChefReviews(chefId)
        .then(res => {
          const data = res.data?.data?.result || res.data?.data || []
          setReviews(Array.isArray(data) ? data : [])
        })
        .catch(() => setReviews([]))
    }
  }, [fetchActiveDates, chefId, locationReady])

  // When user selects a different date
  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    fetchChefForDate(dateStr)
  }

  // Toggle favorite
  const handleFavToggle = async () => {
    if (!chefId) return
    try {
      await favouriteChef(chefId)
      setLiked(l => !l)
    } catch { /* ignore */ }
  }

  // Auto-rotate kitchen photos
  useEffect(() => {
    if (kitchenPhotos.length <= 1) return
    const interval = setInterval(() => {
      setActivePhoto(prev => (prev + 1) % kitchenPhotos.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [kitchenPhotos.length])

  // Determine if lunch should be shown (matches mobile showLunchDishes logic)
  const showLunch = (() => {
    // Check if selectedDate is today and past 9:30am
    const selDateObj = new Date(selectedDate)
    const now = new Date()
    const isToday = selDateObj.toDateString() === now.toDateString()
    if (isToday) {
      const nineThirty = new Date()
      nineThirty.setHours(9, 30, 0, 0)
      if (now > nineThirty) return false
      if (lunchDishes.length > 0 && lunchDishes.every(d => !isDishAvailable(d))) return false
    }
    if (lunchDishes.length === 0 && dinnerDishes.length > 0) return false
    return true
  })()

  if (loading && !chefData) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  if (!chefData) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Chef not found</p>
      </div>
    )
  }

  const chefName = chefData.fullName || chefData.name || ''
  const chefRating = chefData.chefRating ?? chefData.rating ?? 0

  return (
    <div className="-mx-4 -mt-4 bg-white min-h-screen">
      {/* Header bar — matches mobile: back + "Chef Profile" + heart */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft size={18} className="text-gray-800" />
          </button>
          <span className="text-[17px] font-semibold text-[#292D32]">Chef Profile</span>
        </div>
        <button onClick={handleFavToggle} className="p-1">
          <Heart
            size={32}
            fill={liked ? '#FD207A' : 'none'}
            stroke={liked ? '#FD207A' : '#374151'}
          />
        </button>
      </div>

      {/* Kitchen photos slider */}
      {kitchenPhotos.length > 0 && (
        <div className="relative mx-5 rounded-lg overflow-hidden" style={{ height: 182 }}>
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activePhoto * 100}%)` }}
          >
            {kitchenPhotos.map((photo, i) => (
              <img
                key={i}
                src={buildImageUrl(photo)}
                alt={`Kitchen ${i + 1}`}
                className="w-full flex-shrink-0 object-contain bg-black/5"
                style={{ height: 182, borderRadius: 8 }}
              />
            ))}
          </div>
          {/* Rating badge on top-left */}
          {chefRating > 0 && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#2E9216] text-white px-1.5 py-0.5 rounded-[5px]">
              <Star size={12} fill="white" stroke="white" />
              <span className="text-xs font-semibold">{chefRating.toFixed(1)}</span>
            </div>
          )}
          {/* Dots */}
          {kitchenPhotos.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {kitchenPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activePhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chef information */}
      <div className="px-5 pt-4 space-y-2">
        <h1 className="text-[17px] font-bold text-[#292D32]">{chefName}</h1>

        {chefData.kitchenName && (
          <div className="flex gap-1 text-xs text-[#4E555D]">
            <span className="font-semibold">Kitchen:</span>
            <span>{chefData.kitchenName}</span>
          </div>
        )}
        {chefData.country && (
          <div className="flex gap-1 text-xs text-[#4E555D]">
            <span className="font-semibold">Country of Origin:</span>
            <span>{chefData.country}</span>
          </div>
        )}

        {/* Cuisines */}
        {chefData.cuisineOffered?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#4E555D] flex-wrap">
            <span>🍽️</span>
            {chefData.cuisineOffered.map((c: string, i: number) => (
              <span key={i}>{c}{i < chefData.cuisineOffered.length - 1 ? ',' : ''}</span>
            ))}
          </div>
        )}

        {chefData.description && (
          <p className="text-xs text-[#4E555D] leading-relaxed">{chefData.description}</p>
        )}
      </div>

      {/* Food Menu header */}
      <div className="mt-4">
        <div className="flex">
          <div className="flex-1 text-center py-2 text-[15px] font-bold" style={{ color: '#FD207A' }}>
            Food Menu
          </div>
        </div>
        <div style={{
          height: 1,
          borderBottomWidth: 2.5,
          borderBottomStyle: 'solid',
          borderBottomColor: '#FD207A',
        }} />
      </div>

      {/* ─── Food Menu Content ─────────────────────────────────────────────── */}
        <div className="px-2.5 pt-3 pb-6">
          {/* Date ribbon — matches home page */}
          {!noActiveDishes && uniqueDates.length > 0 && (
            <div className="flex items-center overflow-x-auto scrollbar-hide pb-3 mb-3">
              <CalendarDays size={35} className="text-primary flex-shrink-0 mr-2.5" />
              {uniqueDates.slice(0, 15).map((dateStr, idx) => {
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={idx}
                    onClick={() => handleDateSelect(dateStr)}
                    style={{
                      height: 35,
                      width: 78,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderStyle: 'solid',
                      borderColor: isSelected ? '#FD207A' : '#D1D7DB',
                      borderRadius: 5,
                      marginLeft: idx === 0 ? 0 : 10,
                      color: isSelected ? '#FD207A' : '#8895A1',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {formatDateLabel(dateStr)}
                  </button>
                )
              })}
            </div>
          )}

          {/* No dishes message */}
          {noActiveDishes && (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-[#292D32]">No dishes available</p>
            </div>
          )}

          {/* Loading indicator for date change */}
          {loading && chefData && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {/* Lunch section */}
          {!noActiveDishes && !loading && showLunch && (
            <div className="mb-4">
              {/* Header: Lunch | 10am - 1pm */}
              <div className="flex justify-between items-center px-5 py-1">
                <span className="text-[15px] font-bold text-[#4e555da3]">Lunch</span>
                <span className="text-[15px] font-bold text-[#4e555da3]">10am - 1pm</span>
              </div>
              <div className="mx-5 border-b border-[#4E555D] mb-2.5" />

              {lunchDishes.length > 0 ? (
                lunchDishes.map((item, idx) => (
                  <DishListItem
                    key={item.dishId?._id || idx}
                    item={item}
                    deliveryWindow="10am-1pm"
                    onNavigate={() => navigate(`/chef/${chefId}`)}
                    onAddToCart={() => openAddToCart(item, '10am-1pm')}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-[#4E555D] py-4">
                  No dishes are available on the selected date. Please browse other dates to check what's cooking!
                </p>
              )}
            </div>
          )}

          {/* Dinner section */}
          {!noActiveDishes && !loading && (
            <div>
              {/* Header: Dinner | 4pm - 7pm */}
              <div className="flex justify-between items-center px-5 py-1">
                <span className="text-[15px] font-bold text-[#4e555da3]">Dinner</span>
                <span className="text-[15px] font-bold text-[#4e555da3]">4pm - 7pm</span>
              </div>
              <div className="mx-5 border-b border-[#4E555D] mb-2.5" />

              {dinnerDishes.length > 0 ? (
                dinnerDishes.map((item, idx) => (
                  <DishListItem
                    key={item.dishId?._id || idx}
                    item={item}
                    deliveryWindow="4pm-7pm"
                    onNavigate={() => navigate(`/chef/${chefId}`)}
                    onAddToCart={() => openAddToCart(item, '4pm-7pm')}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-[#4E555D] py-4">
                  No dishes are available on the selected date. Please browse other dates to check what's cooking!
                </p>
              )}
            </div>
          )}

          {/* ─── Reviews Section (below dishes) ─────────────────────────────── */}
          <div className="mt-6">
            <div className="flex justify-between items-center px-5 py-1">
              <span className="text-[15px] font-bold text-[#4e555da3]">Reviews</span>
            </div>
            <div className="mx-5 border-b border-[#4E555D] mb-2.5" />

            {reviews.length > 0 ? (
              reviews.map((review: any, idx: number) => (
                <div key={review._id || idx} className="mx-5 mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#292D32]">
                      {review?.reviewBy?.fullName || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1 bg-[#2E9216] text-white px-1.5 rounded-[5px]"
                      style={{ height: 24, minWidth: 47 }}
                    >
                      <Star size={12} fill="white" stroke="white" />
                      <span className="text-xs font-semibold">{review.chefRating || 0}.0</span>
                    </div>
                  </div>
                  {review.createdAt && (
                    <p className="text-xs text-[#8895A1] mt-1">
                      {new Date(review.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </p>
                  )}
                  {review.chefReview && (
                    <p className="text-sm text-[#4E555D] mt-1 leading-relaxed">{review.chefReview}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-[#8D126E] text-base font-semibold mt-3 pb-4">No Reviews</p>
            )}
          </div>
        </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => navigate('/cart')}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 bg-primary text-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-lg hover:bg-primary-600 transition-colors z-40"
        >
          <div className="relative">
            <ShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 bg-white text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </div>
          <span className="font-semibold">View Cart</span>
        </button>
      )}

      {/* Add to Cart Modal */}
      <AddToCartModal
        dish={cartModalDish}
        isOpen={cartModalOpen}
        onClose={() => { setCartModalOpen(false); setCartModalDish(null) }}
      />
    </div>
  )
}

/* ─── Dish List Item (matches mobile's renderItem2) ────────────────────────── */
function DishListItem({ item, deliveryWindow, onNavigate, onAddToCart }: {
  item: any
  deliveryWindow: string
  onNavigate: () => void
  onAddToCart: () => void
}) {
  const dishData = item.dishId || item
  const dishImage = dishData.dishImage || dishData.image
  const dishName = dishData.name
  const dishPrice = dishData.price
  const dishRating = item.dishRating ?? 0
  const description = dishData.description
  const restrictedDiets = dishData.restrictedDiets || []
  const available = isDishAvailable(item)
  const deliveryWindowText = deliveryWindow === '10am-1pm' ? '10am - 1pm' : '4pm - 7pm'

  return (
    <div
      onClick={onNavigate}
      className="flex mx-2.5 mb-3 bg-white rounded-lg overflow-hidden text-left border border-gray-100 shadow-sm cursor-pointer"
    >
      {/* Left: dish image with rating badge */}
      <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
        <img
          src={buildImageUrl(dishImage) || `https://picsum.photos/seed/${dishData._id}/120`}
          alt={dishName}
          className="w-full h-full object-contain"
          style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}
        />
        {/* Rating badge */}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#2E9216] text-white px-1.5 rounded-[5px]"
          style={{ height: 18, minWidth: 45 }}
        >
          <Star size={12} fill="white" stroke="white" />
          <span className="text-xs font-semibold ml-0.5">{dishRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Right: dish info */}
      <div className="flex-1 p-2.5 min-w-0">
        {/* Name + price + cart row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#292D32] mb-0.5" style={{ width: '80%' }}>{dishName}</p>
            <p className="text-sm font-bold text-[#FD207A]">${dishPrice?.toFixed(2)}</p>
          </div>
          {available ? (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart() }}
              className="flex-shrink-0 w-10 h-10 bg-[#FD207A] rounded-full flex items-center justify-center hover:bg-[#e01b6d] transition-colors"
            >
              <ShoppingCart size={18} className="text-white" />
            </button>
          ) : (
            <div className="flex-shrink-0 bg-[#8895A1] rounded px-1.5 py-1">
              <span className="text-white text-[13px]">Sold Out</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-[#292D32] leading-5 truncate mt-0.5">{description}</p>
        )}

        {/* Restricted diets */}
        {restrictedDiets.length > 0 && (
          <p className="text-xs text-[#4E555D] mt-0.5">
            {restrictedDiets[0]}
            {restrictedDiets.length > 1 ? `..(+${restrictedDiets.length - 1})` : ''}
          </p>
        )}

        {/* Order By */}
        {item.orderByDate && (
          <div className="flex items-start gap-1 text-xs text-[#4E555D] mt-0.5">
            <span className="font-semibold">Order By:</span>
            <span className="flex-1">{formatOrderBy(item.orderByDate)}</span>
          </div>
        )}

        {/* Delivery Window */}
        <div className="flex items-center gap-1 text-[13px] text-[#4E555D] mt-1 flex-wrap">
          <span className="font-semibold">Delivery Window:</span>
          <span>{deliveryWindowText}</span>
        </div>

        {/* Delivery / Pickup */}
        <div className="mt-0.5">
          {item.deliveryWindow && (
            <div className="flex items-center gap-1 text-xs text-[#4E555D]">
              <Check size={12} className="text-[#FD207A]" />
              <span>Delivery</span>
            </div>
          )}
          {item.pickupWindow && (
            <div className="flex items-center gap-1 text-xs text-[#4E555D] mt-0.5">
              <Check size={12} className="text-[#FD207A]" />
              <span>Pickup: {item.distance || ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
