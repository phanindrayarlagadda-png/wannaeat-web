const ENV = import.meta.env.MODE

const BASE_URLS = {
  development: 'https://api-stage.wannaeat.com/api/user/',
  staging: 'https://api-stage.wannaeat.com/api/user/',
  production: 'https://api.wannaeat.com/api/user/',
}

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  BASE_URLS[ENV as keyof typeof BASE_URLS] ||
  BASE_URLS.development

export const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://api-stage.wannaeat.com'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}
