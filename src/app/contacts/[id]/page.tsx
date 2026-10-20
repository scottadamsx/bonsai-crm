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
import type { Contact, Activity, Reminder } from '@/lib/types'

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [editing, setEditing] = useState(false)
  const supabase = createClient()

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
    setLoading(false)
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

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left rail: lead details, like Close */}
        <div className="space-y-4">
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

            {editing && <EditForm contact={contact} onSave={() => { setEditing(false); fetchData() }} />}
          </div>

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
                      <div className="font-mono text-[11px] text-gray-500">Due {r.due_date}</div>
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

        {/* Main column: actions + unified activity feed, like Close */}
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setShowActivity(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Log Activity
            </button>
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

      {showActivity && (
        <ActivityModal
          contactId={id}
          onClose={() => { setShowActivity(false); fetchData() }}
        />
      )}
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
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('contacts').update(form).eq('id', contact.id)
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
      <div className="flex items-center gap-4">
        <select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value as any })} className={input + ' w-auto'}>
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

function ActivityModal({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const [type, setType] = useState('call')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [outcome, setOutcome] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('activities').insert([{
      contact_id: contactId,
      type,
      subject: subject || null,
      body: body || null,
      outcome: outcome || null,
      direction: 'outbound',
    }])
    setSaving(false)
    onClose()
  }

  const input = "w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-white mb-4">Log Activity</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="meeting">Meeting</option>
            <option value="note">Note</option>
          </select>
          {type === 'call' && (
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={input}>
              <option value="">Select outcome...</option>
              <option value="connected">Connected</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No answer</option>
              <option value="wrong_number">Wrong number</option>
            </select>
          )}
          <input className={input} placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className={input} placeholder="Notes..." rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 min-h-11 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
