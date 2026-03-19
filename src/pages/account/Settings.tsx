import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Bell, HelpCircle, Phone, FileText, Shield, Info, Trash2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { logout } from '../../redux/slices/authSlice'
import { deleteAccount } from '../../helper/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'

const MENU_ITEMS = [
  { icon: Bell, label: 'Notifications', to: '/notifications', color: 'text-orange-500' },
  { icon: HelpCircle, label: 'FAQ', to: '/settings/faq', color: 'text-blue-500' },
  { icon: Phone, label: 'Contact Us', to: '/settings/contact', color: 'text-green-500' },
  { icon: FileText, label: 'Terms Of Services', to: '/settings/terms', color: 'text-indigo-500' },
  { icon: Shield, label: 'Privacy Policy', to: '/settings/privacy', color: 'text-purple-500' },
  { icon: Info, label: 'About Us', to: '/settings/about', color: 'text-teal-500' },
]

export default function Settings() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [deleteStep, setDeleteStep] = useState(0) // 0 = closed, 1 = first confirm, 2 = final confirm
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      dispatch(logout())
      toast.success('Account deleted successfully')
      navigate('/login')
    } catch {
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setDeleting(false)
      setDeleteStep(0)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-3">
        {/* Menu items */}
        <div className="card overflow-hidden divide-y divide-gray-100">
          {MENU_ITEMS.map(({ icon: Icon, label, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <Icon size={20} className={color} />
              <span className="flex-1 text-sm font-medium text-gray-900">{label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Delete Account */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setDeleteStep(1)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 size={20} className="text-red-500" />
            <span className="flex-1 text-sm font-medium text-red-500">Delete Account</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        {/* App version */}
        <p className="text-center text-xs text-gray-400 pt-4 pb-8">
          App version - V1.0.0
        </p>
      </div>

      {/* Step 1: First confirmation */}
      <Modal isOpen={deleteStep === 1} onClose={() => setDeleteStep(0)} title="Delete Account">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <p className="text-gray-600">Are you sure you want to delete account?</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteStep(0)}>No</Button>
          <Button variant="danger" fullWidth onClick={() => setDeleteStep(2)}>Yes</Button>
        </div>
      </Modal>

      {/* Step 2: Final confirmation */}
      <Modal isOpen={deleteStep === 2} onClose={() => setDeleteStep(0)} title="Final Confirmation">
        <p className="text-gray-600 mb-6">
          The account will be permanently deleted and all the data will be lost, are you sure? Press 'Ok' or 'Cancel'
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteStep(0)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDeleteAccount}>Ok</Button>
        </div>
      </Modal>
    </div>
  )
}
