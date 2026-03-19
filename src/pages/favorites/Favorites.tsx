import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Star, ShoppingCart, ChefHat } from 'lucide-react'
import dayjs from 'dayjs'
import { getFavouriteChefs, getFavouriteDishes, favouriteChef, favouriteDish } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { buildImageUrl } from '../../utils/imageUrl'
import toast from 'react-hot-toast'

type Tab = 'chefs' | 'dishes'

export default function Favorites() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('chefs')
  const [chefs, setChefs] = useState<any[]>([])
  const [dishes, setDishes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    if (tab === 'chefs') {
      getFavouriteChefs()
        .then(res => {
          const data = res.data?.data
          setChefs(Array.isArray(data) ? data : [])
        })
        .catch(() => setChefs([]))
        .finally(() => setLoading(false))
    } else {
      getFavouriteDishes()
        .then(res => {
          const data = res.data?.data
          // API returns menu items with nested dishes - flatten
          const flat: any[] = []
          if (Array.isArray(data)) {
            data.forEach((menu: any) => {
              const chef = menu.chefId || {}
              const menuDate = menu.menuDate
              if (Array.isArray(menu.dishes)) {
                menu.dishes.forEach((d: any) => {
                  flat.push({
                    ...d,
                    menuId: menu._id,
                    menuDate,
                    chefName: chef.fullName || chef.name || '',
                    chefId: chef._id || chef.id || '',
                  })
                })
              }
            })
          }
          setDishes(flat)
        })
        .catch(() => setDishes([]))
        .finally(() => setLoading(false))
    }
  }

  useEffect(fetchData, [tab])

  const handleRemoveChef = async (chefId: string) => {
    try {
      await favouriteChef(chefId)
      toast.success('Removed from favorites')
      setChefs(prev => prev.filter(c => (c._id || c.id) !== chefId))
    } catch {
      toast.error('Failed to remove')
    }
  }

  const handleRemoveDish = async (dishId: string) => {
    try {
      await favouriteDish(dishId)
      toast.success('Removed from favorites')
      setDishes(prev => prev.filter(d => (d._id || d.id) !== dishId))
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div>
      <PageHeader title="Favorites" />

      {/* 2-Tab navigation matching mobile */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {(['chefs', 'dishes'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : tab === 'chefs' ? (
        chefs.length === 0 ? (
          <EmptyState
            icon={<Heart size={56} strokeWidth={1} />}
            title="No favorites found"
            description="You haven't favorited any chefs yet"
            actionLabel="Browse Chefs"
            onAction={() => navigate('/search')}
          />
        ) : (
          <div className="space-y-4">
            {chefs.map(chef => {
              const chefId = chef._id || chef.id
              const photos = [
                ...(chef.profileImage ? [chef.profileImage] : []),
                ...(chef.kitchenPhotos || []),
              ]
              const coverImg = photos[0]
              const cuisines = Array.isArray(chef.cuisineOffered)
                ? chef.cuisineOffered.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')
                : chef.cuisineOffered || ''
              const isAvailable = chef.availableToday === true || chef.availableToday === 'true'

              return (
                <div
                  key={chefId}
                  className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/chef/${chefId}`)}
                >
                  {/* Cover image */}
                  <div className="relative h-44 bg-gray-200">
                    {coverImg ? (
                      <img
                        src={buildImageUrl(coverImg)}
                        alt={chef.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ChefHat size={48} className="text-gray-300" />
                      </div>
                    )}
                    {/* Remove favorite */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveChef(chefId) }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
                    >
                      <Heart size={16} className="text-primary fill-primary" />
                    </button>
                  </div>

                  {/* Chef info overlay card */}
                  <div className="relative mx-6 -mt-8 bg-white rounded-xl shadow-md p-3 z-10">
                    <div className="flex items-center gap-3">
                      {chef.profileImage ? (
                        <img
                          src={buildImageUrl(chef.profileImage)}
                          alt={chef.fullName}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ChefHat size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{chef.fullName || chef.name}</p>
                        <p className="text-xs text-gray-500">
                          {isAvailable ? 'Available Today' : 'Not Available Today'}
                        </p>
                      </div>
                    </div>
                    {cuisines && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        <span className="text-gray-400">Cuisines:</span> {cuisines}
                      </p>
                    )}
                  </div>
                  <div className="h-3" />
                </div>
              )
            })}
          </div>
        )
      ) : (
        dishes.length === 0 ? (
          <EmptyState
            icon={<Heart size={56} strokeWidth={1} />}
            title="No favorites found"
            description="You haven't favorited any dishes yet"
            actionLabel="Browse Dishes"
            onAction={() => navigate('/search')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dishes.map(dish => {
              const dishId = dish._id || dish.id
              const img = dish.dishImage || dish.image
              const rating = dish.dishRating || dish.rating || 0
              const isAvailableToday = dish.availableToday === true || dish.availableToday === 'true'
              const orderByDate = dish.orderByDate || dish.orderByDateNew
              const totalServings = dish.totalServings || 0
              const deliveryWindow = dish.deliveryOrPickupWindow

              return (
                <div key={dishId} className="card overflow-hidden hover:shadow-md transition-shadow">
                  {/* Dish image */}
                  <div className="relative h-36 bg-gray-100">
                    {img ? (
                      <img src={buildImageUrl(img)} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart size={32} className="text-gray-300" />
                      </div>
                    )}

                    {/* Rating badge */}
                    {rating > 0 && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Star size={10} className="fill-white" />
                        {rating.toFixed(1)}
                      </div>
                    )}

                    {/* Availability badge */}
                    {!isAvailableToday && (
                      <div className="absolute top-2 right-2 bg-purple-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        Preorder
                      </div>
                    )}

                    {/* Favorite heart */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveDish(dishId) }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
                      style={{ top: !isAvailableToday ? '28px' : '8px' }}
                    >
                      <Heart size={14} className="text-primary fill-primary" />
                    </button>

                    {/* Add to Cart */}
                    <button className={`absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded ${
                      isAvailableToday
                        ? 'bg-primary text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {isAvailableToday ? 'Add to Cart' : 'Sold Out'}
                    </button>
                  </div>

                  {/* Dish info */}
                  <div className="p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{dish.name}</p>
                      <span className="text-sm font-bold text-primary flex-shrink-0">${dish.price}</span>
                    </div>
                    {dish.chefName && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{dish.chefName}</p>
                    )}
                    {!isAvailableToday && orderByDate && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Order By: {dayjs(orderByDate).format('ddd, DD MMM - hh:mm a')}
                      </p>
                    )}
                    {isAvailableToday && totalServings > 0 && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Servings Available: {totalServings}
                      </p>
                    )}
                    {deliveryWindow && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Delivery: {Array.isArray(deliveryWindow) ? deliveryWindow.join(', ') : deliveryWindow}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
