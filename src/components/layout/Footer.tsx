import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'

export function Footer() {
  return (
    <footer className="mt-section-gap border-t border-outline-variant bg-white">
      <div className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Icon name="account_balance" className="text-primary" />
            <span className="font-display-lg text-headline-md tracking-tighter text-primary">Majlis Now</span>
          </div>
          <p className="text-outline text-sm max-w-xs">
            An independent, open-source window into the People’s Majlis for young Maldivians. Evidence-first,
            non-partisan.
          </p>
          <p className="text-outline text-label-sm">
            Data source:{' '}
            <a
              href="https://majlis.gov.mv/en/20-parliament"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary hover:underline"
            >
              People’s Majlis
            </a>{' '}
            · Roster, committees, sittings &amp; roll-call votes are official records. Bill and agenda summaries are AI translations of
            the official Dhivehi PDFs — always check the source.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/sittings" className="text-outline hover:text-primary font-label-bold">Sittings</Link>
          <Link to="/insights" className="text-outline hover:text-primary font-label-bold">Insights</Link>
          <Link to="/issues" className="text-outline hover:text-primary font-label-bold">Issues</Link>
          <Link to="/committees" className="text-outline hover:text-primary font-label-bold">Committees</Link>
          <Link to="/compare" className="text-outline hover:text-primary font-label-bold">Compare MPs</Link>
          <Link to="/search" className="text-outline hover:text-primary font-label-bold">Search</Link>
          <a href="https://github.com/iharfa/majlis-now" target="_blank" rel="noreferrer noopener" className="text-outline hover:text-primary font-label-bold">Source code</a>
        </div>
      </div>
    </footer>
  )
}
