import { ref, reactive, watch } from 'vue'
import type { CrossrefWork, CrossrefFacets, ActiveFilters } from '@/types/crossref'
import type { CrossrefResponse } from '@/types/crossref'
import { FACET_CONFIG } from '@/config/facets'
import { buildUrl, ROWS_OPTIONS } from '@/utils'

const DEBOUNCE_MS = 550
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
   * Pass updateFacets=true only for keyword-driven searches so the
   * facet list stays stable while the user is toggling filters.
   */
  async function fetchResults(updateFacets: boolean = true) {
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
      if (updateFacets) facets.value = data.message.facets
      totalResults.value = data.message['total-results']
      hasSearched.value = true
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

    fetchResults(false)
  }

  function clearFilters() {
    resetFilters()
    fetchResults(false)
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
