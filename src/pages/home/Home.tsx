import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Star, CalendarDays, ShoppingCart, Truck, Check } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { getHomeData, getBanners, getNextClosedDate, getTodayMenu, getAddresses, getProfile } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import { Chef, Dish } from '../../types'
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

interface HomeData {
  banners: { id: string; image: string; title?: string }[]
  popularChefs: Chef[]
  popularDishes: Dish[]
  availableToday: Chef[]
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${day} ${mm}/${dd}`
}

function formatOrderBy(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })
    const date = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${day}, ${date} ${month} - ${time}`
  } catch {
    return dateStr
  }
}

/* ─── Helper: check if selected date is today ─────────────────────────────── */
function isDateToday(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const given = new Date(dateStr)
  given.setHours(0, 0, 0, 0)
  return today.getTime() === given.getTime()
}

function isDishAvailableToday(dish: Dish): boolean {
  if (dish.availableToday === true) return true
  if (typeof dish.availableToday === 'string') {
    return new Date().toDateString() === new Date(dish.availableToday).toDateString()
  }
  // Check if orderByDate and menuDate both match today
  if (dish.orderByDateNew && dish.menuDate) {
    const today = new Date().toDateString()
    return new Date(dish.orderByDateNew).toDateString() === today && new Date(dish.menuDate).toDateString() === today
  }
  return false
}

