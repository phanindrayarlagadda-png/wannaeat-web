import { useParams, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import toast from 'react-hot-toast'
import { reportIssue } from '../../helper/api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import PageHeader from '../../components/common/PageHeader'

const ISSUE_TYPES = [
  'Wrong item received',
  'Missing items',
  'Food quality issue',
  'Late delivery',
  'Delivery not received',
  'Other',
]

const schema = Yup.object({
  issueType: Yup.string().required('Please select an issue type'),
  description: Yup.string().min(10, 'Please provide more details').required('Description is required'),
})

export default function ReportIssue() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const formik = useFormik({
    initialValues: { issueType: '', description: '' },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await reportIssue(orderId!, values)
        toast.success('Issue reported. Our team will contact you shortly.')
        navigate(`/orders/${orderId}`)
      } catch {
        toast.error('Failed to submit report')
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <div>
      <PageHeader title="Report Issue" />

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          We're sorry to hear about your experience. Please describe the issue and we'll look into it.
        </p>

        {/* Issue type */}
        <div className="card p-4">
          <p className="font-semibold text-gray-900 mb-3">Issue Type</p>
          <div className="space-y-2">
            {ISSUE_TYPES.map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer py-1.5">
                <input
                  type="radio"
                  name="issueType"
                  value={type}
                  checked={formik.values.issueType === type}
                  onChange={() => formik.setFieldValue('issueType', type)}
                  className="accent-primary"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
          {formik.touched.issueType && formik.errors.issueType && (
            <p className="text-xs text-red-500 mt-2">{formik.errors.issueType}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            rows={5}
            placeholder="Please describe the issue in detail..."
            className="input-field resize-none"
            {...formik.getFieldProps('description')}
          />
          {formik.touched.description && formik.errors.description && (
            <p className="text-xs text-red-500 mt-1">{formik.errors.description}</p>
          )}
        </div>

        {/* Contact info note */}
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600">
          Our support team will reach out to you within 24 hours to resolve this issue.
        </div>

        <Button type="submit" fullWidth size="lg" loading={formik.isSubmitting}>
          Submit Report
        </Button>
      </form>
    </div>
  )
}
