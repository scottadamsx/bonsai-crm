export interface Contact {
  id: string
  first_name: string | null
  last_name: string | null
  business_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: string | null
  contact_type: 'prospect' | 'club' | 'client'
  lead_status: string | null
  website_status: string | null
  priority: boolean
  notes: string | null
  tags: string[]
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  name: string
  position: number
  color: string
  pipeline: string
}

export interface Deal {
  id: string
  contact_id: string
  stage_id: string | null
  pipeline: string
  value: number
  recurring_value: number
  won_date: string | null
  position: number
  contact?: Contact
  stage?: PipelineStage
}

export interface Activity {
  id: string
  contact_id: string
  type: 'call' | 'email' | 'sms' | 'meeting' | 'note'
  subject: string | null
  body: string | null
  outcome: string | null
  direction: 'inbound' | 'outbound' | null
  duration_seconds: number | null
  created_at: string
}

export interface Reminder {
  id: string
  contact_id: string
  title: string
  due_date: string
  snoozed_until: string | null
  completed: boolean
  completed_at: string | null
  contact?: Contact
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export interface Sequence {
  id: string
  name: string
  description: string | null
  active: boolean
}

export interface SmartView {
  id: string
  name: string
  filters: {
    stage_ids?: string[]
    categories?: string[]
    tags?: string[]
    contact_type?: string
    priority_only?: boolean
    pipeline?: string
    lead_statuses?: string[]
    no_activity_days?: number
    no_followup?: boolean
    pinned?: boolean
    custom_field?: { name: string; value: string }
  }
}

export interface CustomFieldDef {
  id: string
  name: string
  field_type: 'text' | 'number' | 'date' | 'select'
  options: string[] | null
}
