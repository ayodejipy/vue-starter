import { ref, reactive, watch } from 'vue'
import type { CrossrefWork, CrossrefFacets, ActiveFilters } from '@/types/crossref'
import type { CrossrefResponse } from '@/types/crossref'
import { FACET_CONFIG } from '@/config/facets'
import { buildUrl, ROWS_OPTIONS } from '@/utils'

const DEBOUNCE_MS = 740
const MIN_QUERY_LENGTH = 2

export function useCrossrefSearch() {
  const query = ref('')
  const results = ref<CrossrefWork[]>([])
  const facets = ref<CrossrefFacets | null>(null)
  const totalResults = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const hasSearched = ref(false)
  const rows = ref(ROWS_OPTIONS[0])

  // Initialised from FACET_CONFIG so no manual key management is needed
  const activeFilters = reactive<ActiveFilters>(
    Object.fromEntries(FACET_CONFIG.map((facet) => [facet.id, []])),
  )

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let currentAbort: AbortController | null = null

  /**
   * Fetch results and optionally update facets.
   *
   * @param updateFacets - set false to skip updating the facet panel (e.g. rows change)
   * @param excludeFacetGroup - when set, activates disjunctive (snapshot-preserving) mode.
   *   Only groups with NO active filters are updated from the response. Groups that already
   *   have active selections keep their snapshot — prevents their option list from collapsing
   *   to only the values that intersect with other active filters.
   */
  async function fetchResults(updateFacets: boolean = true, excludeFacetGroup?: string) {
    const q = query.value.trim()
    if (!q) return

    // Abort any in-flight request so stale results can't overwrite fresh ones
    currentAbort?.abort()
    currentAbort = new AbortController()
    const { signal } = currentAbort

    isLoading.value = true
    error.value = null

    try {
      const url = buildUrl(q, activeFilters, rows.value)
      const response = await fetch(url, { signal })

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }

      const data: CrossrefResponse = await response.json()

      results.value = data.message.items
      totalResults.value = data.message['total-results']
      hasSearched.value = true

      if (updateFacets) {
        if (excludeFacetGroup && facets.value) {
          // Disjunctive update: each group is handled based on its current filter state.
          FACET_CONFIG.forEach((facet) => {
            const responseGroup = data.message.facets[facet.id]
            if (activeFilters[facet.id].length === 0) {
              facets.value![facet.id] = responseGroup
            } else {
              // Has active filters: preserve the full option list from the snapshot,
              // but sync each option's count from the response.
              // Options present in the response (the selected ones) get their current count;
              // options absent from the response get 0 — they exist but match nothing
              // in the current filter context.
              const snapshot = facets.value![facet.id]
              if (snapshot && responseGroup) {
                const updatedValues: Record<string, number> = {}
                Object.keys(snapshot.values).forEach((key) => {
                  if (activeFilters[facet.id].includes(key)) {
                    // Selected option: show its count within the current filter context.
                    updatedValues[key] = responseGroup.values[key] ?? 0
                  } else {
                    // Unselected option: keep the snapshot count so the option
                    // remains visually available for multi-select.
                    updatedValues[key] = snapshot.values[key]
                  }
                })
                facets.value![facet.id] = { ...snapshot, values: updatedValues }
              }
            }
          })
        } else {
          facets.value = data.message.facets
        }
      }
    } catch (err) {
      // AbortError means a newer request superseded this one — not a real error
      if (err instanceof Error && err.name === 'AbortError') return
      error.value =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      results.value = []
      if (updateFacets) facets.value = null
      totalResults.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // Mutate in place — splice guarantees that all child components re-render with the cleared state.
  function resetFilters() {
    FACET_CONFIG.forEach((facet) => activeFilters[facet.id].splice(0))
  }

  // Keyword search (explicit submit)
  async function search() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    resetFilters()
    await fetchResults(true)
  }

  // Re-fetch when rows changes
  watch(rows, () => { if (hasSearched.value) fetchResults(false) })

  // Auto-search while typing: debounced, min length guard — clears filters and refreshes facets
  watch(query, (newVal) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (newVal.trim().length < MIN_QUERY_LENGTH) return
    debounceTimer = setTimeout(() => { resetFilters(); fetchResults() }, DEBOUNCE_MS)
  })

  /**
   * Toggle a facet filter on/off and re-run search.
   * Multi-select facets append/remove from the array; single-select replace.
   * Facets are preserved — only results update.
   */
  function toggleFilter(facetId: string, value: string) {
    const config = FACET_CONFIG.find((facet) => facet.id === facetId)
    const current = activeFilters[facetId]
    const idx = current.indexOf(value)

    if (config?.multiSelect) {
      if (idx >= 0) current.splice(idx, 1)
      else current.push(value)
    } else {
      if (idx >= 0) current.splice(idx, 1)
      else current.push(value)
    }

    fetchResults(true, facetId)
  }

  function clearFilters() {
    resetFilters()
    fetchResults(true)
  }

  return {
    query,
    results,
    facets,
    totalResults,
    isLoading,
    error,
    hasSearched,
    activeFilters,
    rows,
    search,
    toggleFilter,
    clearFilters,
  }
}
