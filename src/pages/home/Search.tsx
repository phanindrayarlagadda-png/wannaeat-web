import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, ChefHat, UtensilsCrossed, Star } from 'lucide-react'
import { search, getAddresses } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { Chef, Dish } from '../../types'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { buildImageUrl } from '../../utils/imageUrl'

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

export default function Search() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults>({ chefs: [], dishes: [] })
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()
  const locationRef = useRef<UserLocation | null>(null)

  // Get user's location on mount: try saved address first (has zipCode), then browser geolocation
  useEffect(() => {
    // Try to get default address with zipCode from user's saved addresses
    getAddresses()
      .then((res) => {
        const addresses = res.data?.data || []
        const def = addresses.find((a: any) => a.defaultAddress) || addresses[0]
        if (def) {
          locationRef.current = {
            lat: def.location?.lat || def.lat,
            lng: def.location?.lng || def.lng,
            zipCode: def.zipCode || def.zip || '',
          }
        }
      })
      .catch(() => {})

    // Also try browser geolocation as fallback/supplement
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!locationRef.current) {
            locationRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
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
        ...(loc?.lat != null && { userLat: loc.lat }),
        ...(loc?.lng != null && { userLng: loc.lng }),
        ...(loc?.zipCode && { zipCode: loc.zipCode }),
      })
      const raw = res.data?.data || { chefs: [], dishes: [] }
      // Normalize search results: fix image URLs and field names
      const chefs = (raw.chefs || []).map((c: any) => ({
        ...c,
        id: c._id?.toString() || c.id || '',
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.fullName || 'Chef',
        profileImage: buildImageUrl(c.profileImage),
        cuisine: Array.isArray(c.cuisineOffered) ? c.cuisineOffered : (c.cuisine || []),
        rating: c.rating || 0,
        reviewCount: c.reviewCount || 0,
      }))
      const dishes = (raw.dishes || []).map((d: any) => ({
        ...d,
        id: d._id?.toString() || d.id || '',
        image: buildImageUrl(d.dishImage || d.image),
        price: d.price || 0,
      }))
      setResults({ chefs, dishes })
    } catch {
      setResults({ chefs: [], dishes: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedSearch = useDebouncedCallback(doSearch, 400)

  const handleInput = (val: string) => {
    setQuery(val)
    debouncedSearch(val, tab)
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    doSearch(query, t)
  }

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
          className="w-full border border-gray-300 rounded-2xl pl-11 pr-10 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Search chefs or dishes..."
          value={query}
          onChange={e => handleInput(e.target.value)}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults({ chefs: [], dishes: [] }); setSearched(false) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
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
          <p className="mt-3 text-sm">Search for chefs or dishes</p>
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchIcon size={48} strokeWidth={1} />}
          title="No results found"
          description={`No matches for "${query}". Try a different search.`}
        />
      ) : (
        <div className="space-y-6">
          {/* Chefs */}
          {(tab === 'all' || tab === 'chef') && results.chefs.length > 0 && (
            <div>
              <h3 className="section-title mb-3 flex items-center gap-2">
                <ChefHat size={18} /> Chefs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.chefs.map(chef => (
                  <button
                    key={chef.id}
                    onClick={() => navigate(`/chef/${chef.id}`)}
                    className="card p-4 flex items-center gap-3 text-left hover:shadow-md transition-shadow"
                  >
                    <img
                      src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
                      alt={chef.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{chef.name}</p>
                      <p className="text-xs text-gray-500 truncate">{chef.cuisine?.join(', ')}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} fill="#FD207A" stroke="#FD207A" />
                        <span className="text-xs text-gray-600">{chef.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    {chef.isAvailableToday && (
                      <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                        Available
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dishes */}
          {(tab === 'all' || tab === 'dish') && results.dishes.length > 0 && (
            <div>
              <h3 className="section-title mb-3 flex items-center gap-2">
                <UtensilsCrossed size={18} /> Dishes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.dishes.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => navigate(`/chef/${dish.chefId}`)}
                    className="card p-3 flex gap-3 text-left hover:shadow-md transition-shadow"
                  >
                    <img
                      src={dish.image || `https://picsum.photos/seed/${dish.id}/80/80`}
                      alt={dish.name}
                      className="w-18 h-18 rounded-xl object-cover flex-shrink-0"
                      style={{ width: 72, height: 72 }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-1">{dish.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{dish.description}</p>
                      <p className="font-bold text-primary text-sm mt-1">${dish.price?.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
