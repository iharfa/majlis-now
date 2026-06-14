import { Icon } from './Icon'

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
          Real data (source: People’s Majlis): the full MP roster, photos &amp; 7 official roll-call votes. Other
          bills, signals &amp; committee activity are illustrative samples.
        </p>
      </div>
    </div>
  )
}
