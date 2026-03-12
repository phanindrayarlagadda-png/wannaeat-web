import { useRef } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Camera, User, Mail, Phone } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { RootState } from '../../redux/store'
import { updateUser } from '../../redux/slices/authSlice'
import { updateProfile, uploadProfileImage } from '../../helper/api'
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

  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await updateProfile(values)
        const updatedUser = res.data?.data || values
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
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await uploadProfileImage(formData)
      const url = res.data?.data?.url
      if (url) {
        dispatch(updateUser({ profileImage: url }))
        toast.success('Profile photo updated!')
      }
    } catch {
      toast.error('Failed to upload image')
    }
  }

  return (
    <div>
      <PageHeader title="Edit Profile" />

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
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
