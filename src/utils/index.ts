import { FACET_CONFIG } from "@/config/facets"
import type { ActiveFilters } from "@/types/crossref"

const API_BASE = import.meta.env.VITE_API_BASE
const MAILTO = import.meta.env.VITE_MAILTO

export const ROWS_OPTIONS = [20, 25, 30, 40, 50, 60, 80, 90, 100, 150]

export function buildUrl(query: string, filters: ActiveFilters, rows: number ): string {
  const params = new URLSearchParams({
    'query.bibliographic': query,
    // Build the facet param from config so adding a new facet only requires editing FACET_CONFIG
    facet: FACET_CONFIG.map((facet) => `${facet.id}:*`).join(','),
    rows: String(rows),
    mailto: MAILTO,
  })

  const filterParts: string[] = []

  for (const facet of FACET_CONFIG) {
    const values = filters[facet.id]
    if (!values || values.length === 0) continue
    for (const value of values) {
      // Use the facet's own buildFilter if defined, otherwise default to `id:value`
      const segments = facet.buildFilter ? facet.buildFilter(value) : [`${facet.id}:${value}`]
      filterParts.push(...segments)
    }
  }

  if (filterParts.length > 0) {
    params.set('filter', filterParts.join(','))
  }

  return `${API_BASE}?${params.toString()}`
}
