import { supabase } from './supabase'

const PRODUCT_IMAGE_BUCKET = 'product-images'
const INVOICE_BUCKET = 'invoices'

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')

export const uploadProductImage = async (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ''))
  const filePath = `products/${Date.now()}-${safeName}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, { upsert: false })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Shop/company logo reuses the existing public product-images bucket under a
// branding/ prefix — no new bucket or storage policy is required.
export const uploadShopLogo = async (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filePath = `branding/shop-logo-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type || undefined })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}

export const uploadInvoicePdf = async (file: File, invoiceNo: string): Promise<string> => {
  const safeInvoiceNo = sanitizeFileName(invoiceNo)
  const filePath = `invoices/${safeInvoiceNo}-${Date.now()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(INVOICE_BUCKET)
    .upload(filePath, file, { upsert: false, contentType: 'application/pdf' })

  if (uploadError) {
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
      throw new Error('Invoice storage bucket not found. Please create "invoices" bucket in Supabase Storage.')
    }
    throw uploadError
  }

  const { data } = supabase.storage
    .from(INVOICE_BUCKET)
    .getPublicUrl(filePath)

  return data.publicUrl
}
