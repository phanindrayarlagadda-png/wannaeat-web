import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  rightAction?: ReactNode
}

export default function PageHeader({ title, showBack = true, rightAction }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  )
}
