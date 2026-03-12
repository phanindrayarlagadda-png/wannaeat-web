import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Clock, Star } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { getHomeData, getBanners } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import { Chef, Dish } from '../../types'

interface HomeData {
  banners: { id: string; image: string; title?: string }[]
  popularChefs: Chef[]
  popularDishes: Dish[]
  availableToday: Chef[]
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

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [homeRes] = await Promise.all([getHomeData(), getBanners()])
        setData(homeRes.data?.data || homeRes.data || {})
      } catch {
        // Use empty state - API not yet connected
      } finally {
        setLoading(false)
      }
    }
    fetchHome()
  }, [])

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
          Hey {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">What are you craving today?</p>
      </div>

      {/* Search bar */}
      <button
        onClick={() => navigate('/search')}
        className="w-full flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3.5 text-gray-500 hover:bg-gray-200 transition-colors"
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
                src={banner.image}
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

      {/* Available Today */}
      <Section
        title="Available Today"
        onViewAll={() => navigate('/available-today')}
      >
        {data.availableToday?.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {data.availableToday.slice(0, 8).map(chef => (
              <ChefCard key={chef.id} chef={chef} onClick={() => navigate(`/chef/${chef.id}`)} />
            ))}
          </div>
        ) : (
          <PlaceholderChefs onNavigate={id => navigate(`/chef/${id}`)} />
        )}
      </Section>

      {/* Popular Chefs */}
      <Section
        title="Popular Chefs"
        onViewAll={() => navigate('/chefs')}
      >
        {data.popularChefs?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.popularChefs.slice(0, 6).map(chef => (
              <ChefCard key={chef.id} chef={chef} onClick={() => navigate(`/chef/${chef.id}`)} vertical />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ChefCardSkeleton key={i} />
            ))}
          </div>
        )}
      </Section>

      {/* Popular Dishes */}
      <Section
        title="Popular Dishes"
        onViewAll={() => navigate('/dishes')}
      >
        {data.popularDishes?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.popularDishes.slice(0, 4).map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, onViewAll, children }: { title: string; onViewAll: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">{title}</h3>
        <button onClick={onViewAll} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
          See All <ChevronRight size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

function ChefCard({ chef, onClick, vertical }: { chef: Chef; onClick: () => void; vertical?: boolean }) {
  if (vertical) {
    return (
      <button onClick={onClick} className="card p-3 text-left hover:shadow-md transition-shadow">
        <img
          src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
          alt={chef.name}
          className="w-full h-24 object-cover rounded-xl mb-2"
        />
        <p className="font-semibold text-sm text-gray-900 truncate">{chef.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={12} fill="#FD207A" stroke="#FD207A" />
          <span className="text-xs text-gray-600">{chef.rating?.toFixed(1)} ({chef.reviewCount})</span>
        </div>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-32 card p-3 text-center hover:shadow-md transition-shadow"
    >
      <img
        src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
        alt={chef.name}
        className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-primary/20"
      />
      <p className="font-semibold text-xs text-gray-900 truncate">{chef.name}</p>
      {chef.isAvailableToday && (
        <span className="inline-block mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          Available
        </span>
      )}
    </button>
  )
}

function DishCard({ dish }: { dish: Dish }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/chef/${dish.chefId}`)}
      className="card flex gap-3 p-3 text-left hover:shadow-md transition-shadow"
    >
      <img
        src={dish.image || `https://picsum.photos/seed/${dish.id}/80/80`}
        alt={dish.name}
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{dish.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dish.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary text-sm">${dish.price?.toFixed(2)}</span>
          {dish.mealTime && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {dish.mealTime}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

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

function ChefCardSkeleton() {
  return (
    <div className="card p-3 animate-pulse">
      <div className="w-full h-24 bg-gray-200 rounded-xl mb-2" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

function DishCardSkeleton() {
  return (
    <div className="card flex gap-3 p-3 animate-pulse">
      <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}
