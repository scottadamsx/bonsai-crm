import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

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

  // Reminders due today/overdue
  const today = new Date().toISOString().split('T')[0]
  const { data: dueReminders } = await supabase
    .from('reminders')
    .select('*, contact:contacts(business_name, first_name, last_name)')
    .eq('completed', false)
    .lte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(5)

  // Recent activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, contact:contacts(business_name, first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Contacts', value: totalContacts || 0, href: '/contacts', icon: '👥' },
    { label: 'Active Deals', value: totalDeals || 0, href: '/pipeline', icon: '📋' },
    { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, href: '/pipeline', icon: '💰' },
    { label: 'Monthly Recurring', value: `$${recurringValue.toLocaleString()}/mo`, href: '/pipeline', icon: '🔁' },
    { label: 'Clients Won', value: clientCount || 0, href: '/pipeline', icon: '✅' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, href: '/pipeline', icon: '📈' },
  ]

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Your sales at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Follow-ups due */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">⏰ Follow-ups Due</h2>
            <Link href="/reminders" className="text-sm text-green-400 hover:text-green-300">
              View all →
            </Link>
          </div>
          {(dueReminders || []).length === 0 ? (
            <p className="text-gray-500 text-sm">Nothing due. You're all caught up.</p>
          ) : (
            <div className="space-y-2">
              {dueReminders!.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/contacts/${r.contact_id}`}
                  className="block px-3 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{r.title}</div>
                  <div className="text-xs text-gray-400">
                    {r.contact?.business_name || `${r.contact?.first_name} ${r.contact?.last_name}`} · Due {r.due_date}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">📝 Recent Activity</h2>
            <Link href="/activities" className="text-sm text-green-400 hover:text-green-300">
              View all →
            </Link>
          </div>
          {(recentActivities || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No activities yet. Log your first call!</p>
          ) : (
            <div className="space-y-2">
              {recentActivities!.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/contacts/${a.contact_id}`}
                  className="block px-3 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="text-sm font-medium text-white capitalize">
                    {a.type} {a.outcome ? `· ${a.outcome.replace('_', ' ')}` : ''}
                  </div>
                  <div className="text-xs text-gray-400">
                    {a.contact?.business_name || 'Unknown'} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
