import { cn } from '@/utils/cn'

interface ProgressRingProps {
  /** 0–100. */
  value: number
  label?: string
  /** Tailwind text-color class for the arc, e.g. "text-primary". */
  colorClass?: string
  size?: number
}

/** Circular percentage ring matching the Stitch MP profile meters. */
export function ProgressRing({ value, label, colorClass = 'text-primary', size = 96 }: ProgressRingProps) {
  const r = 42
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle className="text-surface-variant" cx="50" cy="50" r={r} fill="transparent" stroke="currentColor" strokeWidth="8" />
        <circle
          className={cn('transition-[stroke-dashoffset] duration-500', colorClass)}
          cx="50"
          cy="50"
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(2)}
          strokeDashoffset={offset.toFixed(2)}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center font-headline-md', colorClass)}>
        {label ?? `${value}%`}
      </span>
    </div>
  )
}
