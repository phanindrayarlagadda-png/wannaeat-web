import { useRef, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Camera, User, Mail, Phone, Plus, Trash2 } from 'lucide-react'
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
  firstName: Yup.string().max(55, 'Max 55 characters').required('First name is required'),
  lastName: Yup.string().max(55, 'Max 55 characters').required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().matches(/^\d{3}-?\d{3}-?\d{4}$/, 'Enter a valid phone number (XXX-XXX-XXXX)'),
})

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function Profile() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const fileRef = useRef<HTMLInputElement>(null)
  const anyUser = user as any
  const [allergies, setAllergies] = useState<string[]>(anyUser?.allergies || [])
  const [newAllergy, setNewAllergy] = useState('')

  const formik = useFormik({
    initialValues: {
      firstName: anyUser?.firstName || '',
      lastName: anyUser?.lastName || '',
      email: user?.email || '',
      phone: anyUser?.phoneNumber || anyUser?.phone || '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await updateProfile({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email,
          phoneNumber: values.phone.replace(/-/g, ''),
          allergies,
        })
        const updatedUser = res.data?.data || {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phoneNumber: values.phone,
          allergies,
        }
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

  const addAllergy = () => {
    const trimmed = newAllergy.trim()
    if (!trimmed || trimmed.length > 20) return
    if (allergies.includes(trimmed)) return
    setAllergies(prev => [...prev, trimmed])
    setNewAllergy('')
  }

  const removeAllergy = (index: number) => {
    setAllergies(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <PageHeader title="Edit Profile" />

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {user?.profileImage ? (
              <img src={buildImageUrl(user.profileImage)} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-md">
                {(anyUser?.firstName || anyUser?.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary/90"
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
            label="First Name"
            leftIcon={<User size={18} />}
            maxLength={55}
            {...formik.getFieldProps('firstName')}
            error={formik.touched.firstName ? (formik.errors.firstName as string) : undefined}
          />
          <Input
            label="Last Name"
            leftIcon={<User size={18} />}
            maxLength={55}
            {...formik.getFieldProps('lastName')}
            error={formik.touched.lastName ? (formik.errors.lastName as string) : undefined}
          />
          <Input
            label="Email"
            type="email"
            leftIcon={<Mail size={18} />}
            disabled
            {...formik.getFieldProps('email')}
            error={formik.touched.email ? (formik.errors.email as string) : undefined}
          />
          <div>
            <Input
              label="Mobile Number"
              type="tel"
              leftIcon={<Phone size={18} />}
              placeholder="XXX-XXX-XXXX"
              value={formik.values.phone}
              onChange={e => formik.setFieldValue('phone', formatPhone(e.target.value))}
              onBlur={formik.handleBlur}
              name="phone"
              error={formik.touched.phone ? (formik.errors.phone as string) : undefined}
            />
          </div>

          {/* Allergies Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {allergies.map((allergy, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                    {allergy}
                    <button type="button" onClick={() => removeAllergy(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergy}
                onChange={e => setNewAllergy(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy() } }}
                placeholder="Add allergy (max 20 chars)"
                maxLength={20}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="px-3 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth loading={formik.isSubmitting} size="lg">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
