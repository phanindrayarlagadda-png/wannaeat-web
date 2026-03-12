import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { cancelOrder } from '../../helper/api'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'

const REASONS = [
  'I changed my mind',
  'Ordered by mistake',
  'Delivery time too long',
  'Found a better option',
  'Other',
]

const schema = Yup.object({
  reason: Yup.string().required('Please select a reason'),
  details: Yup.string().max(500),
})

export default function CancelOrder() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [customReason, setCustomReason] = useState(false)

  const formik = useFormik({
    initialValues: { reason: '', details: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await cancelOrder(orderId!, values)
        toast.success('Order cancelled successfully')
        navigate(`/orders/${orderId}`)
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        toast.error(error?.response?.data?.message || 'Failed to cancel order')
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div>
      <PageHeader title="Cancel Order" />

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <p className="text-gray-600 text-sm">Please let us know why you're cancelling this order.</p>

        <div className="card p-4 space-y-2">
          {REASONS.map(reason => (
            <label key={reason} className="flex items-center gap-3 cursor-pointer py-2">
              <input
                type="radio"
                name="reason"
                value={reason}
                checked={formik.values.reason === reason}
                onChange={() => {
                  formik.setFieldValue('reason', reason)
                  setCustomReason(reason === 'Other')
                }}
                className="accent-primary"
              />
              <span className="text-sm text-gray-700">{reason}</span>
            </label>
          ))}
          {formik.touched.reason && formik.errors.reason && (
            <p className="text-xs text-red-500">{formik.errors.reason}</p>
          )}
        </div>

        {customReason && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional details</label>
            <textarea
              rows={4}
              placeholder="Tell us more..."
              className="input-field resize-none"
              {...formik.getFieldProps('details')}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Keep Order
          </Button>
          <Button variant="danger" type="submit" loading={formik.isSubmitting}>
            Cancel Order
          </Button>
        </div>
      </form>
    </div>
  )
}
