import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { getCmsPage } from '../../helper/api'
import Spinner from '../../components/common/Spinner'
import PageHeader from '../../components/common/PageHeader'

const PATH_TO_TITLE: Record<string, string> = {
  'faq': 'FAQ',
  'contact': 'Contact Us',
  'contact-us': 'Contact Us',
  'terms': 'Terms Of Services',
  'terms-and-conditions': 'Terms Of Services',
  'privacy': 'Privacy Policy',
  'privacy-policy': 'Privacy Policy',
  'about': 'About Us',
  'about-us': 'About Us',
  'private-chef-experience': 'Private Chef Experience',
  'catering': 'Catering',
  'daily-meals': 'Daily Meals',
}

export default function CMSPage() {
  const { slug: paramSlug } = useParams<{ slug: string }>()
  const location = useLocation()
  // Derive slug from params or from URL path (for /settings/faq, etc.)
  const slug = paramSlug || location.pathname.split('/').pop() || ''
  const [content, setContent] = useState<{ title: string; body: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getCmsPage(slug)
      .then(res => setContent(res.data?.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white max-w-3xl mx-auto px-4 py-8">
      <PageHeader title={content?.title || PATH_TO_TITLE[slug] || 'Page'} />
      {content?.body ? (
        <div
          className="prose prose-gray max-w-none text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      ) : (
        <p className="text-gray-500 text-center py-12">Content not available</p>
      )}
    </div>
  )
}
