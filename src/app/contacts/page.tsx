'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Plus, Star, Phone, Mail, Globe, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/lib/types'
import { fetchAll } from '@/lib/fetchAll'
import { LEAD_STATUSES, leadStatusOf, leadStatusColor } from '@/lib/leadStatus'

// Same URL test as the contact page: only real URLs become website links,
// status words ("None", "Poor site") stay unlinked.
function websiteHref(value: string): string | null {
  const v = value.trim()
  if (!v || /\s/.test(v)) return null
  if (/^https?:\/\//i.test(v)) return v
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) return `https://${v}`
  return null
}

// Addresses are stored as one string ("street, city, province postal");
// the city is the second segment when a street is present.
function locationOf(address: string | null): string {
  if (!address) return ''
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 3) return parts[1]
  return parts[0] || ''
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activityCounts, setActivityCounts] = useState<Map<string, number>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortDesc, setSortDesc] = useState(true)
  const [visibleCount, setVisibleCount] = useState(250)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    const data = await fetchAll<Contact>((from, to) => supabase
      .from('contacts')
      .select('*')
      .order('business_name', { ascending: true })
      .range(from, to))
    setContacts(data)
    // Activity count per lead, for the table's Activities column
    const acts = await fetchAll<{ contact_id: string }>((from, to) => supabase
      .from('activities')
      .select('contact_id')
      .order('created_at', { ascending: false })
      .range(from, to))
    const counts = new Map<string, number>()
    for (const a of acts) {
      counts.set(a.contact_id, (counts.get(a.contact_id) || 0) + 1)
    }
    setActivityCounts(counts)
    setLoading(false)
  }

  const filtered = contacts.filter((c) => {
    const matchSearch = !search ||
      (c.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || c.contact_type === filterType
    const matchCategory = !filterCategory || c.category === filterCategory
    const matchStatus = !filterStatus || leadStatusOf(c) === filterStatus
    return matchSearch && matchType && matchCategory && matchStatus
  })

  const sorted = [...filtered].sort((a, b) =>
    sortDesc
      ? b.created_at.localeCompare(a.created_at)
      : a.created_at.localeCompare(b.created_at)
  )
  const visible = sorted.slice(0, visibleCount)
  const activeFilterCount =
    (search ? 1 : 0) + (filterType ? 1 : 0) + (filterCategory ? 1 : 0) + (filterStatus ? 1 : 0)

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleSelectAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)))

  const applyBulkStatus = async (status: string) => {
    if (!status || selected.size === 0) return
    const { error } = await supabase.from('contacts').update({ lead_status: status }).in('id', [...selected])
    if (error) return
    setContacts((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, lead_status: status } : c)))
    setSelected(new Set())
  }

  useEffect(() => {
    setVisibleCount(250)
    setSelected(new Set())
  }, [search, filterType, filterCategory, filterStatus])

  const categoryCounts = new Map<string, number>()
  for (const c of contacts) {
    if (c.category) categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1)
  }
  const categories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([cat]) => cat)
  // Only the most-used categories earn a chip; the rest live in the picker modal.
  const TOP_CATEGORY_COUNT = 8
  const topCategories = categories.slice(0, TOP_CATEGORY_COUNT)
  const visibleCategories = filterCategory && !topCategories.includes(filterCategory)
    ? [...topCategories, filterCategory]
    : topCategories

  const pill = (active: boolean) =>
    `min-h-11 px-4 rounded-full border text-sm transition-colors ${
      active
        ? 'bg-gray-100 border-gray-100 text-gray-950 font-medium'
        : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
    }`

  const typePills = [
    { value: '', label: 'All types' },
    { value: 'prospect', label: 'Prospects' },
    { value: 'club', label: 'Clubs' },
    { value: 'client', label: 'Clients' },
  ]

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] leading-9 font-bold text-white">Leads</h1>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gray-500 mt-1.5">{filtered.length.toLocaleString()} leads</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Filters as visible pills (Rule 17: recognition over recall) */}
      <input
        type="text"
        placeholder="Search name, phone, email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 min-h-11 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3"
      />
      <div className="flex flex-wrap gap-2 mb-3">
        {typePills.map((p) => (
          <button key={p.label} onClick={() => setFilterType(p.value)} className={pill(filterType === p.value)}>
            {p.label}
          </button>
        ))}
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setFilterCategory('')} className={pill(filterCategory === '')}>
            All categories
          </button>
          {visibleCategories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={pill(filterCategory === cat)}>
              {cat}
            </button>
          ))}
          {categories.length > TOP_CATEGORY_COUNT && (
            <button onClick={() => setShowCategoryPicker(true)} className={pill(false)}>
              More categories ({categories.length - TOP_CATEGORY_COUNT})
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterStatus('')} className={pill(filterStatus === '')}>
          All statuses
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)} className={pill(filterStatus === s.value)}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
            {s.value}
          </button>
        ))}
      </div>

      {/* Toolbar: filter summary + created sort (Close-style grammar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-medium text-gray-300">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 font-mono text-xs">
              {activeFilterCount} active
            </span>
          )}
          <span className="font-mono text-xs text-gray-500">
            {filtered.length.toLocaleString()} Leads
          </span>
        </div>
        <button
          onClick={() => setSortDesc((d) => !d)}
          className="inline-flex items-center gap-1.5 px-3 min-h-11 rounded-lg border border-gray-800 text-sm text-gray-300 hover:text-white hover:border-gray-700"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Created: {sortDesc ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-4 py-2 rounded-lg bg-gray-900 border border-gray-800">
          <span className="text-sm text-white font-medium">{selected.size.toLocaleString()} selected</span>
          <select
            defaultValue=""
            onChange={(e) => { applyBulkStatus(e.target.value); e.target.value = '' }}
            className="px-3 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            aria-label="Set status for selected leads"
          >
            <option value="" disabled>Set status</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.value}</option>
            ))}
          </select>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 min-h-11 rounded-lg text-sm text-gray-300 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Leads table: Close-style dense data table, BONSAI colors */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base font-medium text-white">No leads yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first lead, or import a list from CSV.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Add lead
            </button>
            <Link
              href="/contacts/import"
              className="inline-flex items-center px-5 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm"
            >
              Import from CSV
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base font-medium text-white">No leads match</p>
          <p className="text-gray-400 text-sm mt-1">Nothing fits the current search and filters.</p>
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterCategory(''); setFilterStatus('') }}
            className="inline-flex items-center px-5 min-h-11 mt-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border-t border-b border-gray-800">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                  <th className="font-medium pl-4 pr-2 py-2.5 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered leads"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-green-500 align-middle cursor-pointer"
                    />
                  </th>
                  <th className="font-medium px-2 py-2.5">Name</th>
                  <th className="font-medium px-1 py-2.5 w-9"></th>
                  <th className="font-medium px-1 py-2.5 w-9"></th>
                  <th className="font-medium px-2 py-2.5">Status</th>
                  <th className="font-medium px-2 py-2.5">Category</th>
                  <th className="font-medium px-2 py-2.5">Location</th>
                  <th className="font-medium px-2 py-2.5">Created</th>
                  <th className="font-medium px-2 py-2.5 text-right">Activities</th>
                  <th className="font-medium px-2 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/70">
                {visible.map((contact) => {
                  const status = leadStatusOf(contact)
                  const statusColor = leadStatusColor(status)
                  const site = contact.website_status ? websiteHref(contact.website_status) : null
                  return (
                    <tr
                      key={contact.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('a,button,input,select,label')) return
                        router.push(`/contacts/${contact.id}`)
                      }}
                      className="h-10 hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <td className="pl-4 pr-2 py-1.5">
                        <input
                          type="checkbox"
                          aria-label="Select lead"
                          checked={selected.has(contact.id)}
                          onChange={() => toggleSelected(contact.id)}
                          className="w-4 h-4 accent-green-500 align-middle cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-1.5 max-w-55">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-white truncate">
                            {contact.business_name || `${contact.first_name} ${contact.last_name}`}
                          </span>
                          {contact.priority && (
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                          )}
                        </span>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} aria-label="Call lead" className="text-gray-300 hover:text-white">
                            <Phone className="w-4 h-4 inline" />
                          </a>
                        ) : (
                          <Phone className="w-4 h-4 inline text-gray-700" />
                        )}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} aria-label="Email lead" className="text-gray-300 hover:text-white">
                            <Mail className="w-4 h-4 inline" />
                          </a>
                        ) : (
                          <Mail className="w-4 h-4 inline text-gray-700" />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
                          style={{ backgroundColor: `${statusColor}22`, color: statusColor }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-gray-400 truncate max-w-40">{contact.category || ''}</td>
                      <td className="px-2 py-1.5 text-gray-400 truncate max-w-40">{locationOf(contact.address)}</td>
                      <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap font-mono text-xs">
                        {new Date(contact.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-xs text-gray-300">
                        {activityCounts.get(contact.id) || 0}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {site ? (
                          <a href={site} target="_blank" rel="noreferrer" aria-label="Open website" className="text-gray-300 hover:text-white">
                            <Globe className="w-4 h-4 inline" />
                          </a>
                        ) : (
                          <Globe className="w-4 h-4 inline text-gray-700" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <p className="font-mono text-xs text-gray-500">
              Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
            </p>
            {visibleCount < filtered.length && (
              <>
                <button
                  onClick={() => setVisibleCount((n) => n + 250)}
                  className="px-4 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
                >
                  Show more
                </button>
                <button
                  onClick={() => setVisibleCount(filtered.length)}
                  className="px-4 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
                >
                  Show all
                </button>
              </>
            )}
          </div>
        </>
      )}

      {showAdd && <AddContactModal onClose={() => { setShowAdd(false); fetchContacts() }} />}
      {showCategoryPicker && (
        <CategoryPickerModal
          categories={categories.map((cat) => ({ name: cat, count: categoryCounts.get(cat) || 0 }))}
          current={filterCategory}
          onSelect={(cat) => { setFilterCategory(cat); setShowCategoryPicker(false) }}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </AppLayout>
  )
}

function CategoryPickerModal({ categories, current, onSelect, onClose }: {
  categories: { name: string; count: number }[]
  current: string
  onSelect: (cat: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const shown = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
        <input
          autoFocus
          placeholder="Search categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-base mb-3"
        />
        <div className="overflow-y-auto -mx-2 px-2">
          <button
            onClick={() => onSelect('')}
            className={`w-full flex items-center justify-between px-3 min-h-11 rounded-lg text-sm ${current === '' ? 'bg-gray-100 text-gray-950 font-medium' : 'text-gray-200 hover:bg-gray-800'}`}
          >
            <span>All categories</span>
          </button>
          {shown.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className={`w-full flex items-center justify-between gap-3 px-3 min-h-11 rounded-lg text-sm ${current === c.name ? 'bg-gray-100 text-gray-950 font-medium' : 'text-gray-200 hover:bg-gray-800'}`}
            >
              <span className="truncate text-left">{c.name}</span>
              <span className="font-mono text-xs text-gray-500">{c.count}</span>
            </button>
          ))}
          {shown.length === 0 && (
            <p className="text-gray-500 text-sm px-3 py-4">No categories match that search.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AddContactModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    business_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    category: '',
    contact_type: 'prospect',
    lead_status: 'Spotted',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('contacts').insert([form])
    if (error) {
      // lead_status lands with migration 002; until it is applied, save without it
      const rest: Record<string, unknown> = { ...form }
      delete rest.lead_status
      await supabase.from('contacts').insert([rest])
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">Add Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Business name"
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            />
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            />
          </div>
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <input
            placeholder="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            />
            <select
              value={form.contact_type}
              onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
              className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            >
              <option value="prospect">Prospect</option>
              <option value="club">Club</option>
              <option value="client">Client</option>
            </select>
          </div>
          <select
            value={form.lead_status}
            onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
            aria-label="Lead status"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>Status: {s.value}</option>
            ))}
          </select>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 min-h-11 rounded-lg bg-gray-800 text-gray-300 font-medium text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium text-sm"
            >
              {saving ? 'Saving...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
