'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Check, ListTodo, Plus, Trash2, X } from 'lucide-react'
import { fetchAll } from '@/lib/fetchAll'

type TaskRow = {
  id: string
  contact_id: string | null
  title: string
  due_date: string
  snoozed_until: string | null
  completed: boolean
  completed_at: string | null
  contact?: { business_name: string | null; first_name: string | null; last_name: string | null } | null
}

type ContactOption = { id: string; business_name: string | null; first_name: string | null; last_name: string | null }

const contactLabel = (c: { business_name: string | null; first_name: string | null; last_name: string | null }) =>
  c.business_name || `${c.first_name || ''} ${c.last_name || ''}`.trim()

const effectiveDate = (t: TaskRow) => t.snoozed_until || t.due_date

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [leadSearch, setLeadSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<ContactOption | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const fetchTasks = async () => {
    setLoading(true)
    const data = await fetchAll<TaskRow>((from, to) => supabase
      .from('reminders')
      .select('*, contact:contacts(business_name, first_name, last_name)')
      .order('due_date', { ascending: true })
      .range(from, to))
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
    fetchAll<ContactOption>((from, to) => supabase
      .from('contacts')
      .select('id, business_name, first_name, last_name')
      .order('business_name')
      .range(from, to)).then(setContacts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const leadMatches = useMemo(() => {
    const q = leadSearch.trim().toLowerCase()
    if (!q) return []
    return contacts.filter(c => contactLabel(c).toLowerCase().includes(q)).slice(0, 8)
  }, [leadSearch, contacts])

  const addTask = async () => {
    const t = title.trim()
    if (!t) return
    setError('')
    const { error } = await supabase.from('reminders').insert([{
      contact_id: selectedLead?.id ?? null,
      title: t,
      due_date: dueDate || today,
    }])
    if (error) { setError('Could not save the task. Try again.'); return }
    setTitle('')
    setLeadSearch('')
    setSelectedLead(null)
    setShowForm(false)
    fetchTasks()
  }

  const setCompleted = async (task: TaskRow, done: boolean) => {
    await supabase.from('reminders').update({
      completed: done,
      completed_at: done ? new Date().toISOString() : null,
    }).eq('id', task.id)
    fetchTasks()
  }

  const removeTask = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id)
    fetchTasks()
  }

  const open = tasks.filter(t => !t.completed)
    .sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)))
  const done = tasks.filter(t => t.completed)
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
  const overdue = open.filter(t => effectiveDate(t) < today)
  const dueToday = open.filter(t => effectiveDate(t) === today)
  const upcoming = open.filter(t => effectiveDate(t) > today)

  const TaskCard = ({ t, isOverdue }: { t: TaskRow; isOverdue?: boolean }) => (
    <div className={`bg-gray-900 border rounded-xl p-4 ${isOverdue ? 'border-red-800' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={`font-medium text-sm ${t.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{t.title}</div>
          {t.contact_id && t.contact ? (
            <Link href={`/contacts/${t.contact_id}`} className="text-sm text-gray-400 hover:text-white">
              {contactLabel(t.contact)}
            </Link>
          ) : (
            <div className="text-sm text-gray-500">Personal task</div>
          )}
          <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
            {t.snoozed_until && t.snoozed_until > today
              ? `Snoozed until ${t.snoozed_until}`
              : isOverdue
                ? `Overdue since ${t.due_date}`
                : t.completed
                  ? `Done ${t.completed_at ? t.completed_at.split('T')[0] : ''}`
                  : `Due ${effectiveDate(t)}`}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {t.completed ? (
            <button
              onClick={() => setCompleted(t, false)}
              className="px-4 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => setCompleted(t, true)}
              className="px-4 min-h-11 inline-flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
            >
              <Check className="w-4 h-4 text-green-400" /> Done
            </button>
          )}
          <button
            onClick={() => removeTask(t.id)}
            className="px-3 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )

  const Section = ({ label, items, isOverdue }: { label: string; items: TaskRow[]; isOverdue?: boolean }) => (
    items.length > 0 ? (
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">{label} ({items.length})</h2>
        <div className="space-y-2">
          {items.map(t => <TaskCard key={t.id} t={t} isOverdue={isOverdue} />)}
        </div>
      </section>
    ) : null
  )

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-green-400" /> Tasks
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {open.length} open {open.length === 1 ? 'task' : 'tasks'}
            {overdue.length > 0 && <span className="text-red-400"> · {overdue.length} overdue</span>}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-5 min-h-11 inline-flex items-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
          )}
        </div>

        {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask() }}
            placeholder="What do you need to do?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-base text-white focus:outline-none focus:border-green-500"
              aria-label="Due date"
            />
            <div className="relative flex-1 min-w-52">
              {selectedLead ? (
                <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                  <span className="text-base text-white truncate">{contactLabel(selectedLead)}</span>
                  <button onClick={() => setSelectedLead(null)} aria-label="Clear lead" className="ml-2 shrink-0">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <input
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  placeholder="Link a lead (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              )}
              {!selectedLead && leadMatches.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  {leadMatches.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedLead(c); setLeadSearch('') }}
                      className="block w-full text-left px-3 py-2.5 text-base text-gray-200 hover:bg-gray-700"
                    >
                      {contactLabel(c)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={addTask}
              className="px-5 min-h-11 inline-flex items-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 min-h-11 inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-gray-500">No lead linked means a personal task, just for you.</p>
        </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading tasks...</p>
        ) : (
          <>
            <Section label="Overdue" items={overdue} isOverdue />
            <Section label="Today" items={dueToday} />
            <Section label="Upcoming" items={upcoming} />
            {open.length === 0 && (
              <p className="text-gray-400 text-sm">Nothing open. Add your first task above.</p>
            )}
            {done.length > 0 && (
              <section>
                <button
                  onClick={() => setShowDone(!showDone)}
                  className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3"
                >
                  Completed ({done.length}) {showDone ? '· hide' : '· show'}
                </button>
                {showDone && (
                  <div className="space-y-2">
                    {done.map(t => <TaskCard key={t.id} t={t} />)}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
