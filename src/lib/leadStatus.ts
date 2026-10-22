// Lead status: where the relationship stands, independent of any deal's
// pipeline stage (docs/close-feature-map.md section 2). Fixed label set from
// the gap table; stored on contacts.lead_status (migration 002).
export const LEAD_STATUSES = [
  { value: 'Spotted', color: '#9CA3AF' },
  { value: 'Contacted', color: '#3B82F6' },
  { value: 'Working', color: '#8B5CF6' },
  { value: 'Client', color: '#10B981' },
  { value: 'Dead', color: '#EF4444' },
] as const

export const DEFAULT_LEAD_STATUS = 'Spotted'

export function leadStatusOf(contact: { lead_status?: string | null }): string {
  return contact.lead_status || DEFAULT_LEAD_STATUS
}

export function leadStatusColor(value: string): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.color || '#9CA3AF'
}
