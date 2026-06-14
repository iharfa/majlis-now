import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/', label: 'Now', end: true },
  { to: '/bills', label: 'Bills' },
  { to: '/mps', label: 'MPs' },
  { to: '/votes', label: 'Votes' },
  { to: '/issues', label: 'Issues' },
]

export function TopAppBar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="bg-background border-b border-outline-variant w-full sticky top-0 z-50">
      <div className="flex justify-between items-center px-container-margin-mobile md:px-container-margin-desktop w-full max-w-7xl mx-auto h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Icon name="account_balance" className="text-primary text-3xl" />
          <span className="font-display-lg text-headline-md tracking-tighter text-primary">Majlis Now</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 h-full">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'font-label-bold text-label-bold h-full flex items-center transition-colors',
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form onSubmit={submitSearch} className="hidden sm:flex items-center relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Majlis…"
              className="w-40 lg:w-56 bg-surface-container-low border border-outline-variant rounded-full pl-9 pr-3 py-1.5 text-label-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <Icon name="search" className="absolute left-2.5 text-on-surface-variant text-[18px]" />
          </form>
          <Link
            to="/search"
            className="sm:hidden p-2 rounded-full hover:bg-surface-variant transition-colors"
            aria-label="Search"
          >
            <Icon name="search" className="text-on-surface-variant" />
          </Link>
        </div>
      </div>
    </header>
  )
}
