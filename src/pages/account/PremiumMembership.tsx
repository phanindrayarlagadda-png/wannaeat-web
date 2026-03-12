import { useState, useEffect } from 'react'
import { Star, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPremiumPlans, subscribePremium } from '../../helper/api'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import PageHeader from '../../components/common/PageHeader'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  features: string[]
  isPopular?: boolean
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 9.99,
    period: '/month',
    features: ['Free delivery on every order', 'Exclusive deals & discounts', 'Priority customer support', 'Early access to new chefs'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 79.99,
    period: '/year',
    features: ['Free delivery on every order', 'Exclusive deals & discounts', 'Priority customer support', 'Early access to new chefs', '2 months free vs monthly'],
    isPopular: true,
  },
]

export default function PremiumMembership() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState('annual')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    getPremiumPlans()
      .then(res => { if (res.data?.data?.length) setPlans(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      await subscribePremium({ planId: selectedPlan })
      toast.success('Welcome to WannaEat Premium! 🎉')
    } catch {
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Premium Membership" />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Premium Membership" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 mb-6 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star size={32} fill="white" stroke="white" />
        </div>
        <h2 className="text-2xl font-bold mb-1">WannaEat Premium</h2>
        <p className="text-white/80 text-sm">Unlimited free delivery + exclusive perks</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {plans.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative card p-5 text-left transition-all ${
              selectedPlan === plan.id
                ? 'border-2 border-primary shadow-md'
                : 'border-2 border-transparent hover:border-gray-200'
            }`}
          >
            {plan.isPopular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className="mb-4">
              <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
              <p className="mt-1">
                <span className="text-3xl font-bold text-primary">${plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </p>
            </div>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <Button fullWidth size="lg" loading={subscribing} onClick={handleSubscribe}>
        Get Premium — ${plans.find(p => p.id === selectedPlan)?.price}
        {plans.find(p => p.id === selectedPlan)?.period}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-4">
        Cancel anytime. No hidden fees. Secure payment via Stripe.
      </p>
    </div>
  )
}
