import { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50',
  secondary: 'bg-secondary text-white hover:bg-secondary-600 active:bg-secondary-700 disabled:opacity-50',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
  danger: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50',
}

const sizes = {
  sm: 'text-sm py-2 px-4 rounded-lg',
  md: 'text-sm py-3 px-6 rounded-xl',
  lg: 'text-base py-4 px-8 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? <Spinner size="sm" color={variant === 'outline' || variant === 'ghost' ? 'gray' : 'white'} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
