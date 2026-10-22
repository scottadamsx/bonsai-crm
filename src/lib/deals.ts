import type { SupabaseClient } from '@supabase/supabase-js'

// Stages that mean "won" for a solo operator: the dashboard already counts
// deals in Client or Care Plan as clients won. Moving a deal into one stamps
// deals.won_date; moving it out clears it (Close stamps date_won the same
// way, docs/close-feature-map.md section 2).
export const WON_STAGE_NAMES = ['Client', 'Care Plan']

export function wonDateForMove(stageName: string, currentWonDate: string | null): string | null {
  if (!WON_STAGE_NAMES.includes(stageName)) return null
  return currentWonDate || new Date().toISOString().split('T')[0]
}

export async function moveDealToStage(
  supabase: SupabaseClient,
  dealId: string,
  stageId: string,
  stageName: string,
  currentWonDate: string | null
) {
  await supabase
    .from('deals')
    .update({ stage_id: stageId, updated_at: new Date().toISOString() })
    .eq('id', dealId)
  // won_date lands with migration 002; best-effort so stage moves keep
  // working until it is applied.
  await supabase
    .from('deals')
    .update({ won_date: wonDateForMove(stageName, currentWonDate) })
    .eq('id', dealId)
}
