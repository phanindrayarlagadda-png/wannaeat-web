import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { signUp } from '../../helper/api'
import { setCredentials } from '../../redux/slices/authSlice'

const schema = Yup.object({
  name: Yup.string().min(2, 'Min 2 characters').required('Name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string().matches(/^\d{10}$/, 'Enter a valid 10-digit phone').required('Phone is required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
})

export default function SignUp() {
  const [showPwd, setShowPwd] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await signUp(values)
        const { token, user } = res.data
        dispatch(setCredentials({ user, token }))
        toast.success('Account created successfully!')
        navigate('/')
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error?.response?.data?.message || 'Sign up failed. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-primary">Wanna</span>
            <span className="text-gray-900">Eat</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Join and order from local chefs</p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              leftIcon={<User size={18} />}
              {...formik.getFieldProps('name')}
              error={formik.touched.name ? formik.errors.name : undefined}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={18} />}
              {...formik.getFieldProps('email')}
              error={formik.touched.email ? formik.errors.email : undefined}
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="1234567890"
              leftIcon={<Phone size={18} />}
              {...formik.getFieldProps('phone')}
              error={formik.touched.phone ? formik.errors.phone : undefined}
            />

            <Input
              label="Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 characters"
              leftIcon={<Lock size={18} />}
              rightIcon={showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              onRightIconClick={() => setShowPwd(p => !p)}
              {...formik.getFieldProps('password')}
              error={formik.touched.password ? formik.errors.password : undefined}
            />

            <Input
              label="Confirm Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Repeat password"
              leftIcon={<Lock size={18} />}
              {...formik.getFieldProps('confirmPassword')}
              error={formik.touched.confirmPassword ? formik.errors.confirmPassword : undefined}
            />

            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>

            <Button type="submit" fullWidth loading={formik.isSubmitting} size="lg">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
