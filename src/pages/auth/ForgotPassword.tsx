import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import logoImg from '../../assets/logowannaeat3.png'
import Button from '../../components/common/Button'
import { forgotPassword } from '../../helper/api'

const schema = Yup.object({ email: Yup.string().email('Enter a valid email').required('Email is required') })

export default function ForgotPassword() {
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await forgotPassword(values)
        toast.success('Reset link sent! Check your email.')
        navigate('/login')
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error?.response?.data?.message || 'Failed to send reset email')
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
              <Mail size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
            <p className="text-gray-500 text-sm mt-2">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={18} />}
              {...formik.getFieldProps('email')}
              error={formik.touched.email ? formik.errors.email : undefined}
            />

            <Button type="submit" fullWidth loading={formik.isSubmitting} size="lg">
              Send Reset Link
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
