import { createContext } from 'react'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface ToastContextValue {
  toast: {
    success: (title: string, description?: string) => void
    error: (title: string, description?: string) => void
    warning: (title: string, description?: string) => void
    info: (title: string, description?: string) => void
  }
}

export const ToastContext = createContext<ToastContextValue | null>(null)
