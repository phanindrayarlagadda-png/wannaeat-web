import { useState, useEffect } from 'react'
import { CreditCard, Trash2, Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getPaymentCards, deletePaymentCard, setDefaultCard, getSetupIntent, addPaymentCard } from '../../helper/api'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { PaymentCard } from '../../types'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const BRAND_COLORS: Record<string, string> = {
  visa: 'bg-blue-600',
  mastercard: 'bg-red-600',
  amex: 'bg-green-600',
  discover: 'bg-orange-600',
  default: 'bg-gray-700',
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

/* ── Add Card Form (inside Stripe Elements provider) ── */
function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSaving(true)
    try {
      // 1. Get SetupIntent client secret from backend
      const res = await getSetupIntent()
      const clientSecret = res.data?.data?.clientSecret
      if (!clientSecret) throw new Error('Could not create setup intent')

      // 2. Confirm card setup with Stripe
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      })
      if (error) throw new Error(error.message)

      // 3. Attach the payment method to the customer on backend
      await addPaymentCard({ paymentMethodId: setupIntent?.payment_method })
      toast.success('Card added successfully!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add card')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6 border-2 border-primary/20 bg-pink-50/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add New Card</h3>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Use Stripe test card: <span className="font-mono text-gray-600">4242 4242 4242 4242</span> — any future date, any CVC
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving || !stripe}>
            {saving ? <><Spinner size="sm" /> Saving...</> : 'Save Card'}
          </Button>
        </div>
      </form>
    </div>
  )
}

/* ── Main Page ── */
export default function PaymentMethods() {
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchCards = () => {
    setLoading(true)
    getPaymentCards()
      .then(res => setCards(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(fetchCards, [])

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentCard(id)
      setCards(prev => prev.filter(c => c.id !== id))
      toast.success('Card removed')
    } catch {
      toast.error('Failed to remove card')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultCard(id)
      setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })))
      toast.success('Default card updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleAddCard = () => setShowAddForm(true)

  const handleCardAdded = () => {
    setShowAddForm(false)
    fetchCards()
  }

  return (
    <div>
      <PageHeader
        title="Payment Methods"
        rightAction={
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={handleAddCard}>
            Add Card
          </Button>
        }
      />

      {/* Add Card Form */}
      {showAddForm && (
        <div className="mb-6">
          <Elements stripe={stripePromise}>
            <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowAddForm(false)} />
          </Elements>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : cards.length === 0 && !showAddForm ? (
        <EmptyState
          icon={<CreditCard size={48} strokeWidth={1} />}
          title="No payment methods"
          description="Add a card to start ordering"
          actionLabel="Add Card"
          onAction={handleAddCard}
        />
      ) : (
        <div className="space-y-3">
          {cards.map(card => {
            const brandColor = BRAND_COLORS[card.brand?.toLowerCase()] || BRAND_COLORS.default
            return (
              <div key={card.id} className="card p-4 flex items-center gap-4">
                <div className={`w-12 h-9 ${brandColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold uppercase">{card.brand?.slice(0, 4)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 capitalize">
                    {card.brand} ending in {card.last4}
                  </p>
                  <p className="text-xs text-gray-500">Expires {card.expMonth}/{card.expYear}</p>
                  {card.isDefault && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                      <Check size={12} /> Default
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {!card.isDefault && (
                    <button onClick={() => handleSetDefault(card.id)} className="text-xs text-secondary hover:underline">
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        🔒 Your payment information is secured with Stripe
      </p>
    </div>
  )
}
