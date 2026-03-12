import { useState, useEffect } from 'react'
import { getCmsPage } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import PageHeader from '../../components/common/PageHeader'

export default function Terms() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCmsPage('terms')
      .then(res => setContent(res.data?.data?.body || res.data?.body || ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white max-w-3xl mx-auto px-4 py-8">
      <PageHeader title="Terms of Service" />
      {content ? (
        <div
          className="prose prose-gray max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-4">
          <p><strong>Last updated: March 2024</strong></p>
          <p>By using WannaEat, you agree to these Terms of Service.</p>
          <h2 className="text-lg font-bold">Use of Service</h2>
          <p>WannaEat provides a marketplace connecting users with local home chefs. You must be 18 years or older to use our service.</p>
          <h2 className="text-lg font-bold">Orders & Payments</h2>
          <p>All orders are subject to chef availability. Prices are set by individual chefs. Payment is processed securely via Stripe.</p>
          <h2 className="text-lg font-bold">Refunds & Cancellations</h2>
          <p>Cancellation policies vary by chef. Refunds are processed within 5-10 business days to the original payment method.</p>
          <h2 className="text-lg font-bold">Contact</h2>
          <p>For questions about these terms, contact us at legal@wannaeat.com</p>
        </div>
      )}
    </div>
  )
}
