<script setup lang="ts">
import type { CrossrefFacets, ActiveFilters } from '@/types/crossref'
import type { FacetConfig } from '@/config/facets'
import FacetGroup from './FacetGroup.vue'

const props = defineProps<{
  facets: CrossrefFacets
  activeFilters: ActiveFilters
  facetConfig: FacetConfig[]
}>()

const emit = defineEmits<{
  toggle: [facetId: string, value: string]
  clearFilters: []
}>()

const hasActiveFilters = () => Object.values(props.activeFilters).some((values) => values.length > 0)
</script>

<template>
  <aside class="facet-panel" aria-label="Filter results">
    <div class="facet-panel-header">
      <h2 class="facet-panel-title">Filters</h2>
      <button v-if="hasActiveFilters()" type="button" class="clear-filters-button" aria-label="Clear all filters" @click="emit('clearFilters')">
        Clear all
      </button>
    </div>

    <div class="facet-groups">
      <FacetGroup
        v-for="config in facetConfig"
        :key="config.id"
        :title="config.label"
        :facet-key="config.id"
        :values="facets[config.id]?.values ?? {}"
        :active-values="activeFilters[config.id] ?? []"
        :sort-by-year="config.sortByYear"
        @toggle="(id, value) => emit('toggle', id, value)"
      />
    </div>
  </aside>
</template>

<style scoped>
.facet-panel {
  width: 250px;
  flex-shrink: 0;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1rem;
  align-self: start;
  position: sticky;
  top: 1rem;
}

.facet-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.facet-panel-title {
  font-size: 1rem;
  font-weight: 700;
}

.clear-filters-button {
  font-size: 0.8125rem;
  color: var(--color-error);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0.25rem 0.125rem;
}

.clear-filters-button:hover {
  opacity: 0.75;
}

.clear-filters-button:focus-visible {
  outline: 2px solid var(--color-error);
  outline-offset: 2px;
  border-radius: 2px;
}

.facet-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 640px) {
  .facet-panel {
    width: 100%;
    position: static;
  }
}
</style>
