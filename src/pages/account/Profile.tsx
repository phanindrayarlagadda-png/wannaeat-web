import { useRef } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Camera, User, Mail, Phone } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { RootState } from '../../redux/store'
import { updateUser } from '../../redux/slices/authSlice'
import { updateProfile } from '../../helper/api'
import { buildImageUrl } from '../../utils/imageUrl'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'

const schema = Yup.object({
  name: Yup.string().min(2).required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().matches(/^\d{10}$/, 'Enter a valid 10-digit number'),
})

export default function Profile() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const fileRef = useRef<HTMLInputElement>(null)

  // Build display name from API fields (firstName/lastName) or fallback to name
  const anyUser = user as any
  const displayName = anyUser
    ? (`${anyUser.firstName || ''} ${anyUser.lastName || ''}`.trim() || anyUser.name || '')
    : ''
  const displayPhone = anyUser?.phoneNumber || anyUser?.phone || ''

  const formik = useFormik({
    initialValues: {
      name: displayName,
      email: user?.email || '',
      phone: displayPhone,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Split full name into firstName / lastName for the API
        const parts = values.name.trim().split(/\s+/)
        const firstName = parts[0] || ''
        const lastName = parts.slice(1).join(' ') || ''
        const res = await updateProfile({ firstName, lastName, email: values.email, phoneNumber: values.phone })
        const updatedUser = res.data?.data || { firstName, lastName, email: values.email, phoneNumber: values.phone }
        dispatch(updateUser(updatedUser))
        toast.success('Profile updated!')
      } catch {
        toast.error('Failed to update profile')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    // Convert to base64 and update via updateProfile (uploadProfileImage endpoint removed)
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string
        await updateProfile({ profileImage: base64 })
        dispatch(updateUser({ profileImage: base64 }))
        toast.success('Profile photo updated!')
      } catch {
        toast.error('Failed to upload image')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <PageHeader title="Edit Profile" />

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {user?.profileImage ? (
              <img src={buildImageUrl(user.profileImage)} alt={displayName || 'Profile'} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-md">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-600"
            >
              <Camera size={16} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          <p className="text-sm text-gray-500 mt-2">Tap the camera to change photo</p>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="card p-5 space-y-4">
          <Input
            label="Full Name"
            leftIcon={<User size={18} />}
            {...formik.getFieldProps('name')}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          <Input
            label="Email"
            type="email"
            leftIcon={<Mail size={18} />}
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? formik.errors.email : undefined}
          />
          <Input
            label="Phone"
            type="tel"
            leftIcon={<Phone size={18} />}
            {...formik.getFieldProps('phone')}
            error={formik.touched.phone ? formik.errors.phone : undefined}
          />
          <Button type="submit" fullWidth loading={formik.isSubmitting} size="lg">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
