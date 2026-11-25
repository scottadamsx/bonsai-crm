// Supabase caps a single response at 1000 rows; page through so full-table
// lists never silently truncate (the Leads page stopped at exactly 1000).
export async function fetchAll<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await makeQuery(from, from + 999)
    rows.push(...(data || []))
    if (!data || data.length < 1000) return rows
  }
}
