'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Inbox,
  Users,
  Columns3,
  Activity,
  Filter,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Sprout,
} from 'lucide-react'

const MOBILE_TABS = [
  { href: '/reminders', label: 'Inbox', icon: Inbox },
  { href: '/contacts', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { href: '/activities', label: 'Activity', icon: Activity },
  { href: '/', label: 'Home', icon: LayoutDashboard },
]

const NAV_ITEMS = [
  { href: '/reminders', label: 'Inbox', icon: Inbox },
  { href: '/contacts', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Columns3 },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/sequences', label: 'Sequences', icon: Mail },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [views, setViews] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase
      .from('smart_views')
      .select('id, name')
      .order('name')
      .then(({ data }) => setViews(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="px-4 h-14 flex items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-wide">BONSAI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-gray-800 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {/* Smart Views, pinned like Close */}
        <div className="mt-4 mb-1 px-5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Smart Views
          </span>
          <Link
            href="/views"
            onClick={() => setMobileOpen(false)}
            className="text-[11px] text-gray-500 hover:text-gray-300"
          >
            Manage
          </Link>
        </div>
        {views.length === 0 ? (
          <Link
            href="/views"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 mx-2 rounded-md text-sm text-gray-500 hover:text-white hover:bg-gray-800/50"
          >
            <Filter className="w-4 h-4 shrink-0" />
            No views yet
          </Link>
        ) : (
          views.map((view) => (
            <Link
              key={view.id}
              href={`/views?run=${view.id}`}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-md text-sm transition-colors ${
                pathname === '/views'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span className="truncate">{view.name}</span>
            </Link>
          ))
        )}

        <div className="mt-4">
          {NAV_ITEMS.slice(4).map((item) => {
            const active = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 mx-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-gray-800 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2 py-2 text-sm text-gray-400 hover:text-white rounded-md hover:bg-gray-800/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-wide">BONSAI</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-gray-300 hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800">
            {nav}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-60 bg-gray-900 border-r border-gray-800">
        {nav}
      </div>

      {/* Main content */}
      <main className="lg:pl-60">
        <div className="p-4 md:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav, per the Close mobile spec: five thumb-reach tabs */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-gray-900 border-t border-gray-800">
        <div className="grid grid-cols-5">
          {MOBILE_TABS.map((tab) => {
            const active = pathname === tab.href ||
              (tab.href !== '/' && pathname.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-14 py-1.5 text-[11px] ${
                  active ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
