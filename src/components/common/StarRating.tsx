import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  max?: number
  size?: number
  onChange?: (rating: number) => void
  showCount?: boolean
  count?: number
}

export default function StarRating({
  value,
  max = 5,
  size = 16,
  onChange,
  showCount,
  count,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i + 1)}
          className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            size={size}
            fill={i < Math.round(value) ? '#FD207A' : 'none'}
            stroke={i < Math.round(value) ? '#FD207A' : '#D1D5DB'}
          />
        </button>
      ))}
      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  )
}
