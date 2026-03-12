import { useState, useEffect } from 'react'
import { getCmsPage } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import PageHeader from '../../components/common/PageHeader'

export default function Privacy() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCmsPage('privacy')
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
      <PageHeader title="Privacy Policy" />
      {content ? (
        <div
          className="prose prose-gray max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-4">
          <p><strong>Last updated: March 2024</strong></p>
          <p>WannaEat ("we", "us", or "our") is committed to protecting your personal information and your right to privacy.</p>
          <h2 className="text-lg font-bold">Information We Collect</h2>
          <p>We collect information you provide when creating an account, placing orders, and using our services, including name, email, phone number, delivery addresses, and payment information.</p>
          <h2 className="text-lg font-bold">How We Use Your Information</h2>
          <p>We use your information to process orders, communicate with you, improve our services, and comply with legal obligations.</p>
          <h2 className="text-lg font-bold">Contact Us</h2>
          <p>For privacy-related questions, please contact us at privacy@wannaeat.com</p>
        </div>
      )}
    </div>
  )
}

