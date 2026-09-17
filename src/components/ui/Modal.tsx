import { useEffect, type MouseEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Z_INDEX } from './zIndex'

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
} as const

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  size?: keyof typeof SIZE_CLASSES
  children: ReactNode
  footer?: ReactNode
  z?: number
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  z = Z_INDEX.modal,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open || !closeOnEscape) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeOnEscape, onClose])

  const handleBackdropMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-end sm:items-center justify-center bg-shopDeep/50 backdrop-blur-sm p-0 sm:p-4"
          style={{ zIndex: z }}
          onMouseDown={handleBackdropMouseDown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'flex w-full flex-col overflow-hidden bg-white shadow-2xl',
              'rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh]',
              SIZE_CLASSES[size],
            )}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {title !== undefined && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-shopSoft/40 px-5 py-4">
                <h3 className="text-[15px] font-black text-[#111111]">{title}</h3>
                <IconButton icon={<X size={18} />} label="Close" onClick={onClose} />
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-shopSoft/40 px-5 py-4">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
