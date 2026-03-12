import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Clock } from 'lucide-react'
import { getPopularChefs } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Chef } from '../../types'

export default function PopularChefs() {
  const navigate = useNavigate()
  const [chefs, setChefs] = useState<Chef[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPopularChefs()
      .then(res => setChefs(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Popular Chefs" />
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : chefs.length === 0 ? (
        <EmptyState title="No chefs found" description="Check back soon for amazing local chefs" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chefs.map(chef => (
            <button
              key={chef.id}
              onClick={() => navigate(`/chef/${chef.id}`)}
              className="card p-4 text-left hover:shadow-md transition-shadow"
            >
              <img
                src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff&size=120`}
                alt={chef.name}
                className="w-full h-32 object-cover rounded-xl mb-3"
              />
              <p className="font-semibold text-gray-900 truncate">{chef.name}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{chef.cuisine?.join(', ')}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Star size={12} fill="#FD207A" stroke="#FD207A" />
                  <span className="text-xs font-medium">{chef.rating?.toFixed(1)}</span>
                </div>
                {chef.deliveryTime && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={11} />
                    <span className="text-xs">{chef.deliveryTime}</span>
                  </div>
                )}
              </div>
              {chef.isAvailableToday && (
                <span className="mt-2 inline-block text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Available Today
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
