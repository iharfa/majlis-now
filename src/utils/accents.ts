// Static accent → class mapping. Kept as full class strings so Tailwind's
// content scanner keeps them (dynamic `bg-${x}` strings get purged).
const MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
}

export function accentClasses(accent: string): string {
  return MAP[accent] ?? MAP.primary
}