function getChefAvailabilityText(chef: Chef): string {
  if (chef.isAvailableToday || chef.availableToday === true) {
    return `Available Today${chef.deliveryOrPickupWindow ? `, ${chef.deliveryOrPickupWindow}` : ''}`
  }
  if (typeof chef.availableToday === 'string') {
    try {
      const d = new Date(chef.availableToday)
      const date = d.getDate()
      const month = d.toLocaleDateString('en-US', { month: 'long' })
      return `Next available on ${date}${getOrdinalSuffix(date)} ${month}${chef.deliveryOrPickupWindow ? `, ${chef.deliveryOrPickupWindow}` : ''}`
    } catch {
      return 'Currently unavailable'
    }
  }
  return 'Currently unavailable'
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export default function Home() {
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HomeData>({
    banners: [],
    popularChefs: [],
    popularDishes: [],
    availableToday: [],
  })
  const [activeBanner, setActiveBanner] = useState(0)
  const [activeDates, setActiveDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [noActiveDishes, setNoActiveDishes] = useState(false)
  const [lunchDishes, setLunchDishes] = useState<Dish[]>([])
  const [dinnerDishes, setDinnerDishes] = useState<Dish[]>([])
  const [menuChefs, setMenuChefs] = useState<any[]>([])

  // Add to cart modal state
  const [cartModalDish, setCartModalDish] = useState<AddToCartDish | null>(null)
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const [userZipCode, setUserZipCode] = useState<string>('')
  const [userLat, setUserLat] = useState<number | undefined>()
  const [userLng, setUserLng] = useState<number | undefined>()

  const openAddToCart = (dish: Dish, serveWindow: string) => {
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

  // Deduplicate dates by local calendar day for rendering
  const uniqueDates = useMemo(() => {
    const seen = new Set<string>()
    return activeDates.filter(d => {
      const dt = new Date(d)
      // Use local date parts to avoid UTC timezone mismatch
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activeDates])

  // Fetch active dates from API (mirrors mobile: fetches user address first, then passes lat/lng/zipCode)
  const fetchActiveDates = useCallback(async () => {
    try {
      // Step 1: Get user's address for lat/lng/zipCode
      // Mobile's fetchUserProfile1 reads addressBook from profile; also try getAddresses as fallback
      let userLat: number | undefined
      let userLng: number | undefined
      let userZip: string | undefined
      try {
        // Try profile addressBook first (mobile uses response.data.data.addressBook[0])
        const profileRes = await getProfile()
        const profileData = profileRes.data?.data || profileRes.data
        const addressBook = profileData?.addressBook || []
        if (addressBook.length > 0) {
          const addr = addressBook[0]
          // coordinates can be empty array — check length before accessing
          const coords = addr.location?.coordinates
          if (Array.isArray(coords) && coords.length >= 2) {
            userLat = coords[1]
            userLng = coords[0]
          }
          // Fallback to flat lat/lng fields
          if (!userLat) {
            userLat = addr.location?.lat || addr.lat
            userLng = addr.location?.lng || addr.lng
          }
          userZip = addr.zipCode || addr.zip
        }
        // Fallback to address list API if no zipCode found
        if (!userZip) {
          try {
            const addrRes = await getAddresses()
            const addresses = Array.isArray(addrRes.data?.data) ? addrRes.data.data : []
            const def = addresses.find((a: any) => a.defaultAddress) || addresses[0]
            if (def) {
              const coords = def.location?.coordinates
              if (Array.isArray(coords) && coords.length >= 2) {
                userLat = coords[1]
                userLng = coords[0]
              }
              if (!userLat) {
                userLat = def.location?.lat || def.lat
                userLng = def.location?.lng || def.lng
              }
              userZip = def.zipCode || def.zip
            }
          } catch {
            // getAddresses failed, continue
          }
        }
      } catch (addrErr) {
        console.log('[Home] Address fetch error:', addrErr)
      }

      // Save location for addToCart and dish fetching
      if (userZip) setUserZipCode(userZip)
      if (userLat) setUserLat(userLat)
      if (userLng) setUserLng(userLng)

      // Step 2: Build timezone-aware date string like mobile's momentTz.tz("America/New_York").format()
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const tzOffset = -now.getTimezoneOffset()
      const sign = tzOffset >= 0 ? '+' : '-'
      const absOff = Math.abs(tzOffset)
      const offsetStr = `${sign}${pad(Math.floor(absOff / 60))}:${pad(absOff % 60)}`
      const localISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${offsetStr}`

      // Step 3: Call API with real address data (mobile always passes lat, lng, zipCode)
      const res = await getNextClosedDate({
        date: localISO,
        lat: userLat,
        lng: userLng,
        zipCode: userZip,
      })
      const rawDates: string[] = res.data?.data?.date || res.data?.data || []

      // Deduplicate by local calendar date to avoid showing same day twice
      const seen = new Set<string>()
      const dates = rawDates.filter(d => {
        const dt = new Date(d)
        const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (dates.length > 0) {
        setActiveDates(dates)
        setSelectedDate(prev => prev || dates[0])
        setNoActiveDishes(false)
      } else {
        setNoActiveDishes(true)
        const fallback = Array.from({ length: 15 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() + i)
          return d.toISOString().split('T')[0]
        })
        setActiveDates(fallback)
        setSelectedDate(fallback[0])
      }
    } catch (err) {
      console.log('[Home] getNextClosedDate error:', err)
      const fallback = Array.from({ length: 15 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d.toISOString().split('T')[0]
      })
      setActiveDates(fallback)
      setSelectedDate(fallback[0])
    }
  }, [])

  // Fetch dishes for selected date (like mobile's getTodayMenuCopy)
  const fetchMenuForDate = useCallback(async (dateStr: string) => {
    try {
      // Normalize to local midnight like mobile does with setHours(0,0,0,0)
      const dateObj = new Date(dateStr)
      dateObj.setHours(0, 0, 0, 0)
      const res = await getTodayMenu({
        date: dateObj.toISOString(),
        currentDate: new Date().toISOString(),
        lat: userLat,
        lng: userLng,
        zipCode: userZipCode,
      })
      const responseData = res.data?.data || res.data || {}
      const popularDishes: any[] = responseData.popularDishes || []

      // Extract chefs from same API response (mobile does: responseData.popularChefs)
      const apiChefs: any[] = (responseData.popularChefs || []).filter(
        (c: any) => c.serviceable !== false
      )
      setMenuChefs(apiChefs)

      // Flatten the nested chef→dishes structure (matches mobile's home.js)
      // API returns: popularDishes: [{ _id, menuDate, chefId: { _id, fullName }, dishes: [{ dishId: {...}, deliveryOrPickupWindow: string[], ... }] }]
      const dishes: Dish[] = []
      for (const menu of popularDishes) {
        if (!menu?.dishes) continue
        const chefObj = typeof menu.chefId === 'object' ? menu.chefId : null
        const chefIdStr = chefObj?._id || menu.chefId
        const chefFullName = chefObj?.fullName || chefObj?.kitchenName || menu.chefName || ''
        // Compute distance client-side if backend didn't (missing GOOGLE_MAP_API_KEY)
        const chefCoords = chefObj?.location?.coordinates
        const chefHasCoords = Array.isArray(chefCoords) && chefCoords.length >= 2
        let computedDist: string | undefined
        if (userLat && userLng && chefHasCoords) {
          computedDist = haversineDistance(userLat, userLng, chefCoords[1], chefCoords[0])
        }
        for (const item of menu.dishes) {
          const dishData = item.dishId || item
          // deliveryOrPickupWindow can be an array or string
          const windowArr: string[] = Array.isArray(item.deliveryOrPickupWindow)
            ? item.deliveryOrPickupWindow
            : item.deliveryOrPickupWindow ? [item.deliveryOrPickupWindow] : []
          // Use backend distance if available, otherwise computed
          const itemDistance = (item.distance && item.distance !== 0 && item.distance !== '0')
            ? item.distance
            : computedDist
          dishes.push({
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
            deliveryWindow: itemDistance ? true : (item.deliveryWindow ?? windowArr.some((w: string) => w.includes('10am') || w.includes('4pm'))),
            pickupWindow: itemDistance ? true : item.pickupWindow,
            distance: itemDistance,
            chefName: chefFullName,
            chefRating: item.chefRating,
          } as Dish)
        }
      }

      // Split into lunch and dinner by delivery window (matches mobile exactly)
      // deliveryOrPickupWindow is now a joined string like "10am-1pm, 4pm-7pm"
      const lunch = dishes.filter(d =>
        d.deliveryOrPickupWindow?.includes('10am-1pm')
      )
      const dinner = dishes.filter(d =>
        d.deliveryOrPickupWindow?.includes('4pm-7pm')
      )

      // If no window info, put all in lunch
      if (lunch.length === 0 && dinner.length === 0 && dishes.length > 0) {
        setLunchDishes(dishes)
        setDinnerDishes([])
      } else {
        setLunchDishes(lunch)
        setDinnerDishes(dinner)
      }
    } catch {
      setLunchDishes([])
      setDinnerDishes([])
    }
  }, [userLat, userLng, userZipCode])

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [homeRes] = await Promise.all([getHomeData(), getBanners()])
        setData(homeRes.data?.data || homeRes.data || {})
      } catch {
        // Use empty state
      } finally {
        setLoading(false)
      }
    }
    fetchHome()
    fetchActiveDates()
  }, [fetchActiveDates])

  // Fetch menu when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchMenuForDate(selectedDate)
    }
  }, [selectedDate, fetchMenuForDate])

  // Auto-rotate banners
  useEffect(() => {
    if (data.banners?.length <= 1) return
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % data.banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [data.banners?.length])

  /* ─── showLunchDishes — matches mobile's showLunchDishes() logic ─────────── */
  const showLunch = (() => {
    const today = isDateToday(selectedDate)
    // 1) If selected date is today and current time > 9:30 AM → hide lunch
    if (today) {
      const now = new Date()
      const nineThirtyAM = new Date()
      nineThirtyAM.setHours(9, 30, 0, 0)
      if (now > nineThirtyAM) return false
    }
    // 2) If selected date is today and all lunch dishes are sold out → hide
    if (today && lunchDishes.length > 0) {
      const allSoldOut = lunchDishes.every(d => (d.totalServings || 0) <= 0)
      if (allSoldOut) return false
    }
    // 3) If no lunch dishes but dinner dishes exist → hide lunch section
    if (lunchDishes.length === 0 && dinnerDishes.length > 0) return false
    return true
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Hey {(user as any)?.firstName || (user as any)?.name?.split(' ')[0] || 'there'} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">What are you craving today?</p>
      </div>

      {/* Search bar — hidden on desktop where Header already has one */}
      <button
        onClick={() => navigate('/search')}
        className="md:hidden w-full flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3.5 text-gray-500 hover:bg-gray-200 transition-colors"
      >
        <Search size={20} className="text-gray-400" />
        <span className="text-sm">Search chefs or dishes...</span>
      </button>

      {/* Banners */}
      {data.banners?.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activeBanner * 100}%)` }}
          >
            {data.banners.map(banner => (
              <img
                key={banner.id}
                src={buildImageUrl(banner.image)}
                alt={banner.title}
                className="w-full flex-shrink-0 h-44 object-cover rounded-2xl"
              />
            ))}
          </div>
          {data.banners.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {data.banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeBanner ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Ribbon — matches mobile: calendar icon + horizontal date pills */}
      {uniqueDates.length > 0 && !noActiveDishes && (
        <div className="mt-3 flex items-center overflow-x-auto scrollbar-hide pb-2">
          <CalendarDays size={35} className="text-primary flex-shrink-0 mr-2.5" />
          {uniqueDates.slice(0, 15).map((dateStr, idx) => {
            const isSelected = selectedDate === dateStr
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
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

      {/* No Active Dishes message */}
      {noActiveDishes && (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700">No dishes available</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new menus</p>
        </div>
      )}

      {/* Lunch Dishes Swim Lane — hidden after 9:30 AM on today (matches mobile) */}
      {!noActiveDishes && showLunch && (
        <Section
          title="Lunch Dishes"
          onViewAll={() => navigate('/dishes', { state: { serveWindow: '10am-1pm', dishes: lunchDishes, selectedDate } })}
        >
          {lunchDishes.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {lunchDishes.map(dish => (
                <MealDishCard
                  key={dish.id || dish.menuId}
                  dish={dish}
                  serveWindow="10am-1pm"
                  onNavigate={() => navigate(`/chef/${dish.chefId}`, { state: { selectedDate } })}
                  onAddToCart={() => openAddToCart(dish, '10am-1pm')}
                />
              ))}
            </div>
          ) : (
            <EmptyDishes message="No lunch dishes available for this date" />
          )}
        </Section>
      )}

      {/* Dinner Dishes Swim Lane */}
      {!noActiveDishes && (
        <Section
          title="Dinner Dishes"
          onViewAll={() => navigate('/dishes', { state: { serveWindow: '4pm-7pm', dishes: dinnerDishes, selectedDate } })}
        >
          {dinnerDishes.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {dinnerDishes.map(dish => (
                <MealDishCard
                  key={dish.id || dish.menuId}
                  dish={dish}
                  serveWindow="4pm-7pm"
                  onNavigate={() => navigate(`/chef/${dish.chefId}`, { state: { selectedDate } })}
                  onAddToCart={() => openAddToCart(dish, '4pm-7pm')}
                />
              ))}
            </div>
          ) : (
            <EmptyDishes message="No dinner dishes available for this date" />
          )}
        </Section>
      )}

      {/* Available Chefs Swim Lane */}
      {!noActiveDishes && (
        <Section
          title="Available Chefs"
          onViewAll={() => navigate('/chefs', { state: { chefs: menuChefs, selectedDate } })}
        >
          {menuChefs.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {menuChefs.slice(0, 10).map((chef: any) => (
                <ChefCard
                  key={chef._id || chef.id}
                  chef={chef}
                  onClick={() => navigate(`/chef/${chef._id || chef.id}`, { state: { selectedDate } })}
                />
              ))}
            </div>
          ) : (
            <PlaceholderChefs onNavigate={id => navigate(`/chef/${id}`)} />
          )}
        </Section>
      )}

      {/* Add to Cart Modal */}
      <AddToCartModal
        dish={cartModalDish}
        isOpen={cartModalOpen}
        onClose={() => { setCartModalOpen(false); setCartModalDish(null) }}
        zipCode={userZipCode}
      />
    </div>
  )
}

/* ─── Section Wrapper ──────────────────────────────────────────────────────── */
function Section({ title, onViewAll, children }: { title: string; onViewAll: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">{title}</h3>
        <button onClick={onViewAll} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
          View all <ChevronRight size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

/* ─── Meal Dish Card (matches mobile layout) ───────────────────────────────── */
function MealDishCard({ dish, serveWindow, onNavigate, onAddToCart }: { dish: Dish; serveWindow: string; onNavigate: () => void; onAddToCart: () => void }) {
  const isAvailable = isDishAvailableToday(dish)
  const isSoldOut = (dish.totalServings != null && dish.totalServings <= 0) ||
    (dish.orderByDateNew && new Date(dish.orderByDateNew) < new Date())
  const dishImage = dish.image || dish.dishImage
  const rating = dish.dishRating ?? dish.rating

  return (
    <div
      className="flex-shrink-0 w-56 sm:w-64 card overflow-hidden text-left hover:shadow-lg transition-shadow group cursor-pointer"
    >
      {/* Image with badges — clicking image navigates to chef */}
      <div className="relative h-36 sm:h-40 overflow-hidden" onClick={onNavigate}>
        <img
          src={buildImageUrl(dishImage) || `https://picsum.photos/seed/${dish.id}/256/160`}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Rating badge */}
        {rating != null && rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            <Star size={10} fill="white" stroke="white" />
            {rating.toFixed(1)}
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2 left-2 text-xs font-semibold text-white px-2 py-0.5 rounded ${
          isAvailable ? 'bg-[#8D126E]' : 'bg-black/70'
        }`}>
          {isAvailable ? 'Available Today' : 'Preorder'}
        </div>

        {/* Add to Cart / Sold Out button */}
        <div className="absolute bottom-2 right-2" onClick={e => { e.stopPropagation(); if (!isSoldOut) onAddToCart() }}>
          {isSoldOut ? (
            <div className="flex items-center gap-1 bg-[#8895A1] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md">
              Sold Out
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md hover:bg-primary/90">
              <ShoppingCart size={12} />
              Add
            </div>
          )}
        </div>
      </div>

      {/* Content below image */}
      <div className="p-3 space-y-1.5">
        {/* Name + Price row */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">{dish.name}</p>
          <span className="font-bold text-primary text-sm whitespace-nowrap">${dish.price?.toFixed(2)}</span>
        </div>

        {/* Chef name */}
        {dish.chefName && (
          <p className="text-xs text-gray-500 truncate">{dish.chefName}</p>
        )}

        {/* Order By or Servings */}
        {isAvailable ? (
          dish.totalServings != null && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Servings Available:</span> {dish.totalServings}
            </p>
          )
        ) : (
          dish.orderByDateNew && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Order By:</span> {formatOrderBy(dish.orderByDateNew)}
            </p>
          )
        )}

        {/* Delivery / Pickup window */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {dish.deliveryWindow && (
            <span className="flex items-center gap-1">
              <Check size={10} className="text-primary" />
              Delivery
            </span>
          )}
          {dish.pickupWindow && (
            <span className="flex items-center gap-1">
              <Check size={10} className="text-primary" />
              Pickup{dish.distance ? `: ${dish.distance}` : ''}
            </span>
          )}
          {!dish.deliveryWindow && !dish.pickupWindow && serveWindow && (
            <span className="flex items-center gap-1">
              <Truck size={10} className="text-primary" />
              {serveWindow}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Chef Card (matches mobile layout) ────────────────────────────────────── */
function ChefCard({ chef, onClick }: { chef: Chef; onClick: () => void }) {
  const chefName = chef.fullName || chef.name
  const chefImage = chef.profileImage
  const rating = chef.chefRating ?? chef.rating
  const cuisines = chef.cuisineOffered || chef.cuisine?.join(', ')
  const availabilityText = getChefAvailabilityText(chef)

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 sm:w-52 card p-3 text-left hover:shadow-lg transition-shadow"
    >
      {/* Profile image */}
      <div className="relative">
        <img
          src={buildImageUrl(chefImage) || `https://ui-avatars.com/api/?name=${encodeURIComponent(chefName)}&background=FD207A&color=fff`}
          alt={chefName}
          className="w-full h-28 sm:h-32 object-cover rounded-xl mb-2"
        />
        {/* Rating badge */}
        {rating != null && rating > 0 && (
          <div className="absolute bottom-3 right-1 flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            <Star size={10} fill="white" stroke="white" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="font-semibold text-sm text-gray-900 truncate">{chefName}</p>

      {/* Availability */}
      <p className={`text-xs mt-0.5 truncate ${
        availabilityText.includes('Available Today') ? 'text-green-600' : 'text-gray-500'
      }`}>
        {availabilityText}
      </p>

      {/* Cuisines */}
      {cuisines && (
        <p className="text-xs text-gray-400 mt-1 truncate">{cuisines}</p>
      )}
    </button>
  )
}

/* ─── Empty State ──────────────────────────────────────────────────────────── */
function EmptyDishes({ message }: { message: string }) {
  return (
    <div className="text-center py-8 bg-gray-50 rounded-xl">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

/* ─── Placeholder Chefs ────────────────────────────────────────────────────── */
function PlaceholderChefs({ onNavigate }: { onNavigate: (id: string) => void }) {
  const placeholders = Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    name: `Chef ${i + 1}`,
    rating: 4.5,
    reviewCount: 120,
    cuisine: ['Italian'],
    isAvailableToday: true,
  }))
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
      {placeholders.map(chef => (
        <ChefCard key={chef.id} chef={chef as Chef} onClick={() => onNavigate(chef.id)} />
      ))}
    </div>
  )
}
