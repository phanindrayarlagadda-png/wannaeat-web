import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Phone, Mail, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import logoImg from '../../assets/logowannaeat3.png'
import Button from '../../components/common/Button'
import { sendOTP, verifyOTP, resetPassword } from '../../helper/api'

const phoneSchema = Yup.object({
  phoneNumber: Yup.string().matches(/^\d{10}$/, 'Enter a valid 10-digit number').required('Phone number is required'),
})

const otpSchema = Yup.object({
  otp: Yup.string().length(6, 'Enter 6-digit OTP').required('OTP is required'),
})

const resetSchema = Yup.object({
  newPassword: Yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
})

type Step = 'phone' | 'otp' | 'reset'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const phoneForm = useFormik({
    initialValues: { phoneNumber: '' },
    validationSchema: phoneSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        await sendOTP({ phone: values.phoneNumber })
        setPhoneNumber(values.phoneNumber)
        setStep('otp')
        toast.success('OTP sent to your phone!')
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to send OTP')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const otpForm = useFormik({
    initialValues: { otp: '' },
    validationSchema: otpSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        await verifyOTP({ otp: values.otp, phone: phoneNumber })
        setStep('reset')
        toast.success('OTP verified!')
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Invalid OTP')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const resetForm = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema: resetSchema,
    onSubmit: async (values) => {
      setSubmitting(true)
      try {
        await resetPassword({
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
          phoneNumber,
          countryCode: '+1',
        })
        toast.success('Password reset successfully!')
        navigate('/login')
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to reset password')
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="WannaEat" className="h-16 mx-auto" />
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 'phone' ? <Phone size={28} className="text-primary" /> :
               step === 'otp' ? <Mail size={28} className="text-primary" /> :
               <Key size={28} className="text-primary" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'phone' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'New Password'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {step === 'phone' ? 'Enter your phone number to receive an OTP' :
               step === 'otp' ? `Enter the 6-digit code sent to ${phoneNumber}` :
               'Set your new password'}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['phone', 'otp', 'reset'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-primary text-white' :
                  (['phone', 'otp', 'reset'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          {step === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="1234567890"
                leftIcon={<Phone size={18} />}
                {...phoneForm.getFieldProps('phoneNumber')}
                error={phoneForm.touched.phoneNumber ? phoneForm.errors.phoneNumber : undefined}
              />
              <Button type="submit" fullWidth loading={submitting} size="lg">
                Send OTP
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit} className="space-y-4">
              <Input
                label="OTP Code"
                type="text"
                placeholder="123456"
                leftIcon={<Mail size={18} />}
                {...otpForm.getFieldProps('otp')}
                error={otpForm.touched.otp ? otpForm.errors.otp : undefined}
              />
              <Button type="submit" fullWidth loading={submitting} size="lg">
                Verify OTP
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={resetForm.handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                leftIcon={<Key size={18} />}
                {...resetForm.getFieldProps('newPassword')}
                error={resetForm.touched.newPassword ? resetForm.errors.newPassword : undefined}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                leftIcon={<Key size={18} />}
                {...resetForm.getFieldProps('confirmPassword')}
                error={resetForm.touched.confirmPassword ? resetForm.errors.confirmPassword : undefined}
              />
              <Button type="submit" fullWidth loading={submitting} size="lg">
                Reset Password
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
