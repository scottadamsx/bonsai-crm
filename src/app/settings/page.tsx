'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

export default function SettingsPage() {
  const [stages, setStages] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [pipeline, setPipeline] = useState('websites')
  const [newStageName, setNewStageName] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [pipeline])

  const fetchData = async () => {
    const { data: s } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline', pipeline)
      .order('position')
    setStages(s || [])

    const { data: t } = await supabase.from('email_templates').select('*').order('name')
    setTemplates(t || [])
  }

  const addStage = async () => {
    if (!newStageName.trim()) return
    const maxPos = stages.length > 0 ? Math.max(...stages.map(s => s.position)) : -1
    await supabase.from('pipeline_stages').insert([{
      name: newStageName.trim(),
      position: maxPos + 1,
      pipeline,
      color: '#3B82F6',
    }])
    setNewStageName('')
    fetchData()
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Delete this stage? Deals in this stage will be unassigned.')) return
    await supabase.from('pipeline_stages').delete().eq('id', id)
    fetchData()
  }

  const moveStage = async (id: string, direction: 'up' | 'down') => {
    const idx = stages.findIndex(s => s.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === stages.length - 1) return

    const otherIdx = direction === 'up' ? idx - 1 : idx + 1
    const current = stages[idx]
    const other = stages[otherIdx]

    await supabase.from('pipeline_stages').update({ position: other.position }).eq('id', current.id)
    await supabase.from('pipeline_stages').update({ position: current.position }).eq('id', other.id)
    fetchData()
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Pipeline stages */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">📋 Pipeline Stages</h2>
          <div className="flex gap-2">
            {['websites', 'clubs'].map((p) => (
              <button
                key={p}
                onClick={() => setPipeline(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  pipeline === p ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
              <span className="flex-1 text-sm text-white font-medium">{stage.name}</span>
              <button onClick={() => moveStage(stage.id, 'up')} className="text-gray-500 hover:text-white text-sm px-1">↑</button>
              <button onClick={() => moveStage(stage.id, 'down')} className="text-gray-500 hover:text-white text-sm px-1">↓</button>
              <button onClick={() => deleteStage(stage.id)} className="text-gray-500 hover:text-red-400 text-sm px-1">×</button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            placeholder="New stage name..."
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStage()}
            className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
          />
          <button
            onClick={addStage}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Email templates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">✉️ Email Templates</h2>
          <button
            onClick={() => setEditingTemplate({ name: '', subject: '', body: '' })}
            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium"
          >
            + New Template
          </button>
        </div>

        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2.5">
              <div>
                <div className="text-sm text-white font-medium">{t.name}</div>
                <div className="text-xs text-gray-400">{t.subject}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingTemplate(t)}
                  className="text-gray-500 hover:text-white text-sm px-2"
                >
                  ✏️
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Delete this template?')) return
                    await supabase.from('email_templates').delete().eq('id', t.id)
                    fetchData()
                  }}
                  className="text-gray-500 hover:text-red-400 text-sm px-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingTemplate && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setEditingTemplate(null); fetchData() }}
        />
      )}
    </AppLayout>
  )
}

function TemplateModal({ template, onClose }: { template: any; onClose: () => void }) {
  const [name, setName] = useState(template.name || '')
  const [subject, setSubject] = useState(template.subject || '')
  const [body, setBody] = useState(template.body || '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    if (template.id) {
      await supabase.from('email_templates').update({ name, subject, body }).eq('id', template.id)
    } else {
      await supabase.from('email_templates').insert([{ name, subject, body }])
    }
    setSaving(false)
    onClose()
  }

  const input = "w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">
          {template.id ? 'Edit Template' : 'New Template'}
        </h2>
        <div className="space-y-3">
          <input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
          <input placeholder="Email subject (use {{business_name}} for personalization)" value={subject} onChange={(e) => setSubject(e.target.value)} className={input} />
          <textarea placeholder="Email body..." rows={10} value={body} onChange={(e) => setBody(e.target.value)} className={input} />
          <p className="text-xs text-gray-500">
            Use {'{{business_name}}'}, {'{{first_name}}'} as placeholders.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">Cancel</button>
            <button onClick={handleSave} disabled={saving || !name} className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium">
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
