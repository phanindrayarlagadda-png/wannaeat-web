/**
 * Builds a full image URL from a stored image path/key.
 *
 * Images from the API can be:
 *   1. Full URL (https://…) → returned as-is
 *   2. S3 key (public/path/file) → prepend CloudFront CDN URL
 *   3. Local filename (timestamp_field_name.jpg) → prepend API server /uploads/ URL
 *   4. null/undefined/"" → returns fallback or null
 */

const API_ROOT = import.meta.env.VITE_API_BASE_URL
  ? new URL(import.meta.env.VITE_API_BASE_URL).origin
  : 'http://localhost:17283'

// CloudFront CDN for S3 images (same as mobile app's Main_IMG)
const CDN_URL = import.meta.env.VITE_CDN_URL || 'https://d1n1jmgqtuwwh9.cloudfront.net'

export function buildImageUrl(
  imageValue: string | null | undefined,
  fallback?: string,
): string {
  if (!imageValue) return fallback || ''

  // Already a full URL
  if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
    return imageValue
  }

  // S3 key starting with "public/" → serve from CloudFront CDN
  if (imageValue.startsWith('public/')) {
    return `${CDN_URL}/${imageValue}`
  }

  // Plain filename from local disk storage
  return `${API_ROOT}/uploads/${imageValue}`
}
