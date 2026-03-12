import { useState, useEffect } from 'react'
import { Bell, Moon, Globe, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getNotificationSettings, updateNotificationSettings } from '../../helper/api'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'

interface NotifSettings {
  orderUpdates: boolean
  promotions: boolean
  chat: boolean
  reminders: boolean
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  )
}

export default function Settings() {
  const [notifSettings, setNotifSettings] = useState<NotifSettings>({
    orderUpdates: true, promotions: true, chat: true, reminders: true,
  })
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)

  useEffect(() => {
    getNotificationSettings()
      .then(res => {
        if (res.data?.data) setNotifSettings(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key: keyof NotifSettings, value: boolean) => {
    const updated = { ...notifSettings, [key]: value }
    setNotifSettings(updated)
    try {
      await updateNotificationSettings(updated)
    } catch {
      toast.error('Failed to save settings')
      setNotifSettings(prev => ({ ...prev, [key]: !value }))
    }
  }

  if (loading) return (
    <div>
      <PageHeader title="Settings" />
      <div className="flex justify-center py-12"><Spinner size="lg" /></div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-4">
        {/* Notifications */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <p className="font-semibold text-gray-900">Notifications</p>
          </div>
          {([
            { key: 'orderUpdates', label: 'Order Updates', desc: 'Status changes and delivery alerts' },
            { key: 'promotions', label: 'Promotions', desc: 'Deals and special offers' },
            { key: 'chat', label: 'Chat Messages', desc: 'Messages from chefs' },
            { key: 'reminders', label: 'Reminders', desc: 'Scheduled order reminders' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="px-5 py-4 border-b border-gray-100 last:border-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={notifSettings[key]} onChange={v => handleToggle(key, v)} />
            </div>
          ))}
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Moon size={18} className="text-primary" />
            <p className="font-semibold text-gray-900">Appearance</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Dark Mode</p>
              <p className="text-xs text-gray-500 mt-0.5">Coming soon</p>
            </div>
            <Toggle checked={false} onChange={() => toast('Dark mode coming soon!')} />
          </div>
        </div>

        {/* Language */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <p className="font-semibold text-gray-900">Language</p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-700">English</p>
            <span className="text-xs text-gray-400">More languages coming soon</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-red-100">
          <div className="px-5 py-4 border-b border-red-50 flex items-center gap-2">
            <Trash2 size={18} className="text-red-500" />
            <p className="font-semibold text-red-600">Danger Zone</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 mb-3">
              Deleting your account is permanent and cannot be undone.
            </p>
            <button
              onClick={() => setDeleteModal(true)}
              className="text-sm text-red-500 font-medium hover:underline"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account?">
        <p className="text-gray-600 mb-6">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth onClick={() => toast.error('Please contact support to delete your account')}>
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  )
}
