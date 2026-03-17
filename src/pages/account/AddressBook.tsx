import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../helper/api'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Address } from '../../types'

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ label: '', street: '', city: '', state: '', zipCode: '' })
  const [saving, setSaving] = useState(false)

  const fetchAddresses = () => {
    getAddresses()
      .then(res => {
        const data = res.data?.data
        // API returns user object with addressBook, or array directly
        const addrs = Array.isArray(data) ? data : (data?.addressBook || [])
        setAddresses(addrs.map((a: any) => ({
          id: a._id?.toString() || a.id || '',
          label: a.label || a.type || '',
          street: a.address1 || a.street || '',
          city: a.city || '',
          state: a.state || '',
          zipCode: a.zipCode || a.zipcode || '',
          isDefault: a.defaultAddress || a.isDefault || false,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(fetchAddresses, [])

  const handleAdd = async () => {
    if (!form.street || !form.city) { toast.error('Street and city are required'); return }
    setSaving(true)
    try {
      // Map frontend field names to API field names
      await addAddress({ address1: form.street, city: form.city, state: form.state, zipCode: form.zipCode, label: form.label, defaultAddress: addresses.length === 0 })
      toast.success('Address added!')
      setShowModal(false)
      setForm({ label: '', street: '', city: '', state: '', zipCode: '' })
      fetchAddresses()
    } catch {
      toast.error('Failed to add address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id)
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
      toast.success('Default address updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div>
      <PageHeader
        title="Address Book"
        rightAction={
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Add
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={48} strokeWidth={1} />}
          title="No addresses saved"
          description="Add a delivery address to get started"
          actionLabel="Add Address"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div key={addr.id} className="card p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                addr.isDefault ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
              }`}>
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                {addr.label && <p className="font-semibold text-gray-900 text-sm">{addr.label}</p>}
                <p className="text-sm text-gray-700">{addr.street}</p>
                <p className="text-xs text-gray-500">{addr.city}, {addr.state} {addr.zipCode}</p>
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary font-medium">
                    <Check size={12} /> Default
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-secondary hover:underline"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Address">
        <div className="space-y-4">
          <Input label="Label (e.g. Home)" placeholder="Home, Work..." value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
          <Input label="Street *" placeholder="123 Main St" value={form.street}
            onChange={e => setForm(p => ({ ...p, street: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City *" placeholder="New York" value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            <Input label="State" placeholder="NY" value={form.state}
              onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
          </div>
          <Input label="Zip Code" placeholder="10001" value={form.zipCode}
            onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
            <Button fullWidth loading={saving} onClick={handleAdd}>Save Address</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
