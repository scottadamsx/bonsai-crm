'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import ActivityIcon from '@/components/ActivityIcon'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  MapPin,
  Globe,
  Pencil,
  Trash2,
  Plus,
  Clock,
  Check,
} from 'lucide-react'
import type { Contact, Activity, Reminder, Deal, PipelineStage, CustomFieldDef } from '@/lib/types'

type DealRow = Deal & { stage?: { name: string } | null }
import { LEAD_STATUSES, leadStatusOf, leadStatusColor } from '@/lib/leadStatus'
import { moveDealToStage } from '@/lib/deals'

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [deals, setDeals] = useState<DealRow[]>([])
  const [allStages, setAllStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [showReminder, setShowReminder] = useState(false)
  const [editing, setEditing] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [mobileTab, setMobileTab] = useState<'details' | 'activity'>('details')
  // Inline composer state (sits on top of the activity feed, like Close)
  const [cType, setCType] = useState('call')
  const [cSubject, setCSubject] = useState('')
  const [cBody, setCBody] = useState('')
  const [cOutcome, setCOutcome] = useState('')
  const [cSaving, setCSaving] = useState(false)
  const supabase = createClient()

  const changeStatus = async (value: string) => {
    if (!contact) return
    setStatusError('')
    const { error } = await supabase.from('contacts').update({ lead_status: value }).eq('id', contact.id)
    if (error) {
      setStatusError('Could not save status. Try again.')
      return
    }
    setContact({ ...contact, lead_status: value })
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: c } = await supabase.from('contacts').select('*').eq('id', id).single()
    setContact(c)
    const { data: a } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
    setActivities(a || [])
    const { data: r } = await supabase
      .from('reminders')
      .select('*')
      .eq('contact_id', id)
      .order('due_date', { ascending: true })
    setReminders(r || [])
    const { data: d } = await supabase
      .from('deals')
      .select('*, stage:pipeline_stages(name)')
      .eq('contact_id', id)
      .order('created_at', { ascending: true })
    setDeals(d || [])
    const { data: st } = await supabase.from('pipeline_stages').select('*').order('position')
    setAllStages(st || [])
    setLoading(false)
  }

  const submitComposer = async () => {
    setCSaving(true)
    await supabase.from('activities').insert([{
      contact_id: id,
      type: cType,
      subject: cSubject || null,
      body: cBody || null,
      outcome: cType === 'call' ? (cOutcome || null) : null,
      direction: 'outbound',
    }])
    setCSaving(false)
    setCSubject('')
    setCBody('')
    setCOutcome('')
    fetchData()
  }

  const changeDealStage = async (deal: DealRow, stageId: string) => {
    const stage = allStages.find(s => s.id === stageId)
    if (!stage) return
    await moveDealToStage(supabase, deal.id, stageId, stage.name, deal.won_date)
    fetchData()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    await supabase.from('contacts').delete().eq('id', id)
    router.push('/contacts')
  }

  if (loading) return <AppLayout><p className="text-gray-500">Loading...</p></AppLayout>
  if (!contact) return <AppLayout><p className="text-gray-500">Lead not found.</p></AppLayout>

  const displayName = contact.business_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  const personName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  const openReminders = reminders.filter(r => !r.completed)

  return (
    <AppLayout>
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4 min-h-11">
        <ArrowLeft className="w-4 h-4" /> Back to leads
      </Link>

      {/* Mobile: two tabs only, Details and Activity (mobile spec rule 3) */}
      <div className="flex gap-2 mb-4 lg:hidden">
        {([
          { value: 'details', label: 'Details' },
          { value: 'activity', label: 'Activity' },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => setMobileTab(t.value)}
            className={`flex-1 min-h-11 px-4 rounded-full border text-sm transition-colors ${
              mobileTab === t.value
                ? 'bg-gray-100 border-gray-100 text-gray-950 font-medium'
                : 'border-gray-800 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left rail: lead details, like Close */}
        <div className={`space-y-4 ${mobileTab === 'activity' ? 'hidden lg:block' : ''}`}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-white leading-snug flex items-center gap-1.5">
                  <span className="truncate">{displayName}</span>
                  {contact.priority && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                  )}
                </h1>
                {personName && contact.business_name && (
                  <p className="text-sm text-gray-400 mt-0.5">{personName}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditing(!editing)}
                  className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300"
                  aria-label="Edit lead"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-md bg-gray-800 hover:bg-red-900 text-gray-300"
                  aria-label="Delete lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: leadStatusColor(leadStatusOf(contact)) }} />
                {leadStatusOf(contact)}
              </span>
              {contact.contact_type && (
                <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs capitalize">
                  {contact.contact_type}
                </span>
              )}
              {contact.category && (
                <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs">
                  {contact.category}
                </span>
              )}
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              {contact.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="font-mono text-gray-200 hover:text-white">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-gray-200 hover:text-white truncate">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-200">{contact.address}</span>
                </div>
              )}
              {contact.website_status && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-200">{contact.website_status}</span>
                </div>
              )}
            </dl>

            {contact.notes && (
              <p className="text-gray-400 text-sm mt-4 pt-3 border-t border-gray-800 whitespace-pre-wrap">
                {contact.notes}
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-gray-800">
              <label htmlFor="lead-status" className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-500">
                Lead status
              </label>
              <select
                id="lead-status"
                value={leadStatusOf(contact)}
                onChange={(e) => changeStatus(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.value}</option>
                ))}
              </select>
              {statusError && <p className="text-xs text-red-400 mt-1.5">{statusError}</p>}
            </div>

            {editing && <EditForm contact={contact} onSave={() => { setEditing(false); fetchData() }} />}
          </div>

          {/* Deals for this lead, with a one-picker stage change */}
          {deals.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-2">Deals</h2>
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="px-3 py-2.5 rounded-md bg-gray-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white capitalize">{deal.pipeline}</span>
                      <span className="font-mono text-xs text-gray-400">
                        ${Number(deal.value || 0).toLocaleString()}
                        {Number(deal.recurring_value || 0) > 0 && ` + $${Number(deal.recurring_value).toLocaleString()}/mo`}
                      </span>
                    </div>
                    {deal.won_date && (
                      <div className="font-mono text-[11px] text-gray-500 mt-0.5">Won {deal.won_date}</div>
                    )}
                    <select
                      value={deal.stage_id || ''}
                      onChange={(e) => changeDealStage(deal, e.target.value)}
                      className="w-full mt-2 px-2.5 py-2 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                      aria-label={`Stage for ${deal.pipeline} deal`}
                    >
                      {allStages
                        .filter(s => s.pipeline === deal.pipeline)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups for this lead */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" /> Follow-ups
              </h2>
              <button
                onClick={() => setShowReminder(true)}
                className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white min-h-11 px-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {openReminders.length === 0 ? (
              <p className="text-gray-500 text-sm">No open follow-ups.</p>
            ) : (
              <div className="space-y-2">
                {openReminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-gray-800/50">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{r.title}</div>
                      <div className="font-mono text-[11px] text-gray-500">
                        {r.snoozed_until ? `Snoozed until ${r.snoozed_until}` : `Due ${r.due_date}`}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.from('reminders').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', r.id)
                        fetchData()
                      }}
                      className="inline-flex items-center gap-1 text-gray-200 hover:text-white text-sm shrink-0 min-h-11 px-2"
                    >
                      <Check className="w-4 h-4" /> Done
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main column: actions + composer + unified activity feed, like Close */}
        <div className={mobileTab === 'details' ? 'hidden lg:block' : ''}>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setShowReminder(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
            >
              <Clock className="w-4 h-4" /> Set Follow-up
            </button>
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
              >
                <Phone className="w-4 h-4" /> Call Now
              </a>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            {/* Composer on top of the feed: log where you read history */}
            <div className="pb-4 mb-4 border-b border-gray-800">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['call', 'email', 'sms', 'meeting', 'note'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCType(t)}
                    className={`px-3 min-h-11 inline-flex items-center rounded-full border text-sm capitalize transition-colors ${
                      cType === t
                        ? 'bg-gray-100 border-gray-100 text-gray-950 font-medium'
                        : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {cType === 'call' && (
                <select
                  value={cOutcome}
                  onChange={(e) => setCOutcome(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-2"
                >
                  <option value="">Select outcome...</option>
                  <option value="connected">Connected</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="no_answer">No answer</option>
                  <option value="wrong_number">Wrong number</option>
                </select>
              )}
              <input
                placeholder="Subject (optional)"
                value={cSubject}
                onChange={(e) => setCSubject(e.target.value)}
                className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-2"
              />
              <textarea
                placeholder="Notes..."
                rows={3}
                value={cBody}
                onChange={(e) => setCBody(e.target.value)}
                className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
              />
              <button
                onClick={submitComposer}
                disabled={cSaving}
                className="mt-3 px-4 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium"
              >
                {cSaving ? 'Logging...' : `Log ${cType}`}
              </button>
            </div>

            <h2 className="font-semibold text-white mb-3">Activity</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet. Log your first call or note above.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0 text-gray-400">
                      <ActivityIcon type={a.type} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white capitalize">{a.type}</span>
                        {a.outcome && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                            {a.outcome.replace('_', ' ')}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-gray-500">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      {a.subject && <div className="text-sm text-gray-300 mt-0.5">{a.subject}</div>}
                      {a.body && <div className="text-sm text-gray-400 mt-0.5 whitespace-pre-wrap">{a.body}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReminder && (
        <ReminderModal
          contactId={id}
          onClose={() => { setShowReminder(false); fetchData() }}
        />
      )}
    </AppLayout>
  )
}

function EditForm({ contact, onSave }: { contact: Contact; onSave: () => void }) {
  const [form, setForm] = useState({
    business_name: contact.business_name || '',
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    address: contact.address || '',
    category: contact.category || '',
    contact_type: contact.contact_type,
    website_status: contact.website_status || '',
    notes: contact.notes || '',
    priority: contact.priority,
  })
  const [fieldDefs, setFieldDefs] = useState<CustomFieldDef[]>([])
  const [cfValues, setCfValues] = useState<Record<string, unknown>>(contact.custom_fields || {})
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('custom_field_defs').select('*').order('name')
      .then(({ data }) => setFieldDefs(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('contacts').update({ ...form, custom_fields: cfValues }).eq('id', contact.id)
    setSaving(false)
    onSave()
  }

  const input = "w-full px-3 py-2 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={input} placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        <input className={input} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className={input} placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input className={input} placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input className={input} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={input} placeholder="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={input} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className={input} placeholder="Website status" value={form.website_status} onChange={(e) => setForm({ ...form, website_status: e.target.value })} />
      </div>
      <textarea className={input} placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      {fieldDefs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fieldDefs.map((def) => {
            const value = cfValues[def.name]
            const set = (v: unknown) => setCfValues(prev => ({ ...prev, [def.name]: v }))
            if (def.field_type === 'select') {
              return (
                <select
                  key={def.id}
                  value={value == null ? '' : String(value)}
                  onChange={(e) => set(e.target.value)}
                  className={input}
                  aria-label={def.name}
                >
                  <option value="">{def.name}: not set</option>
                  {(def.options || []).map((o: string) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )
            }
            return (
              <input
                key={def.id}
                type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                placeholder={def.name}
                value={value == null ? '' : String(value)}
                onChange={(e) => set(def.field_type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
                className={input}
                aria-label={def.name}
              />
            )
          })}
        </div>
      )}
      <div className="flex items-center gap-4">
        <select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value as Contact['contact_type'] })} className={input + ' w-auto'}>
          <option value="prospect">Prospect</option>
          <option value="club">Club</option>
          <option value="client">Client</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.checked })} className="w-4 h-4" />
          <Star className="w-4 h-4 text-yellow-400" /> Priority
        </label>
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

function ReminderModal({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('reminders').insert([{ contact_id: contactId, title, due_date: dueDate }])
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">Set Follow-up</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="What to do? (e.g., Follow up on mockup)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 min-h-11 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? 'Saving...' : 'Set Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
