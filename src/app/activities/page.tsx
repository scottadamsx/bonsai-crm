'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞', email: '✉️', sms: '💬', meeting: '🤝', note: '📝',
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchActivities() }, [])

  const fetchActivities = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('activities')
      .select('*, contact:contacts(business_name, first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setActivities(data || [])
    setLoading(false)
  }

  const filtered = filter ? activities.filter(a => a.type === filter) : activities

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Activities</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm"
        >
          <option value="">All types</option>
          <option value="call">📞 Calls</option>
          <option value="email">✉️ Emails</option>
          <option value="sms">💬 SMS</option>
          <option value="meeting">🤝 Meetings</option>
          <option value="note">📝 Notes</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No activities yet.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/contacts/${a.contact_id}`}
              className="flex gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl shrink-0">
                {ACTIVITY_ICONS[a.type] || '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm capitalize">{a.type}</span>
                  {a.outcome && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                      {a.outcome.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-300 mt-0.5">
                  {a.contact?.business_name || `${a.contact?.first_name} ${a.contact?.last_name}`}
                </div>
                {a.subject && <div className="text-sm text-gray-400">{a.subject}</div>}
                {a.body && <div className="text-sm text-gray-500 truncate">{a.body}</div>}
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
