'use client'


import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'

export default function ImportPage() {
  const [csv, setCsv] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState('')
  const supabase = createClient()

  const handleImport = async () => {
    if (!csv.trim()) {
      setResult('Paste some CSV data first.')
      return
    }

    setImporting(true)
    setResult('')

    try {
      const lines = csv.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

      const rows = lines.slice(1).map(line => {
        // Simple CSV parse (handles quoted fields)
        const values: string[] = []
        let current = ''
        let inQuote = false
        for (const char of line) {
          if (char === '"') inQuote = !inQuote
          else if (char === ',' && !inQuote) { values.push(current.trim()); current = '' }
          else current += char
        }
        values.push(current.trim())

        const row: Record<string, string> = {}
        headers.forEach((h, i) => { row[h] = (values[i] || '').replace(/^"|"$/g, '') })
        return row
      })

      const contacts = rows.map(row => ({
        business_name: row['business'] || row['business_name'] || row['name'] || null,
        first_name: row['first_name'] || null,
        last_name: row['last_name'] || null,
        email: row['email'] || null,
        phone: row['phone'] || null,
        address: row['address'] || null,
        category: row['category'] || null,
        contact_type: row['contact_type'] || row['type'] || 'prospect',
        website_status: row['website'] || row['website_status'] || null,
        priority: row['priority']?.toLowerCase().includes('yes') || row['priority'] === '\u2B50' || false,
        notes: row['notes'] || null,
      }))

      const { error } = await supabase.from('contacts').insert(contacts)
      if (error) throw error

      setResult(`Imported ${contacts.length} contacts successfully.`)
      setCsv('')
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    }

    setImporting(false)
  }

  return (
    <AppLayout>
      <Link href="/contacts" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
        ← Back to contacts
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Import Contacts</h1>
      <p className="text-gray-400 text-sm mb-6">
        Paste CSV data with headers. Supported columns: business, first_name, last_name, email, phone, address, category, contact_type, website, priority, notes
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Example format:</h3>
        <pre className="text-xs text-gray-500 bg-gray-950 rounded-lg p-3 overflow-x-auto">
{`business,phone,category,website,priority,notes
Leo's Restaurant,(709) 726-2658,Restaurant,Facebook only,YES,4.7 stars no site
Joe's Barber Shop,(709) 727-5290,Barbershop,None,YES,No online booking`}
        </pre>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder="Paste CSV here..."
        rows={10}
        className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
      />

      <button
        onClick={handleImport}
        disabled={importing}
        className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium"
      >
        {importing ? 'Importing...' : 'Import Contacts'}
      </button>

      {result && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-sm text-gray-300">
          {result}
        </div>
      )}
    </AppLayout>
  )
}
