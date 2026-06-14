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
            An independent prototype bridging the gap between the Maldivian Parliament and its youth. Open data,
            evidence-first, non-partisan.
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
            · Development dataset is mock.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/issues" className="text-outline hover:text-primary font-label-bold">Issues</Link>
          <Link to="/committees" className="text-outline hover:text-primary font-label-bold">Committees</Link>
          <Link to="/compare" className="text-outline hover:text-primary font-label-bold">Compare MPs</Link>
          <Link to="/search" className="text-outline hover:text-primary font-label-bold">Search</Link>
        </div>
      </div>
    </footer>
  )
}
