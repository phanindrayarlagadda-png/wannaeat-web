/**
 * Enhanced address parsing from Google Places autocomplete result.
 * Mirrors the mobile app's handlePlaceChanged logic with improved city extraction.
 */

export interface ParsedAddress {
  lat: number
  lng: number
  formattedAddress: string
  placeName: string
  placeId: string
  city: string
  state: string
  zip: string
  country: string
}

/**
 * Parse a Google Places Autocomplete result into a structured address object.
 * Uses the same enhanced city extraction logic as the mobile app.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGooglePlace(place: any): ParsedAddress | null {
  if (!place.geometry?.location) return null

  const loc = place.geometry.location
  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat
  const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng

  let streetNumber = ''
  let route = ''
  let state = ''
  let zipCode = ''
  let country = ''

  // Collect all possible city sources
  const possibleCities: string[] = []
  const cityFallback: Record<string, string> = {
    locality: '',
    sublocality_level_1: '',
    neighborhood: '',
    sublocality: '',
    administrative_area_level_3: '',
    administrative_area_level_2: '',
  }

  for (const component of place.address_components || []) {
    const types = component.types
    const longName = component.long_name

    if (types.includes('street_number')) {
      streetNumber = longName
    } else if (types.includes('route')) {
      route = longName
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name
    } else if (types.includes('postal_code')) {
      zipCode = longName
    } else if (types.includes('country')) {
      country = longName
    }

    // Collect city candidates
    if (types.includes('locality')) {
      possibleCities.push(longName)
      cityFallback.locality = longName
    }
    if (types.includes('sublocality_level_1')) {
      possibleCities.push(longName)
      cityFallback.sublocality_level_1 = longName
    }
    if (types.includes('neighborhood')) {
      possibleCities.push(longName)
      cityFallback.neighborhood = longName
    }
    if (types.includes('sublocality')) {
      possibleCities.push(longName)
      cityFallback.sublocality = longName
    }
    if (types.includes('administrative_area_level_3')) {
      possibleCities.push(longName)
      cityFallback.administrative_area_level_3 = longName
    }
    if (types.includes('administrative_area_level_2')) {
      possibleCities.push(longName)
      cityFallback.administrative_area_level_2 = longName
    }
  }

  // Two-pass city extraction from formatted address
  let extractedCity = ''
  const formattedAddress = place.formatted_address || ''
  if (possibleCities.length > 0 && formattedAddress) {
    const parts = formattedAddress.split(',').map((p: string) => p.trim())
    // First pass: exact match (backwards)
    for (let i = parts.length - 1; i >= 0; i--) {
      const match = possibleCities.find((c) => c === parts[i])
      if (match) {
        extractedCity = match
        break
      }
    }
    // Second pass: partial match
    if (!extractedCity) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const match = possibleCities.find((c) => parts[i].includes(c))
        if (match) {
          extractedCity = match
          break
        }
      }
    }
  }

  // Prioritized fallback chain
  const city =
    extractedCity ||
    cityFallback.locality ||
    cityFallback.sublocality_level_1 ||
    cityFallback.neighborhood ||
    cityFallback.sublocality ||
    cityFallback.administrative_area_level_3 ||
    cityFallback.administrative_area_level_2 ||
    ''

  return {
    lat,
    lng,
    formattedAddress,
    placeName: `${streetNumber} ${route}`.trim() || formattedAddress,
    placeId: place.place_id || '',
    city,
    state,
    zip: zipCode,
    country,
  }
}
