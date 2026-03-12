import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { getPopularDishes } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Dish } from '../../types'

export default function PopularDishes() {
  const navigate = useNavigate()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'lunch' | 'dinner'>('all')

  useEffect(() => {
    getPopularDishes()
      .then(res => setDishes(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? dishes : dishes.filter(d => d.mealTime === filter)

  return (
    <div>
      <PageHeader title="Popular Dishes" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'lunch', 'dinner'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No dishes found" description="Try a different filter" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(dish => (
            <button
              key={dish.id}
              onClick={() => navigate(`/chef/${dish.chefId}`)}
              className="card p-4 flex gap-3 text-left hover:shadow-md transition-shadow"
            >
              <img
                src={dish.image || `https://picsum.photos/seed/${dish.id}/100`}
                alt={dish.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{dish.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dish.description}</p>
                <p className="text-xs text-gray-400 mt-1">{dish.chefName}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary">${dish.price?.toFixed(2)}</span>
                  {dish.mealTime && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} /> {dish.mealTime}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
