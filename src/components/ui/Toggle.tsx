import { cn } from './cn'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-shopDeep' : 'bg-gray-200',
        !label && className,
      )}
    >
      <span
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )

  if (!label) return track

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="text-[12px] font-black text-[#374151]">{label}</span>
      {track}
    </div>
  )
}
