'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Plus, Star, Phone, ChevronRight } from 'lucide-react'
import type { Contact } from '@/lib/types'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('business_name', { ascending: true })
    setContacts(data || [])
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
    return matchSearch && matchType && matchCategory
  })

  const categories = [...new Set(contacts.map(c => c.category).filter((c): c is string => Boolean(c)))]

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
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gray-500 mt-1.5">{filtered.length} leads</p>
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
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setFilterCategory('')} className={pill(filterCategory === '')}>
            All categories
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={pill(filterCategory === cat)}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Leads table: quiet list styling, hairline dividers, no card box */}
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
            onClick={() => { setSearch(''); setFilterType(''); setFilterCategory('') }}
            className="inline-flex items-center px-5 min-h-11 mt-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                <th className="font-medium px-4 py-3">Lead</th>
                <th className="font-medium px-4 py-3 hidden md:table-cell">Type</th>
                <th className="font-medium px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Phone</th>
                <th className="font-medium px-4 py-3 hidden xl:table-cell">Email</th>
                <th className="px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/70">
              {filtered.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-900 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-white truncate">
                        {contact.business_name || `${contact.first_name} ${contact.last_name}`}
                      </span>
                      {contact.priority && (
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                      )}
                    </Link>
                    {(contact.first_name || contact.last_name) && contact.business_name && (
                      <div className="text-xs text-gray-500 truncate">
                        {contact.first_name} {contact.last_name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {contact.contact_type && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs capitalize">
                        {contact.contact_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 hidden lg:table-cell">
                    {contact.category || ''}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white"
                      >
                        <Phone className="w-3.5 h-3.5" /> {contact.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 hidden xl:table-cell truncate max-w-55">
                    {contact.email || ''}
                  </td>
                  <td className="px-2 py-3.5">
                    <Link href={`/contacts/${contact.id}`} aria-label="Open lead">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddContactModal onClose={() => { setShowAdd(false); fetchContacts() }} />}
    </AppLayout>
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
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('contacts').insert([form])
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
