<script setup lang="ts">
import type { ActiveFilters } from '@/types/crossref'
import type { FacetConfig } from '@/config/facets'

defineProps<{
  totalResults: number
  isLoading: boolean
  error: string | null
  hasSearched: boolean
  query: string
  activeFilters: ActiveFilters
  shownCount: number
  facetConfig: FacetConfig[]
  rows: number
  rowsOptions: number[]
}>()

defineEmits<{
  'update:rows': [value: number]
}>()
</script>

<template>
  <div
    class="search-status"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :aria-busy="isLoading"
  >
    <template v-if="isLoading">
      <span class="spinner" aria-hidden="true"></span>
      <span>Searching…</span>
    </template>

    <template v-else-if="error">
      <span class="status-error">Error: {{ error }}</span>
    </template>

    <template v-else-if="hasSearched">
      <span class="status-count">
        Showing {{ shownCount }} of
        <strong>{{ totalResults.toLocaleString() }}</strong>
        results
        <template v-if="query"> for "<em>{{ query }}</em>"</template>
      </span>

      <template v-for="config in facetConfig" :key="config.id">
        <span
          v-for="value in activeFilters[config.id]"
          :key="`${config.id}-${value}`"
          class="filter-tag"
        >
          {{ config.label }}: {{ value }}
        </span>
      </template>

      <div class="rows-selector">
        <label for="rows-select" class="rows-label">Per page</label>
        <select
          id="rows-select"
          class="rows-select"
          :value="rows"
          @change="$emit('update:rows', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="n in rowsOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.status-count strong {
  color: var(--color-text);
}

.status-count em {
  color: var(--color-text);
  font-style: italic;
}

.status-error {
  color: var(--color-error);
  font-weight: 500;
}

.filter-tag {
  padding: 0.125rem 0.5rem;
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rows-selector {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.rows-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.rows-select {
  padding: 0.1875rem 1.5rem 0.1875rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8125rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.375rem center;
  cursor: pointer;
}

.rows-select:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

/* CSS spinner */
.spinner {
  display: inline-block;
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
