import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, ChefHat, UtensilsCrossed, Star, SlidersHorizontal, ShoppingCart, Check } from 'lucide-react'
import { search, getAddresses } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { Chef, Dish } from '../../types'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { buildImageUrl } from '../../utils/imageUrl'
import Modal from '../../components/common/Modal'

type Tab = 'all' | 'chef' | 'dish'

interface SearchResults {
  chefs: Chef[]
  dishes: Dish[]
}

interface UserLocation {
  lat: number
  lng: number
  zipCode?: string
}

const CUISINE_OPTIONS = [
  'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai',
  'Japanese', 'Mediterranean', 'American', 'Korean', 'Vietnamese',
  'French', 'Caribbean',
]

const DIETARY_OPTIONS = [
  'Dairy Free', 'Gluten Free', 'Nut Free', 'Keto-Friendly',
  'Low carb', 'Organic', 'Vegan', 'Vegetarian', 'Halal',
]

export default function Search() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults>({ chefs: [], dishes: [] })
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedDietary, setSelectedDietary] = useState<string[]>([])
  const [starFilter, setStarFilter] = useState(0)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const navigate = useNavigate()
  const locationRef = useRef<UserLocation | null>(null)

  // Get user's location on mount
  useEffect(() => {
    // Default fallback location (Short Hills, NJ area — matches most staging chefs)
    const DEFAULT_LOCATION: UserLocation = { lat: 40.7219, lng: -74.2968, zipCode: '07078' }

    getAddresses()
      .then((res) => {
        const raw = res.data?.data
        const addrArr = Array.isArray(raw) ? raw : (raw?.addressBook || [])
        const def = addrArr.find((a: any) => a.defaultAddress) || addrArr[0]
        if (def) {
          const lat = def.location?.coordinates?.[1] || def.lat
          const lng = def.location?.coordinates?.[0] || def.lng
          const zipCode = def.zipCode || def.zip || ''
          if (lat && lng && zipCode) {
            locationRef.current = { lat, lng, zipCode }
          } else {
            locationRef.current = DEFAULT_LOCATION
          }
        } else {
          // No saved addresses — use default
          locationRef.current = DEFAULT_LOCATION
        }
      })
      .catch(() => {
        locationRef.current = DEFAULT_LOCATION
      })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!locationRef.current || !locationRef.current.zipCode) {
            // Keep zipCode from default if geolocation doesn't provide one
            locationRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              zipCode: locationRef.current?.zipCode || DEFAULT_LOCATION.zipCode,
            }
          }
        },
        () => {}
      )
    }
  }, [])

  const doSearch = useCallback(async (q: string, type: Tab) => {
    if (!q.trim()) {
      setResults({ chefs: [], dishes: [] })
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const loc = locationRef.current
      const res = await search({
        q: q.trim(),
        type: type === 'all' ? undefined : type,
        cuisines: selectedCuisines,
        dietary: selectedDietary,
        ...(loc?.lat != null && { userLat: loc.lat }),
        ...(loc?.lng != null && { userLng: loc.lng }),
        ...(loc?.zipCode && { zipCode: loc.zipCode }),
      })
      // API returns chefData and dishData at res.data level (matching mobile's response.data.chefData)
      const raw = res.data?.data || res.data || {}
      const chefs = (raw.chefData || raw.chefs || []).map((c: any) => ({
        ...c,
        id: c._id?.toString() || c.id || '',
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.fullName || 'Chef',
        profileImage: buildImageUrl(c.profileImage),
        cuisine: Array.isArray(c.cuisineOffered) ? c.cuisineOffered : (c.cuisine || []),
        cuisineOffered: typeof c.cuisineOffered === 'string' ? c.cuisineOffered : undefined,
        rating: c.rating || c.chefRating || 0,
        reviewCount: c.reviewCount || 0,
      }))
      // Mobile sorts dishes by menuDate
      const rawDishes = (raw.dishData || raw.dishes || []).sort(
        (a: any, b: any) => new Date(a.menuDate?.substring(0, 10)).getTime() - new Date(b.menuDate?.substring(0, 10)).getTime()
      )
      const dishes = rawDishes.map((d: any) => ({
        ...d,
        id: d._id?.toString() || d.id || '',
        image: buildImageUrl(d.dishImage || d.image),
        dishRating: d.dishRating || d.rating || 0,
        price: d.price || 0,
      }))
      setResults({ chefs, dishes })
    } catch {
      setResults({ chefs: [], dishes: [] })
    } finally {
      setLoading(false)
    }
  }, [selectedCuisines, selectedDietary])

  const debouncedSearch = useDebouncedCallback(doSearch, 400)

  const handleInput = (val: string) => {
    setQuery(val)
    debouncedSearch(val, tab)
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    doSearch(query, t)
  }

  const toggleCuisine = (c: string) => {
    setSelectedCuisines(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const toggleDietary = (d: string) => {
    setSelectedDietary(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  const applyFilters = () => {
    setShowFilters(false)
    if (query.trim()) doSearch(query, tab)
  }

  const clearFilters = () => {
    setSelectedCuisines([])
    setSelectedDietary([])
    setStarFilter(0)
    setMinPrice('')
    setMaxPrice('')
  }

  const activeFilterCount = selectedCuisines.length + selectedDietary.length + (starFilter > 0 ? 1 : 0)
  const hasResults = results.chefs.length > 0 || results.dishes.length > 0
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'chef', label: 'Chefs' },
    { key: 'dish', label: 'Dishes' },
  ]

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          className="w-full border border-gray-300 rounded-2xl pl-11 pr-20 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Search chefs or dishes..."
          value={query}
          onChange={e => handleInput(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); setResults({ chefs: [], dishes: [] }); setSearched(false) }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(true)}
            className={`p-1.5 rounded-lg transition-colors ${activeFilterCount > 0 ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <SearchIcon size={48} strokeWidth={1} />
          <p className="mt-3 text-sm">Search for your favorite dishes and chefs here</p>
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchIcon size={48} strokeWidth={1} />}
          title="No results found"
          description={`No matches for "${query}". Try a different search.`}
        />
      ) : (
        <div className="space-y-6">
          {/* Chef Results */}
          {(tab === 'all' || tab === 'chef') && results.chefs.length > 0 && (
            <div>
              <h3 className="section-title mb-3 flex items-center gap-2">
                <ChefHat size={18} /> Chefs
              </h3>
              <div className="space-y-3">
                {results.chefs.map(chef => (
                  <button
                    key={chef.id}
                    onClick={() => navigate(`/chef/${chef.id}`)}
                    className="w-full card overflow-hidden text-left hover:shadow-md transition-shadow"
                  >
                    {/* Chef card with image, name, availability, cuisines */}
                    <div className="p-4 flex items-center gap-4">
                      <img
                        src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
                        alt={chef.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{chef.fullName || chef.name}</p>
                        {chef.isAvailableToday ? (
                          <p className="text-xs text-green-600 mt-0.5">
                            Available Today{chef.deliveryOrPickupWindow ? `, ${chef.deliveryOrPickupWindow}` : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5">Currently unavailable</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {chef.cuisineOffered || chef.cuisine?.join(', ')}
                        </p>
                      </div>
                      {chef.rating > 0 && (
                        <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          <Star size={10} fill="white" stroke="white" />
                          {chef.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dish Results - 2 column grid like mobile */}
          {(tab === 'all' || tab === 'dish') && results.dishes.length > 0 && (
            <div>
              <h3 className="section-title mb-3 flex items-center gap-2">
                <UtensilsCrossed size={18} /> Dishes
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {results.dishes.map(dish => {
                  const isAvailable = dish.availableToday === true
                  const rating = dish.dishRating ?? dish.rating ?? 0
                  return (
                    <button
                      key={dish.id}
                      onClick={() => navigate(`/chef/${dish.chefId}`)}
                      className="card overflow-hidden text-left hover:shadow-md transition-shadow group"
                    >
                      {/* Image with badges */}
                      <div className="relative h-28 sm:h-32 overflow-hidden">
                        <img
                          src={dish.image || `https://picsum.photos/seed/${dish.id}/160/128`}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Rating badge */}
                        {rating > 0 && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                            <Star size={8} fill="white" stroke="white" />
                            {rating.toFixed(1)}
                          </div>
                        )}
                        {/* Status badge */}
                        <div className={`absolute top-1.5 left-1.5 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded ${
                          isAvailable ? 'bg-[#8D126E]' : 'bg-black/70'
                        }`}>
                          {isAvailable ? 'Available Today' : 'Preorder'}
                        </div>
                        {/* Add to Cart */}
                        <div className="absolute bottom-1.5 right-1.5">
                          <div className="flex items-center gap-0.5 bg-primary text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow">
                            <ShoppingCart size={10} />
                            Add
                          </div>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-2 space-y-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-xs text-gray-900 line-clamp-1 flex-1">{dish.name}</p>
                          <span className="font-bold text-primary text-xs whitespace-nowrap">${dish.price?.toFixed(2)}</span>
                        </div>
                        {dish.chefName && (
                          <p className="text-[10px] text-gray-500 truncate">{dish.chefName}</p>
                        )}
                        {dish.deliveryWindow && (
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <Check size={8} className="text-primary" />
                            Delivery
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filters">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Cuisines */}
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-2">Cuisines</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCuisines.includes(c)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-2">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDietary(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedDietary.includes(d)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-2">Minimum Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    starFilter >= s
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  <Star size={12} fill={starFilter >= s ? '#EAB308' : 'none'} stroke={starFilter >= s ? '#EAB308' : 'currentColor'} />
                  {s}+
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-2">Price Range</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={clearFilters}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={applyFilters}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90"
          >
            Apply Filters
          </button>
        </div>
      </Modal>
    </div>
  )
}
