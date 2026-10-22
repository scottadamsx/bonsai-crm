import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import ActivityIcon from '@/components/ActivityIcon'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Stats
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const { count: totalDeals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })

  const { data: deals } = await supabase
    .from('deals')
    .select('value, recurring_value')

  const pipelineValue = (deals || []).reduce((sum, d) => sum + Number(d.value || 0), 0)
  const recurringValue = (deals || []).reduce((sum, d) => sum + Number(d.recurring_value || 0), 0)

  // Clients (deals in Client or Care Plan stage)
  const { data: clientStages } = await supabase
    .from('pipeline_stages')
    .select('id')
    .in('name', ['Client', 'Care Plan'])

  const clientStageIds = (clientStages || []).map(s => s.id)
  const { count: clientCount } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .in('stage_id', clientStageIds.length > 0 ? clientStageIds : ['none'])

  const conversionRate = totalDeals && totalDeals > 0
    ? Math.round(((clientCount || 0) / totalDeals) * 100)
    : 0

  // Reminders due today/overdue (snoozed ones stay out until their date)
  const today = new Date().toISOString().split('T')[0]
  const { data: dueRows } = await supabase
    .from('reminders')
    .select('*, contact:contacts(business_name, first_name, last_name)')
    .eq('completed', false)
    .lte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(25)
  const dueReminders = (dueRows || [])
    .filter((r: any) => !r.snoozed_until || r.snoozed_until <= today)
    .slice(0, 5)

  // Recent activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, contact:contacts(business_name, first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Leads', value: totalContacts || 0, href: '/contacts' },
    { label: 'Active Deals', value: totalDeals || 0, href: '/pipeline' },
    { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, href: '/pipeline' },
    { label: 'Monthly Recurring', value: `$${recurringValue.toLocaleString()}/mo`, href: '/pipeline' },
    { label: 'Clients Won', value: clientCount || 0, href: '/pipeline' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, href: '/pipeline' },
  ]

  const due = dueReminders || []
  const recent = recentActivities || []

  const sectionLabel = 'font-mono text-xs font-medium uppercase tracking-[0.14em] text-gray-400'
  const viewAll = 'text-sm text-gray-400 hover:text-white min-h-11 inline-flex items-center transition-colors'

  return (
    <AppLayout>
      <h1 className="text-[28px] leading-9 font-bold text-white mb-8">Dashboard</h1>

      {/* Stats: one quiet strip. Metric first, label second, dividers not boxes. */}
      <div className="flex flex-wrap border-y border-gray-800 mb-10">
        {stats.map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`flex-1 min-w-[150px] px-4 py-4 hover:bg-gray-900 transition-colors ${i > 0 ? 'border-l border-gray-800' : ''}`}
          >
            <div className="font-mono text-[22px] leading-7 text-white">{stat.value}</div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        {/* Hero: follow-ups are the actionable thing on this page */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={sectionLabel}>Follow-ups Due{due.length > 0 ? ` · ${due.length}` : ''}</h2>
            <Link href="/reminders" className={viewAll}>View all</Link>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {due.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-base font-medium text-white">All caught up</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  No follow-ups are due. When a lead needs a call, it shows up here.
                </p>
                <Link
                  href="/contacts"
                  className="inline-flex items-center min-h-11 px-5 mt-5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                >
                  Log an activity
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {due.map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/contacts/${r.contact_id}`}
                    className="block px-4 py-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-sm font-medium text-white">{r.title}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {r.contact?.business_name || `${r.contact?.first_name} ${r.contact?.last_name}`}
                      {' · '}
                      <span className={r.due_date < today ? 'text-red-400' : ''}>
                        {r.due_date < today ? 'Overdue' : 'Due'} {r.due_date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent activity: a plain list, not another card */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={sectionLabel}>Recent Activity</h2>
            <Link href="/activities" className={viewAll}>View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-2">
              <p className="text-sm text-gray-400">No activity logged yet. Calls, emails, and notes you log on a lead appear here.</p>
              <Link
                href="/contacts"
                className="inline-flex items-center min-h-11 px-5 mt-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
              >
                Log an activity
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800 border-t border-b border-gray-800">
              {recent.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/contacts/${a.contact_id}`}
                  className="flex items-center gap-3 py-3 min-h-11 hover:bg-gray-900 transition-colors"
                >
                  <span className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center shrink-0 text-gray-400">
                    <ActivityIcon type={a.type} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white capitalize truncate">
                      {a.type} {a.outcome ? `· ${a.outcome.replace('_', ' ')}` : ''}
                    </span>
                    <span className="block text-sm text-gray-400 truncate">
                      {a.contact?.business_name || 'Unknown'} · {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
