import { useState, useEffect } from 'react'
import { CreditCard, Trash2, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPaymentCards, deletePaymentCard, setDefaultCard } from '../../helper/api'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { PaymentCard } from '../../types'

const BRAND_COLORS: Record<string, string> = {
  visa: 'bg-blue-600',
  mastercard: 'bg-red-600',
  amex: 'bg-green-600',
  discover: 'bg-orange-600',
  default: 'bg-gray-700',
}

export default function PaymentMethods() {
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCards = () => {
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

  return (
    <div>
      <PageHeader
        title="Payment Methods"
        rightAction={
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => toast('Add card via Stripe — coming soon')}>
            Add Card
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={48} strokeWidth={1} />}
          title="No payment methods"
          description="Add a card to start ordering"
          actionLabel="Add Card"
          onAction={() => toast('Add card via Stripe — coming soon')}
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
