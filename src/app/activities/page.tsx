'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import ActivityIcon from '@/components/ActivityIcon'

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

  const pill = (active: boolean) =>
    `min-h-11 px-4 rounded-full border text-sm transition-colors ${
      active
        ? 'bg-gray-100 border-gray-100 text-gray-950 font-medium'
        : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
    }`

  const typePills = [
    { value: '', label: 'All types' },
    { value: 'call', label: 'Calls' },
    { value: 'email', label: 'Emails' },
    { value: 'sms', label: 'SMS' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'note', label: 'Notes' },
  ]

  return (
    <AppLayout>
      <h1 className="text-[28px] leading-9 font-bold text-white mb-6">Activities</h1>

      {/* Type filters as visible pills (Rule 17: recognition over recall) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {typePills.map((p) => (
          <button key={p.label} onClick={() => setFilter(p.value)} className={pill(filter === p.value)}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base font-medium text-white">No activities yet</p>
          <p className="text-gray-400 text-sm mt-1">Log a call, email, or note on a lead and it shows up here.</p>
          <Link
            href="/contacts"
            className="inline-flex items-center px-5 min-h-11 mt-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm"
          >
            Log an activity
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-800 border-t border-b border-gray-800">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/contacts/${a.contact_id}`}
              className="flex gap-3 py-4 px-1 hover:bg-gray-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 text-gray-400">
                <ActivityIcon type={a.type} className="w-5 h-5" />
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
                <div className="font-mono text-[11px] text-gray-500 mt-1">
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
