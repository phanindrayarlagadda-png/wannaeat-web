import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import { getAvailableToday } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Chef } from '../../types'

export default function AvailableToday() {
  const navigate = useNavigate()
  const [chefs, setChefs] = useState<Chef[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailableToday()
      .then(res => setChefs(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Available Today" />

      <p className="text-sm text-gray-500 mb-4">
        These chefs are cooking and delivering today
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : chefs.length === 0 ? (
        <EmptyState
          title="No chefs available today"
          description="Check back later — chefs update their availability daily"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chefs.map(chef => (
            <button
              key={chef.id}
              onClick={() => navigate(`/chef/${chef.id}`)}
              className="card p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
                  alt={chef.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{chef.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{chef.cuisine?.join(', ')}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#FD207A" stroke="#FD207A" />
                    <span className="text-xs font-medium">{chef.rating?.toFixed(1)}</span>
                  </div>
                  {chef.minimumOrder && (
                    <span className="text-xs text-gray-500">
                      Min. ${chef.minimumOrder}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-green-600 font-medium flex items-center gap-1 flex-shrink-0">
                <MapPin size={12} />
                Nearby
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
