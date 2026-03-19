import { useNavigate } from 'react-router-dom'
import { ChefHat, UtensilsCrossed, CalendarDays, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'

const SERVICES = [
  {
    icon: ChefHat,
    label: 'Private Chef Experience',
    description: 'Book a private chef for an exclusive dining experience at your home.',
    slug: 'private-chef-experience',
    color: 'bg-pink-50 text-pink-500',
  },
  {
    icon: UtensilsCrossed,
    label: 'Catering',
    description: 'Professional catering services for events, parties, and gatherings.',
    slug: 'catering',
    color: 'bg-orange-50 text-orange-500',
  },
  {
    icon: CalendarDays,
    label: 'Daily Meals',
    description: 'Subscribe to daily home-cooked meals delivered to your door.',
    slug: 'daily-meals',
    color: 'bg-green-50 text-green-500',
  },
]

export default function Services() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Services" />

      <div className="space-y-3">
        {SERVICES.map(({ icon: Icon, label, description, slug, color }) => (
          <button
            key={slug}
            onClick={() => navigate(`/cms/${slug}`)}
            className="card w-full flex items-center gap-4 p-4 text-left hover:border-gray-300 transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
