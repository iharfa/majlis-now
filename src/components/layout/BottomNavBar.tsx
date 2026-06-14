import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/', label: 'Now', icon: 'speed', end: true },
  { to: '/bills', label: 'Bills', icon: 'description' },
  { to: '/mps', label: 'MPs', icon: 'groups' },
  { to: '/votes', label: 'Votes', icon: 'how_to_vote' },
  { to: '/issues', label: 'Issues', icon: 'topic' },
]

export function BottomNavBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface-container shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="flex-1">
          {({ isActive }) => (
            <span
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1 rounded-full transition-colors mx-auto w-fit px-4',
                isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant',
              )}
            >
              <Icon name={item.icon} filled={isActive} />
              <span className="text-[10px] font-label-bold">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
