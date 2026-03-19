import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Star, ChevronLeft } from 'lucide-react'
import { getTodayMenu } from '../../helper/api'
import { buildImageUrl } from '../../utils/imageUrl'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'

export default function PopularChefs() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { chefs?: any[]; selectedDate?: string } | null

  const [chefs, setChefs] = useState<any[]>(state?.chefs || [])
  const [loading, setLoading] = useState(!state?.chefs?.length)

  // If no chefs passed via route state, fetch from getTodayMenu (same API as home)
  useEffect(() => {
    if (chefs.length > 0) return
    const fetchChefs = async () => {
      try {
        const dateObj = new Date()
        dateObj.setHours(0, 0, 0, 0)
        const res = await getTodayMenu({
          date: dateObj.toISOString(),
          currentDate: new Date().toISOString(),
        })
        const responseData = res.data?.data || res.data || {}
        const apiChefs = (responseData.popularChefs || []).filter(
          (c: any) => c.serviceable !== false
        )
        setChefs(apiChefs)
      } catch {
        setChefs([])
      } finally {
        setLoading(false)
      }
    }
    fetchChefs()
  }, [])

  const selectedDate = state?.selectedDate

  return (
    <div className="-mx-4 -mt-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={18} className="text-gray-800" />
        </button>
        <span className="text-[17px] font-semibold text-[#292D32]">Available Chefs</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : chefs.length === 0 ? (
        <EmptyState title="No chefs found" description="Check back soon for amazing local chefs" />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {chefs.map((chef: any, idx: number) => {
            const chefId = chef._id || chef.id
            const chefName = chef.fullName || chef.name || chef.kitchenName || ''
            const chefImage = chef.profileImage
            const rating = chef.chefRating ?? chef.rating ?? 0
            const cuisines = chef.cuisineOffered || (chef.cuisine ? chef.cuisine.join(', ') : '')
            const isAvailable = chef.isAvailableToday || chef.availableToday === true

            return (
              <button
                key={chefId || idx}
                onClick={() => navigate(`/chef/${chefId}`, { state: { selectedDate } })}
                className="bg-white rounded-xl overflow-hidden text-left shadow-sm border border-gray-100"
              >
                {/* Chef image */}
                <div className="relative">
                  <img
                    src={buildImageUrl(chefImage) || `https://ui-avatars.com/api/?name=${encodeURIComponent(chefName)}&background=FD207A&color=fff&size=120`}
                    alt={chefName}
                    className="w-full h-32 object-cover"
                  />
                  {/* Rating badge */}
                  {rating > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-[#2E9216] text-white px-1.5 py-0.5 rounded-[5px]">
                      <Star size={10} fill="white" stroke="white" />
                      <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                  {/* Available Today badge */}
                  {isAvailable && (
                    <div className="absolute bottom-2 left-2 bg-[#2E9216] text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      Available Today
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <p className="text-sm font-bold text-[#292D32] truncate">{chefName}</p>
                  {cuisines && (
                    <p className="text-xs text-[#4E555D] mt-0.5 truncate">{cuisines}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
