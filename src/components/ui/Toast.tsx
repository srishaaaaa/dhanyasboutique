import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from './cn'
import { Z_INDEX } from './zIndex'
import { ToastContext, type ToastContextValue, type ToastKind } from './toastContext'

interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

const KIND_META: Record<ToastKind, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'border-green-200 bg-white text-green-700 [&_svg]:text-green-500' },
  error: { icon: XCircle, classes: 'border-red-200 bg-white text-red-600 [&_svg]:text-red-500' },
  warning: { icon: AlertTriangle, classes: 'border-orange-200 bg-white text-orange-700 [&_svg]:text-orange-500' },
  info: { icon: Info, classes: 'border-blue-200 bg-white text-blue-700 [&_svg]:text-blue-500' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = ++idRef.current
    setItems(prev => [...prev, { id, kind, title, description }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  const value = useMemo<ToastContextValue>(() => ({
    toast: {
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      warning: (title, description) => push('warning', title, description),
      info: (title, description) => push('info', title, description),
    },
  }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-full sm:max-w-sm"
        style={{ zIndex: Z_INDEX.toast }}
      >
        <AnimatePresence>
          {items.map(item => {
            const { icon: Icon, classes } = KIND_META[item.kind]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18 }}
                className={cn('flex items-start gap-2.5 rounded-2xl border p-3 shadow-lg', classes)}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-black leading-tight">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-[11px] font-semibold opacity-80">{item.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-shopCard/5 hover:text-gray-600"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
