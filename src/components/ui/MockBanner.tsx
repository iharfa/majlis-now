import { Icon } from './Icon'
import { realVotes } from '@/data/realData'

/**
 * Honest data-provenance banner. The MP roster is real (from majlis.gov.mv);
 * the legislative process data (bills, votes, signals, committee activity) is
 * illustrative sample data for this prototype.
 */
export function MockBanner() {
  return (
    <div className="bg-tertiary-fixed text-on-tertiary-fixed-variant">
      <div className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-1.5 flex items-center justify-center gap-2 text-center">
        <Icon name="info" className="text-[16px]" />
        <p className="text-label-sm font-label-bold">
          Live data from the People’s Majlis (majlis.gov.mv): the full MP roster, photos, all committees &amp;{' '}
          {realVotes.length} official roll-call votes.
        </p>
      </div>
    </div>
  )
}
