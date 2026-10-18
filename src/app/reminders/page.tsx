'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  const today = new Date().toISOString().split('T')[0]
  const overdue = reminders.filter(r => r.due_date < today)
  const dueToday = reminders.filter(r => r.due_date === today)
  const upcoming = reminders.filter(r => r.due_date > today)

  const ReminderCard = ({ r, isOverdue }: { r: any; isOverdue?: boolean }) => (
    <div className={`flex items-center justify-between bg-gray-900 border rounded-xl p-4 ${
      isOverdue ? 'border-red-800' : 'border-gray-800'
    }`}>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-white text-sm">{r.title}</div>
        <Link href={`/contacts/${r.contact_id}`} className="text-sm text-gray-400 hover:text-green-400">
          {r.contact?.business_name || `${r.contact?.first_name} ${r.contact?.last_name}`}
        </Link>
        <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
          {isOverdue ? `⚠️ Overdue since ${r.due_date}` : `Due ${r.due_date}`}
        </div>
      </div>
      <div className="flex gap-2 shrink-0 ml-3">
        {r.contact?.phone && (
          <a
            href={`tel:${r.contact.phone}`}
            className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
          >
            📞
          </a>
        )}
        <button
          onClick={() => complete(r.id)}
          className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium"
        >
          ✓ Done
        </button>
      </div>
    </div>
  )

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Follow-ups</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending follow-ups. You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <h2 className="text-red-400 font-semibold mb-3">⚠️ Overdue ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map((r) => <ReminderCard key={r.id} r={r} isOverdue />)}
              </div>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <h2 className="text-yellow-400 font-semibold mb-3">📅 Due Today ({dueToday.length})</h2>
              <div className="space-y-2">
                {dueToday.map((r) => <ReminderCard key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className="text-gray-300 font-semibold mb-3">🔜 Upcoming ({upcoming.length})</h2>
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
