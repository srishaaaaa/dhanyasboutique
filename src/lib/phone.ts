// Indian phone number validation (+91 format)
// Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX (10-digit mobile starting 6-9)
export function normalizePhone(input: string): string | null {
  if (!input) return null

  // Strip everything except digits
  const raw = input.replace(/\D/g, '')
  if (!raw) return null

  let digits = raw

  if (digits.startsWith('91') && digits.length === 12) {
    // Already 91XXXXXXXXXX — keep as-is
  } else if (digits.startsWith('0') && digits.length === 11) {
    // 0XXXXXXXXXX → drop the trunk prefix, prepend country code
    digits = '91' + digits.slice(1)
  } else if (digits.length === 10) {
    // XXXXXXXXXX → prepend country code
    digits = '91' + digits
  } else {
    return null
  }

  // Indian mobiles: 91[6-9]XXXXXXXXX (12 digits total with 91)
  if (!/^91[6-9][0-9]{9}$/.test(digits)) return null

  return digits
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null
}

export function getSubscriberDigits(input: string): string | null {
  const normalized = normalizePhone(input)
  return normalized ? normalized.slice(2) : null
}

// Human-readable form for receipts/invoices/order lists — e.g. "918122921906"
// -> "+91 81229 21906". Stored/WhatsApp-facing values stay digits-only; this is
// display-only formatting.
export function formatPhoneDisplay(input: string): string {
  const normalized = normalizePhone(input)
  if (!normalized) return input
  const subscriber = normalized.slice(2)
  return `+91 ${subscriber.slice(0, 5)} ${subscriber.slice(5)}`
}

export function normalizePhoneForWhatsApp(input: string): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('91') && digits.length >= 12) {
    return digits
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return '91' + digits.slice(1)
  }
  if (digits.length === 10) {
    return '91' + digits
  }
  return digits
}

export function toWhatsAppUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone) || normalizePhone(phone)
  const queryParams: string[] = []

  if (normalized) {
    queryParams.push(`phone=${normalized}`)
  }
  if (text) {
    queryParams.push(`text=${encodeURIComponent(text)}`)
  }

  return `https://api.whatsapp.com/send${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`
}
