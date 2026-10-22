'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { AlarmClock, Phone } from 'lucide-react'

const addDays = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// A snoozed reminder resurfaces on its snoozed_until date; until then the
// snooze date is its effective due date everywhere it is grouped or shown.
const effectiveDate = (r: any) => r.snoozed_until || r.due_date

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [snoozeError, setSnoozeError] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchReminders() }, [])

  const fetchReminders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reminders')
      .select('*, contact:contacts(business_name, first_name, last_name, phone)')
      .eq('completed', false)
      .order('due_date', { ascending: true })
    setReminders(data || [])
    setLoading(false)
  }

  const complete = async (id: string) => {
    await supabase.from('reminders').update({
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', id)
    fetchReminders()
  }

  const snooze = async (id: string, until: string | null) => {
    const { error } = await supabase.from('reminders').update({ snoozed_until: until }).eq('id', id)
    if (error) {
      setSnoozeError('Could not snooze that follow-up. Try again.')
      return
    }
    setSnoozeError('')
    fetchReminders()
  }

  const today = new Date().toISOString().split('T')[0]
  const sorted = [...reminders].sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)))
  const overdue = sorted.filter(r => effectiveDate(r) < today)
  const dueToday = sorted.filter(r => effectiveDate(r) === today)
  const upcoming = sorted.filter(r => effectiveDate(r) > today)

  const ReminderCard = ({ r, isOverdue }: { r: any; isOverdue?: boolean }) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const snoozed = Boolean(r.snoozed_until && r.snoozed_until > today)
    const options = [
      { label: 'Tomorrow', date: addDays(today, 1) },
      { label: 'In 3 days', date: addDays(today, 3) },
      { label: 'Next week', date: addDays(today, 7) },
    ]
    return (
      <div className={`bg-gray-900 border rounded-xl p-4 ${
        isOverdue ? 'border-red-800' : 'border-gray-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white text-sm">{r.title}</div>
            <Link href={`/contacts/${r.contact_id}`} className="text-sm text-gray-400 hover:text-white">
              {r.contact?.business_name || `${r.contact?.first_name} ${r.contact?.last_name}`}
            </Link>
            <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
              {snoozed
                ? `Snoozed until ${r.snoozed_until}`
                : isOverdue
                  ? `Overdue since ${r.due_date}`
                  : `Due ${effectiveDate(r)}`}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 ml-3">
            {r.contact?.phone && (
              <a
                href={`tel:${r.contact.phone}`}
                className="px-3 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                aria-label="Call"
              >
                <Phone className="w-4 h-4 text-gray-300" />
              </a>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-3 min-h-11 inline-flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
              aria-expanded={menuOpen}
            >
              <AlarmClock className="w-4 h-4 text-gray-300" /> Snooze
            </button>
            <button
              onClick={() => complete(r.id)}
              className="px-4 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-800">
            {options.map((o) => (
              <button
                key={o.label}
                onClick={() => { setMenuOpen(false); snooze(r.id, o.date) }}
                className="px-3 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm"
              >
                {o.label} <span className="font-mono text-xs text-gray-500 ml-1.5">{o.date}</span>
              </button>
            ))}
            {r.snoozed_until && (
              <button
                onClick={() => { setMenuOpen(false); snooze(r.id, null) }}
                className="px-3 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm"
              >
                Unsnooze
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppLayout>
      <h1 className="text-[28px] leading-9 font-bold text-white mb-8">Inbox</h1>

      {snoozeError && <p className="text-sm text-red-400 mb-4">{snoozeError}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reminders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base font-medium text-white">All caught up</p>
          <p className="text-gray-400 text-sm mt-1">No pending follow-ups. Set one from any lead and it lands here.</p>
          <Link
            href="/contacts"
            className="inline-flex items-center px-5 min-h-11 mt-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm"
          >
            Browse leads
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-red-400 mb-3">Overdue · {overdue.length}</h2>
              <div className="space-y-2">
                {overdue.map((r) => <ReminderCard key={r.id} r={r} isOverdue />)}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-gray-300 mb-3">Due Today · {dueToday.length}</h2>
              <div className="space-y-2">
                {dueToday.map((r) => <ReminderCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-gray-400 mb-3">Upcoming · {upcoming.length}</h2>
              <div className="space-y-2">
                {upcoming.map((r) => <ReminderCard key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
