'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { Star, Phone } from 'lucide-react'
import type { Deal, PipelineStage } from '@/lib/types'
import { moveDealToStage, wonDateForMove } from '@/lib/deals'

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
    const deal = deals.find(d => d.id === draggedDeal)
    const stage = stages.find(s => s.id === stageId)
    if (!deal || !stage) return

    // Optimistic update, including the won date stamp
    setDeals(prev => prev.map(d =>
      d.id === draggedDeal
        ? { ...d, stage_id: stageId, won_date: wonDateForMove(stage.name, d.won_date) }
        : d
    ))

    await moveDealToStage(supabase, draggedDeal, stageId, stage.name, deal.won_date)

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
          <h1 className="text-[28px] leading-9 font-bold text-white">Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">
            <span className="font-mono text-white">${totalValue.toLocaleString()}</span> one-time ·{' '}
            <span className="font-mono text-white">${totalRecurring.toLocaleString()}/mo</span> recurring
          </p>
        </div>
        <div className="flex gap-2">
          {['websites', 'clubs'].map((p) => (
            <button
              key={p}
              onClick={() => setPipeline(p)}
              className={`px-4 min-h-11 inline-flex items-center rounded-full border text-sm font-medium capitalize ${
                pipeline === p
                  ? 'bg-gray-100 border-gray-100 text-gray-950'
                  : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
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
        <>
        {/* Phones: a vertical list grouped by stage, no horizontal kanban
            (mobile spec rule 7). Stage changes happen on the lead page. */}
        <div className="lg:hidden space-y-6">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id)
            if (stageDeals.length === 0) return null
            return (
              <div key={stage.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-semibold text-white text-sm">{stage.name}</h3>
                  <span className="font-mono text-xs text-gray-500">{stageDeals.length}</span>
                  <span className="font-mono text-xs text-gray-500 ml-auto">
                    ${stageValue(stage.id).toLocaleString()}
                  </span>
                </div>
                <div className="divide-y divide-gray-800 border-t border-b border-gray-800">
                  {stageDeals.map((deal: any) => (
                    <Link key={deal.id} href={`/contacts/${deal.contact_id}`} className="block py-3 min-h-11">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-white text-sm truncate">
                          {deal.contact?.business_name || 'Unknown'}
                        </span>
                        {deal.contact?.priority && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                      </div>
                      <div className="font-mono text-xs text-gray-400 mt-0.5">
                        ${Number(deal.value || 0).toLocaleString()}
                        {Number(deal.recurring_value || 0) > 0 &&
                          ` + $${Number(deal.recurring_value).toLocaleString()}/mo`}
                        {deal.won_date && ` · Won ${deal.won_date}`}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden lg:flex gap-3 overflow-x-auto pb-4">
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
                    <span className="font-mono text-xs text-gray-500">{stageDeals.length}</span>
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-500 mb-3">
                  ${stageValue(stage.id).toLocaleString()}
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedDeal(deal.id)}
                      onDragEnd={() => setDraggedDeal(null)}
                      className={`bg-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-700/60 transition-colors ${
                        draggedDeal === deal.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Link href={`/contacts/${deal.contact_id}`} className="block">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white text-sm truncate">
                            {deal.contact?.business_name || 'Unknown'}
                          </span>
                          {deal.contact?.priority && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                        </div>
                        <div className="font-mono text-xs text-gray-400 mt-1">
                          ${Number(deal.value || 0).toLocaleString()}
                          {Number(deal.recurring_value || 0) > 0 &&
                            ` + $${Number(deal.recurring_value).toLocaleString()}/mo`}
                        </div>
                        {deal.won_date && (
                          <div className="font-mono text-xs text-gray-500 mt-1">Won {deal.won_date}</div>
                        )}
                      </Link>
                      {deal.contact?.phone && (
                        <a
                          href={`tel:${deal.contact.phone}`}
                          className="font-mono text-xs text-gray-400 hover:text-white mt-1.5 inline-block min-h-6"
                        >
                          <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {deal.contact.phone}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </>
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
        className="px-4 py-2.5 min-h-11 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium"
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
        className="w-full px-3 py-2.5 min-h-11 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm mb-3"
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
          className="flex-1 py-2 min-h-11 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={!selected}
          className="flex-1 py-2 min-h-11 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
