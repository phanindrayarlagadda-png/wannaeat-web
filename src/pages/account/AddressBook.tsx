import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Plus, Trash2, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '../../helper/api'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import PageHeader from '../../components/common/PageHeader'
import { Address } from '../../types'
import { parseGooglePlace } from '../../utils/addressHelper'

interface AddressForm {
  label: string
  street: string
  address2: string
  city: string
  state: string
  zipCode: string
  lat?: number
  lng?: number
  placeId?: string
  country?: string
}

const emptyForm: AddressForm = { label: '', street: '', address2: '', city: '', state: '', zipCode: '' }

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const fetchAddresses = () => {
    getAddresses()
      .then(res => {
        const data = res.data?.data
        // API returns user object with addressBook, or array directly
        const addrs = Array.isArray(data) ? data : (data?.addressBook || [])
        setAddresses(addrs.map((a: any) => ({
          id: a._id?.toString() || a.id || '',
          label: a.label || a.addressType || a.type || '',
          street: a.address1 || a.placeName || a.street || '',
          address2: a.address2 || '',
          placeName: a.placeName || '',
          city: a.city || '',
          state: a.state || '',
          zipCode: a.zipCode || a.zipcode || '',
          isDefault: a.defaultAddress || a.isDefault || false,
          lat: a.location?.lat || a.lat || a.latitude || undefined,
          lng: a.location?.lng || a.lng || a.longitude || undefined,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(fetchAddresses, [])

  // Initialize Google Places Autocomplete when modal opens
  const initAutocomplete = useCallback(() => {
    const win = window as any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!inputRef.current || !win.google?.maps?.places) return
    if (autocompleteRef.current) return // already initialized

    autocompleteRef.current = new win.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place) return

      const parsed = parseGooglePlace(place)
      if (parsed) {
        setForm(prev => ({
          ...prev,
          street: parsed.placeName || parsed.formattedAddress,
          city: parsed.city,
          state: parsed.state,
          zipCode: parsed.zip,
          lat: parsed.lat,
          lng: parsed.lng,
          placeId: parsed.placeId,
          country: parsed.country,
        }))
      }
    })
  }, [])

  useEffect(() => {
    if (showModal) {
      // Small delay to let the modal render the input
      const timer = setTimeout(initAutocomplete, 200)
      return () => clearTimeout(timer)
    } else {
      autocompleteRef.current = null
    }
  }, [showModal, initAutocomplete])

  const handleAdd = async () => {
    if (!form.street || !form.city) { toast.error('Street and city are required'); return }
    setSaving(true)
    try {
      await addAddress({
        address1: form.street,
        address2: form.address2,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        label: form.label,
        country: form.country || 'Usa',
        defaultAddress: addresses.length === 0,
        ...(form.lat != null && form.lng != null && {
          location: { lat: form.lat, lng: form.lng },
        }),
      })
      toast.success('Address added!')
      setShowModal(false)
      setForm(emptyForm)
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

  const hasGooglePlaces = typeof window !== 'undefined' && !!(window as any).google?.maps?.places // eslint-disable-line @typescript-eslint/no-explicit-any

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
                <p className="text-sm text-gray-700">{addr.street}{addr.address2 ? `, ${addr.address2}` : ''}</p>
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

          {/* Google Places Autocomplete or plain text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <div className="relative">
              {hasGooglePlaces && (
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder={hasGooglePlaces ? 'Search for an address...' : '123 Main St'}
                value={form.street}
                onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                className={`w-full border border-gray-300 rounded-xl py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                  hasGooglePlaces ? 'pl-9 pr-3' : 'px-3'
                }`}
              />
            </div>
            {hasGooglePlaces && (
              <p className="text-xs text-gray-400 mt-1">Start typing to search with Google Places</p>
            )}
          </div>

          <Input label="Apt / Suite / Floor" placeholder="Apt 4B" value={form.address2}
            onChange={e => setForm(p => ({ ...p, address2: e.target.value }))} />
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
