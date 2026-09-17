import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from './cn'

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
} as const

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-2xl border border-shopSoft/40 shadow-sm',
        interactive && 'transition-shadow hover:shadow-md cursor-pointer',
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})
