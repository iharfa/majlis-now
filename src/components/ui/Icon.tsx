import { cn } from '@/utils/cn'

interface IconProps {
  name: string
  className?: string
  filled?: boolean
  title?: string
}

/** Material Symbols Outlined glyph. */
export function Icon({ name, className, filled, title }: IconProps) {
  return (
    <span
      className={cn('material-symbols-outlined', filled && 'filled', className)}
      aria-hidden={title ? undefined : true}
      title={title}
      role={title ? 'img' : undefined}
    >
      {name}
    </span>
  )
}
