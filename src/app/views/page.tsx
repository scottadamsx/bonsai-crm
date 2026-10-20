'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Filter, Plus, Star, X } from 'lucide-react'

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

    setResults(filtered)
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
          ) : views.map((view) => (
            <div
              key={view.id}
              className={`flex items-center justify-between border rounded-xl p-3 min-h-11 cursor-pointer ${
                activeView === view.id ? 'border-gray-500 bg-gray-800/60' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => runView(view)}
            >
              <span className="font-medium text-white text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-gray-400" /> {view.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteView(view.id) }}
                className="text-gray-500 hover:text-red-400 p-2 -mr-1"
                aria-label={`Delete view ${view.name}`}
              >
                <X className="w-4 h-4" />
              </button>
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
                  <div className="font-medium text-white text-sm">
                    {c.business_name || `${c.first_name} ${c.last_name}`}
                    {c.priority && <Star className="inline w-3.5 h-3.5 ml-1 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.phone && `${c.phone} · `}{c.category}
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
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('smart_views').insert([{
      name,
      filters: {
        contact_type: contactType || undefined,
        priority_only: priorityOnly || undefined,
      },
    }])
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">New Smart View</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="View name (e.g., Priority restaurants)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          >
            <option value="">All contact types</option>
            <option value="prospect">Prospects</option>
            <option value="club">Clubs</option>
            <option value="client">Clients</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={priorityOnly}
              onChange={(e) => setPriorityOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <Star className="w-4 h-4 text-yellow-400" /> Priority only
          </label>
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
