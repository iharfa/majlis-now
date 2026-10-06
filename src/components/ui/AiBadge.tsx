import type { Confidence } from '@/types'
import { Icon } from './Icon'
import { formatDate } from '@/utils/format'

/** Provenance chip for text Claude translated/summarised from an official Dhivehi PDF. */
export function AiBadge({ confidence, model, generatedAt }: { confidence: Confidence; model: string; generatedAt: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 bg-white/70 text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-bold"
      title={`Translated and summarised from the official Dhivehi document by ${model} on ${formatDate(generatedAt)}. Confidence: ${confidence}. Check the source PDF for anything that matters.`}
    >
      <Icon name="translate" className="text-[14px]" /> AI translation · {confidence} confidence
    </span>
  )
}
