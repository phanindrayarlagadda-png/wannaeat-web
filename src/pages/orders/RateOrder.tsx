import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { rateOrder } from '../../helper/api'
import Button from '../../components/common/Button'
import StarRating from '../../components/common/StarRating'
import PageHeader from '../../components/common/PageHeader'

export default function RateOrder() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [foodRating, setFoodRating] = useState(0)
  const [chefRating, setChefRating] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (foodRating === 0 || chefRating === 0) {
      toast.error('Please rate both food and chef')
      return
    }
    setLoading(true)
    try {
      await rateOrder(orderId!, { foodRating, chefRating, review })
      toast.success('Thank you for your review!')
      navigate(`/orders/${orderId}`)
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Rate Your Order" />

      <div className="space-y-6">
        <div className="card p-6 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <h2 className="text-lg font-bold text-gray-900 mb-1">How was your meal?</h2>
          <p className="text-sm text-gray-500 mb-4">Your feedback helps our chefs improve</p>
        </div>

        {/* Food rating */}
        <div className="card p-5">
          <p className="font-semibold text-gray-900 mb-3">Food Quality</p>
          <div className="flex justify-center">
            <StarRating value={foodRating} onChange={setFoodRating} size={36} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {foodRating === 0 ? 'Tap to rate' :
              foodRating === 1 ? 'Poor' :
              foodRating === 2 ? 'Fair' :
              foodRating === 3 ? 'Good' :
              foodRating === 4 ? 'Very Good' : 'Excellent!'}
          </p>
        </div>

        {/* Chef rating */}
        <div className="card p-5">
          <p className="font-semibold text-gray-900 mb-3">Chef Service</p>
          <div className="flex justify-center">
            <StarRating value={chefRating} onChange={setChefRating} size={36} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {chefRating === 0 ? 'Tap to rate' :
              chefRating === 1 ? 'Poor' :
              chefRating === 2 ? 'Fair' :
              chefRating === 3 ? 'Good' :
              chefRating === 4 ? 'Very Good' : 'Excellent!'}
          </p>
        </div>

        {/* Written review */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Write a review <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={4}
            placeholder="Share your experience..."
            value={review}
            onChange={e => setReview(e.target.value)}
            maxLength={500}
            className="input-field resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{review.length}/500</p>
        </div>

        <Button fullWidth size="lg" loading={loading} onClick={handleSubmit}>
          Submit Review
        </Button>
      </div>
    </div>
  )
}
