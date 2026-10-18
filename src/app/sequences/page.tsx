'use client'


import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedSeq, setSelectedSeq] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: seqs } = await supabase.from('sequences').select('*').order('name')
    setSequences(seqs || [])
    const { data: tmpls } = await supabase.from('email_templates').select('*').order('name')
    setTemplates(tmpls || [])
  }

  const fetchSteps = async (seqId: string) => {
    const { data: seq } = await supabase.from('sequences').select('*').eq('id', seqId).single()
    setSelectedSeq(seq)
    const { data: st } = await supabase
      .from('sequence_steps')
      .select('*, template:email_templates(name, subject)')
      .eq('sequence_id', seqId)
      .order('step_number')
    setSteps(st || [])
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-white mb-2">Email Sequences</h1>
      <p className="text-gray-400 text-sm mb-6">
        Automated follow-up sequences. Enroll a contact to send Day 0, Day 4, Day 11 emails.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Sequence list */}
        <div className="space-y-2">
          {sequences.map((seq) => (
            <div
              key={seq.id}
              onClick={() => fetchSteps(seq.id)}
              className={`bg-gray-900 border rounded-xl p-4 cursor-pointer ${
                selectedSeq?.id === seq.id ? 'border-green-500' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="font-medium text-white">✉️ {seq.name}</div>
              {seq.description && <div className="text-xs text-gray-400 mt-1">{seq.description}</div>}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="md:col-span-2">
          {!selectedSeq ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500">Select a sequence to view its steps.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h2 className="font-semibold text-white mb-4">{selectedSeq.name}</h2>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-gray-800/50 rounded-lg p-3">
                      <div className="text-sm font-medium text-white">
                        Day {step.delay_days === 0 ? '0' : `+${step.delay_days}`}: {step.template?.name || 'No template'}
                      </div>
                      {step.template?.subject && (
                        <div className="text-xs text-gray-400 mt-0.5">Subject: {step.template.subject}</div>
                      )}
                    </div>
                  </div>
                ))}
                {steps.length === 0 && (
                  <p className="text-gray-500 text-sm">No steps configured yet.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-2">📧 Email Templates</h3>
                <div className="space-y-2">
                  {templates.map((t) => (
                    <details key={t.id} className="bg-gray-800/50 rounded-lg">
                      <summary className="px-3 py-2 text-sm text-white cursor-pointer font-medium">
                        {t.name}
                      </summary>
                      <div className="px-3 pb-3">
                        <div className="text-xs text-gray-400 mb-1">Subject: {t.subject}</div>
                        <div className="text-xs text-gray-500 whitespace-pre-wrap">{t.body}</div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
