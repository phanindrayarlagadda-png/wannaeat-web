import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/common/Button'
import logoImg from '../../assets/logowannaeat3.png'
import { verifyOTP, sendOTP } from '../../helper/api'

const OTP_LENGTH = 6

export default function OTP() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { email, phone, nextRoute } = (location.state as { email?: string; phone?: string; nextRoute?: string }) || {}

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const updated = [...digits]
    updated[index] = value
    setDigits(updated)
    if (value && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const updated = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { updated[i] = ch })
    setDigits(updated)
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleSubmit = async () => {
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) {
      toast.error('Please enter the complete OTP')
      return
    }
    setLoading(true)
    try {
      await verifyOTP({ otp, email, phone })
      toast.success('OTP verified!')
      navigate(nextRoute || '/')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await sendOTP({ email, phone })
      setDigits(Array(OTP_LENGTH).fill(''))
      refs.current[0]?.focus()
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="WannaEat" className="h-16 mx-auto" />
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
          <p className="text-gray-500 text-sm mb-8">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-gray-700">{email || phone}</span>
          </p>

          {/* OTP inputs */}
          <div className="flex gap-3 justify-center mb-8">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={`
                  w-12 h-12 text-center text-xl font-bold border-2 rounded-xl
                  focus:outline-none transition-all duration-200
                  ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-gray-300 focus:border-primary'}
                `}
              />
            ))}
          </div>

          <Button onClick={handleSubmit} loading={loading} fullWidth size="lg" className="mb-4">
            Verify
          </Button>

          <p className="text-sm text-gray-500">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
