import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '../../components/common/Input'
import logoImg from '../../assets/logowannaeat3.png'
import Button from '../../components/common/Button'
import { resetPassword } from '../../helper/api'

const schema = Yup.object({
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
})

export default function ResetPassword() {
  const [showPwd, setShowPwd] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await resetPassword({ password: values.password, token })
        toast.success('Password reset successfully!')
        navigate('/login')
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error?.response?.data?.message || 'Failed to reset password')
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
              <Lock size={28} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">New Password</h2>
            <p className="text-gray-500 text-sm mt-2">Choose a strong password</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Input
              label="New Password"
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
            <Button type="submit" fullWidth loading={formik.isSubmitting} size="lg">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
