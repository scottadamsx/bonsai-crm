'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import type { Deal, PipelineStage } from '@/lib/types'

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipeline, setPipeline] = useState('websites')
  const [loading, setLoading] = useState(true)
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [pipeline])

  const fetchData = async () => {
    setLoading(true)
    const { data: s } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline', pipeline)
      .order('position')
    setStages(s || [])

    const { data: d } = await supabase
      .from('deals')
      .select('*, contact:contacts(business_name, first_name, last_name, phone, priority)')
      .eq('pipeline', pipeline)
      .order('position')
    setDeals(d || [])
    setLoading(false)
  }

  const handleDrop = async (stageId: string) => {
    if (!draggedDeal) return

    // Optimistic update
    setDeals(prev => prev.map(d =>
      d.id === draggedDeal ? { ...d, stage_id: stageId } : d
    ))

    await supabase
      .from('deals')
      .update({ stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', draggedDeal)

    setDraggedDeal(null)
  }

  const addDealToPipeline = async (contactId: string) => {
    const firstStage = stages[0]
    if (!firstStage) return

    await supabase.from('deals').insert([{
      contact_id: contactId,
      stage_id: firstStage.id,
      pipeline,
      value: 300,
      recurring_value: 50,
    }])
    fetchData()
  }

  const stageValue = (stageId: string) =>
    deals.filter(d => d.stage_id === stageId).reduce((sum, d) => sum + Number(d.value || 0), 0)

  const totalValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0)
  const totalRecurring = deals.reduce((sum, d) => sum + Number(d.recurring_value || 0), 0)

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">
            ${totalValue.toLocaleString()} one-time · ${totalRecurring.toLocaleString()}/mo recurring
          </p>
        </div>
        <div className="flex gap-2">
          {['websites', 'clubs'].map((p) => (
            <button
              key={p}
              onClick={() => setPipeline(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                pipeline === p
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id)
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.id)}
                className="flex-shrink-0 w-72 bg-gray-900 border border-gray-800 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-white text-sm">{stage.name}</h3>
                    <span className="text-xs text-gray-500">({stageDeals.length})</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  ${stageValue(stage.id).toLocaleString()}
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedDeal(deal.id)}
                      onDragEnd={() => setDraggedDeal(null)}
                      className={`bg-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-750 transition-colors ${
                        draggedDeal === deal.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Link href={`/contacts/${deal.contact_id}`} className="block">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white text-sm truncate">
                            {deal.contact?.business_name || 'Unknown'}
                          </span>
                          {deal.contact?.priority && <span className="text-yellow-400 text-xs">⭐</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ${Number(deal.value || 0).toLocaleString()}
                          {Number(deal.recurring_value || 0) > 0 &&
                            ` + $${Number(deal.recurring_value).toLocaleString()}/mo`}
                        </div>
                      </Link>
                      {deal.contact?.phone && (
                        <a
                          href={`tel:${deal.contact.phone}`}
                          className="text-xs text-green-400 hover:text-green-300 mt-1 inline-block"
                        >
                          📞 {deal.contact.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <AddDealForm pipeline={pipeline} onAdd={fetchData} />
      </div>
    </AppLayout>
  )
}

function AddDealForm({ pipeline, onAdd }: { pipeline: string; onAdd: () => void }) {
  const [contacts, setContacts] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [show, setShow] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (show) fetchContacts()
  }, [show])

  const fetchContacts = async () => {
    // Get contacts not already in this pipeline
    const { data: existingDeals } = await supabase
      .from('deals')
      .select('contact_id')
      .eq('pipeline', pipeline)
    const existingIds = (existingDeals || []).map(d => d.contact_id)

    const { data } = await supabase
      .from('contacts')
      .select('id, business_name, first_name, last_name')
      .order('business_name')

    setContacts((data || []).filter(c => !existingIds.includes(c.id)))
  }

  const handleAdd = async () => {
    if (!selected) return
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline', pipeline)
      .order('position')
      .limit(1)

    if (!stages || stages.length === 0) return

    await supabase.from('deals').insert([{
      contact_id: selected,
      stage_id: stages[0].id,
      pipeline,
      value: pipeline === 'websites' ? 300 : 0,
      recurring_value: pipeline === 'websites' ? 50 : 0,
    }])

    setShow(false)
    setSelected('')
    onAdd()
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
      >
        + Add contact to pipeline
      </button>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-md">
      <h3 className="font-semibold text-white mb-3">Add to {pipeline} pipeline</h3>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-3"
      >
        <option value="">Select a contact...</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.business_name || `${c.first_name} ${c.last_name}`}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={() => setShow(false)}
          className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!selected}
          className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
