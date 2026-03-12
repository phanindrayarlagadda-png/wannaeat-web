import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Clock, Heart, Plus, Minus, ShoppingCart, ChevronLeft } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { getChefProfile, getChefMenu } from '../../helper/api'
import { addItem, updateQuantity, selectCartItemCount } from '../../redux/slices/cartSlice'
import { RootState } from '../../redux/store'
import Spinner from '../../components/common/Spinner'
import { Chef, Dish } from '../../types'

type MealTab = 'lunch' | 'dinner' | 'all'

export default function ChefProfile() {
  const { chefId } = useParams<{ chefId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [chef, setChef] = useState<Chef | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [mealTab, setMealTab] = useState<MealTab>('all')
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  const cartItems = useSelector((state: RootState) => state.cart.items)
  const cartCount = useSelector(selectCartItemCount)

  useEffect(() => {
    const fetchData = async () => {
      if (!chefId) return
      try {
        const [chefRes, menuRes] = await Promise.all([
          getChefProfile(chefId),
          getChefMenu(chefId),
        ])
        setChef(chefRes.data?.data || chefRes.data)
        setDishes(menuRes.data?.data || [])
      } catch {
        // show error state
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [chefId])

  const getItemQty = (dishId: string) =>
    cartItems.find(i => i.dishId === dishId)?.quantity || 0

  const handleAdd = (dish: Dish) => {
    const cartChefId = cartItems[0]?.chefId
    if (cartChefId && cartChefId !== dish.chefId) {
      toast.error('Clear your cart before ordering from a different chef.')
      return
    }
    dispatch(addItem({
      id: dish.id,
      dishId: dish.id,
      dishName: dish.name,
      chefId: dish.chefId,
      chefName: chef?.name,
      price: dish.price,
      quantity: 1,
      image: dish.image,
    }))
    toast.success('Added to cart!')
  }

  const handleUpdateQty = (dishId: string, delta: number) => {
    const current = getItemQty(dishId)
    dispatch(updateQuantity({ dishId, quantity: current + delta }))
  }

  const filteredDishes = mealTab === 'all' ? dishes : dishes.filter(d => d.mealTime === mealTab)

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  if (!chef) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Chef not found</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-4">
      {/* Cover image + back */}
      <div className="relative">
        <div className="h-52 bg-gradient-to-br from-primary/20 to-secondary/20">
          {chef.coverImage && (
            <img src={chef.coverImage} alt={chef.name} className="w-full h-full object-cover" />
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setLiked(l => !l)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md"
        >
          <Heart size={20} fill={liked ? '#FD207A' : 'none'} stroke={liked ? '#FD207A' : '#374151'} />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Chef info */}
        <div className="card p-4 -mt-10 mx-4 relative z-10">
          <div className="flex items-start gap-4">
            <img
              src={chef.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=FD207A&color=fff`}
              alt={chef.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{chef.name}</h1>
              <p className="text-sm text-gray-500 truncate">{chef.cuisine?.join(', ')}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star size={14} fill="#FD207A" stroke="#FD207A" />
                  <span className="text-sm font-medium">{chef.rating?.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({chef.reviewCount})</span>
                </div>
                {chef.deliveryTime && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock size={14} />
                    <span className="text-xs">{chef.deliveryTime}</span>
                  </div>
                )}
                {chef.isAvailableToday && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    Available Today
                  </span>
                )}
              </div>
            </div>
          </div>
          {chef.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{chef.bio}</p>}
        </div>

        {/* Meal tabs */}
        <div className="flex gap-2">
          {(['all', 'lunch', 'dinner'] as MealTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMealTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                mealTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dishes */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No dishes available for this time</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredDishes.map(dish => {
              const qty = getItemQty(dish.id)
              return (
                <div key={dish.id} className="card p-4 flex gap-3">
                  <img
                    src={dish.image || `https://picsum.photos/seed/${dish.id}/80`}
                    alt={dish.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{dish.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dish.description}</p>
                        <p className="font-bold text-primary mt-2">${dish.price?.toFixed(2)}</p>
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleUpdateQty(dish.id, -1)}
                            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-gray-900 w-5 text-center">{qty}</span>
                          <button
                            onClick={() => handleUpdateQty(dish.id, 1)}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-600"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdd(dish)}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
    </div>
  )
}
