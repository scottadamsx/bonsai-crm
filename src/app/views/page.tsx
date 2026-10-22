'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Filter, Pin, Plus, Star, X } from 'lucide-react'
import { LEAD_STATUSES, leadStatusOf, leadStatusColor } from '@/lib/leadStatus'

export default function SmartViewsPage() {
  const [views, setViews] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchViews().then(() => {
      const runId = new URLSearchParams(window.location.search).get('run')
      if (runId) {
        supabase.from('smart_views').select('*').eq('id', runId).single()
          .then(({ data }) => { if (data) runView(data) })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchViews = async () => {
    const { data } = await supabase.from('smart_views').select('*').order('name')
    setViews(data || [])
  }

  const runView = async (view: any) => {
    setActiveView(view.id)
    const f = view.filters

    let query = supabase.from('contacts').select('*')

    if (f.contact_type) query = query.eq('contact_type', f.contact_type)
    if (f.categories?.length) query = query.in('category', f.categories)
    if (f.priority_only) query = query.eq('priority', true)
    if (f.tags?.length) query = query.overlaps('tags', f.tags)

    const { data: contacts } = await query.order('business_name')
    let filtered = contacts || []

    // Filter by pipeline stage if specified
    if (f.stage_ids?.length) {
      const { data: deals } = await supabase
        .from('deals')
        .select('contact_id')
        .in('stage_id', f.stage_ids)
      const dealContactIds = new Set((deals || []).map(d => d.contact_id))
      filtered = filtered.filter(c => dealContactIds.has(c.id))
    }

    // Lead status (gap #1): client-side so it also works before migration 002
    if (f.lead_statuses?.length) {
      filtered = filtered.filter(c => f.lead_statuses.includes(leadStatusOf(c)))
    }

    // Custom field value contains (gap #10)
    if (f.custom_field?.name && f.custom_field?.value) {
      const needle = String(f.custom_field.value).toLowerCase()
      filtered = filtered.filter(c =>
        String(c.custom_fields?.[f.custom_field.name] ?? '').toLowerCase().includes(needle)
      )
    }

    // Activity based filters (gap #3): latest activity per lead, computed live
    if (f.no_activity_days || f.no_followup) {
      const { data: acts } = await supabase
        .from('activities')
        .select('contact_id, created_at')
        .order('created_at', { ascending: false })
      const lastActivity = new Map<string, string>()
      for (const a of acts || []) {
        if (!lastActivity.has(a.contact_id)) lastActivity.set(a.contact_id, a.created_at)
      }
      filtered = filtered.map(c => ({ ...c, _lastActivity: lastActivity.get(c.id) || null }))

      if (f.no_activity_days) {
        const cutoff = Date.now() - f.no_activity_days * 86400000
        filtered = filtered.filter(c => !c._lastActivity || new Date(c._lastActivity).getTime() < cutoff)
      }
      if (f.no_followup) {
        const { data: open } = await supabase
          .from('reminders')
          .select('contact_id')
          .eq('completed', false)
        const withFollowup = new Set((open || []).map(r => r.contact_id))
        filtered = filtered.filter(c => !withFollowup.has(c.id))
      }
    }

    setResults(filtered)
  }

  const togglePin = async (view: any) => {
    const filters = { ...view.filters, pinned: !view.filters?.pinned }
    await supabase.from('smart_views').update({ filters }).eq('id', view.id)
    fetchViews()
  }

  const deleteView = async (id: string) => {
    if (!confirm('Delete this view?')) return
    await supabase.from('smart_views').delete().eq('id', id)
    fetchViews()
    if (activeView === id) { setActiveView(null); setResults(null) }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] leading-9 font-bold text-white">Smart Views</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New View
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Views list */}
        <div className="space-y-2">
          {views.length === 0 ? (
            <p className="text-gray-500 text-sm">No saved views yet. Create one to get started.</p>
          ) : [...views]
            .sort((a, b) => Number(Boolean(b.filters?.pinned)) - Number(Boolean(a.filters?.pinned)))
            .map((view) => (
            <div
              key={view.id}
              className={`flex items-center justify-between border rounded-xl p-3 min-h-11 cursor-pointer ${
                activeView === view.id ? 'border-gray-500 bg-gray-800/60' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => runView(view)}
            >
              <span className="font-medium text-white text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /> {view.name}</span>
              <span className="flex items-center">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(view) }}
                  className={`p-2 ${view.filters?.pinned ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                  aria-label={view.filters?.pinned ? `Unpin view ${view.name}` : `Pin view ${view.name} to sidebar`}
                  title={view.filters?.pinned ? 'Pinned to sidebar' : 'Pin to sidebar'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteView(view.id) }}
                  className="text-gray-500 hover:text-red-400 p-2 -mr-1"
                  aria-label={`Delete view ${view.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="md:col-span-2">
          {results === null ? (
            <p className="text-gray-500 text-sm py-8 text-center">Select a view to see matching leads.</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No leads match this view.</p>
          ) : (
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-gray-500 mb-2">{results.length} leads</p>
              <div className="divide-y divide-gray-800 border-t border-b border-gray-800">
              {results.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="block py-3 px-1 min-h-11 hover:bg-gray-900 transition-colors"
                >
                  <div className="font-medium text-white text-sm flex items-center gap-2 flex-wrap">
                    <span>{c.business_name || `${c.first_name} ${c.last_name}`}</span>
                    {c.priority && <Star className="inline w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs font-normal">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: leadStatusColor(leadStatusOf(c)) }} />
                      {leadStatusOf(c)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.phone && `${c.phone} · `}{c.category}
                    {c._lastActivity !== undefined && (
                      <span className="font-mono">
                        {' · '}{c._lastActivity ? `Last activity ${c._lastActivity.split('T')[0]}` : 'No activity yet'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddViewModal onClose={() => { setShowAdd(false); fetchViews() }} />}
    </AppLayout>
  )
}

function AddViewModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [contactType, setContactType] = useState('')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [statuses, setStatuses] = useState<string[]>([])
  const [noActivityDays, setNoActivityDays] = useState('')
  const [noFollowup, setNoFollowup] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [fieldDefs, setFieldDefs] = useState<any[]>([])
  const [cfName, setCfName] = useState('')
  const [cfValue, setCfValue] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('custom_field_defs').select('*').order('name')
      .then(({ data }) => setFieldDefs(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleStatus = (value: string) =>
    setStatuses(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('smart_views').insert([{
      name,
      filters: {
        contact_type: contactType || undefined,
        priority_only: priorityOnly || undefined,
        lead_statuses: statuses.length ? statuses : undefined,
        no_activity_days: noActivityDays ? Number(noActivityDays) : undefined,
        no_followup: noFollowup || undefined,
        pinned: pinned || undefined,
        custom_field: cfName && cfValue ? { name: cfName, value: cfValue } : undefined,
      },
    }])
    setSaving(false)
    onClose()
  }

  const input = "w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
  const label = "font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500 block mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">New Smart View</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="View name (e.g., Not contacted in 14 days)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            className={input}
          >
            <option value="">All contact types</option>
            <option value="prospect">Prospects</option>
            <option value="club">Clubs</option>
            <option value="client">Clients</option>
          </select>
          <div>
            <span className={label}>Lead status</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {LEAD_STATUSES.map((s) => (
                <label key={s.value} className="flex items-center gap-1.5 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={statuses.includes(s.value)}
                    onChange={() => toggleStatus(s.value)}
                    className="w-4 h-4"
                  />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.value}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="no-activity-days" className={label}>Activity</label>
            <input
              id="no-activity-days"
              type="number"
              min="1"
              placeholder="No activity in this many days (e.g. 14)"
              value={noActivityDays}
              onChange={(e) => setNoActivityDays(e.target.value)}
              className={input}
            />
          </div>
          {fieldDefs.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cf-name" className={label}>Custom field</label>
                <select id="cf-name" value={cfName} onChange={(e) => setCfName(e.target.value)} className={input}>
                  <option value="">Any field</option>
                  {fieldDefs.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cf-value" className={label}>Value contains</label>
                <input
                  id="cf-value"
                  placeholder="Value"
                  value={cfValue}
                  onChange={(e) => setCfValue(e.target.value)}
                  className={input}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={noFollowup}
                onChange={(e) => setNoFollowup(e.target.checked)}
                className="w-4 h-4"
              />
              No follow-up scheduled
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={priorityOnly}
                onChange={(e) => setPriorityOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <Star className="w-4 h-4 text-yellow-400" /> Priority only
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4"
              />
              <Pin className="w-4 h-4 text-gray-400" /> Pin to sidebar
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 min-h-11 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? 'Saving...' : 'Create View'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
