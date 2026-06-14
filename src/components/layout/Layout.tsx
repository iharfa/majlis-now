import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopAppBar } from './TopAppBar'
import { BottomNavBar } from './BottomNavBar'
import { Footer } from './Footer'
import { MockBanner } from '@/components/ui/MockBanner'

/** App shell: top bar (desktop) + bottom nav (mobile), with scroll reset. */
export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <MockBanner />
      <TopAppBar />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNavBar />
    </div>
  )
}
