import { useState, useEffect } from 'react'
import { Tag, Copy, Check } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getOffers } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Offer } from '../../types'

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    getOffers()
      .then(res => setOffers(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = (offer: Offer) => {
    if (!offer.code) return
    navigator.clipboard.writeText(offer.code).then(() => {
      setCopiedId(offer.id)
      toast.success(`Code "${offer.code}" copied!`)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div>
      <PageHeader title="Offers & Deals" showBack={false} />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<Tag size={56} strokeWidth={1} />}
          title="No offers right now"
          description="Check back soon for exclusive deals"
        />
      ) : (
        <div className="space-y-4">
          {offers.map(offer => (
            <div key={offer.id} className="card overflow-hidden">
              {offer.image && (
                <img src={offer.image} alt={offer.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{offer.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  </div>
                  <div className="flex-shrink-0 bg-primary/10 rounded-xl px-3 py-2 text-center">
                    <p className="text-xl font-bold text-primary">
                      {offer.discountType === 'percentage'
                        ? `${offer.discountValue}%`
                        : `$${offer.discountValue}`}
                    </p>
                    <p className="text-xs text-primary/70">OFF</p>
                  </div>
                </div>

                {offer.minOrderAmount && (
                  <p className="text-xs text-gray-500 mt-2">
                    Min. order: ${offer.minOrderAmount}
                  </p>
                )}
                {offer.expiresAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Expires {dayjs(offer.expiresAt).format('MMM D, YYYY')}
                  </p>
                )}

                {offer.code && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="font-mono font-bold text-gray-900 tracking-widest text-sm">
                        {offer.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(offer)}
                      className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-colors"
                    >
                      {copiedId === offer.id ? (
                        <><Check size={16} /> Copied</>
                      ) : (
                        <><Copy size={16} /> Copy</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
