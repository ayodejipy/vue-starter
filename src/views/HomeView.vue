<script setup lang="ts">
import { computed } from 'vue'
import { useCrossrefSearch } from '@/composables/useCrossrefSearch'
import { FACET_CONFIG } from '@/config/facets'
import SearchBar from '@/components/SearchBar.vue'
import FacetPanel from '@/components/FacetPanel.vue'
import ResultsList from '@/components/ResultsList.vue'
import SearchStatus from '@/components/SearchStatus.vue'
import { ROWS_OPTIONS } from '@/utils'

const {
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
} = useCrossrefSearch()

const showResults = computed(() => hasSearched.value || isLoading.value)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="app-brand">
          <h1 class="app-title">Crossref Metadata Search</h1>
          <p class="app-tagline">Search 150M+ scholarly records</p>
        </div>
        <SearchBar v-model="query" :is-loading="isLoading" @search="search" />
      </div>
    </header>

    <!-- Welcome screen before first search -->
    <main v-if="!showResults" class="app-welcome" aria-label="Welcome">
      <div class="welcome-content">
        <p class="welcome-text">Search for scholarly works across Crossref's metadata.</p>
        <p class="welcome-hint">
          Try queries like <em>climate change</em>, <em>machine learning</em>, or <em>CRISPR</em>.
        </p>
      </div>
    </main>

    <!-- Results layout after first search -->
    <div v-else class="app-body">
      <div class="app-body-inner">
        <!-- Facet sidebar — only when facets are available -->
        <FacetPanel v-if="facets" :facets="facets" :active-filters="activeFilters" :facet-config="FACET_CONFIG"
          @toggle="(id, value) => toggleFilter(id, value)" @clear-filters="clearFilters" />

        <main class="app-main" aria-label="Search results">
          <SearchStatus :total-results="totalResults" :is-loading="isLoading" :error="error" :has-searched="hasSearched"
            :query="query" :active-filters="activeFilters" :shown-count="results.length" :facet-config="FACET_CONFIG"
            :rows="rows" :rows-options="ROWS_OPTIONS" @update:rows="rows = $event" />

          <ResultsList :results="results" :is-loading="isLoading" :error="error" :has-searched="hasSearched"
            :query="query" />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.app-header {
  background: var(--color-bg);
  border-bottom: 2px solid var(--color-accent);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.app-brand {
  flex-shrink: 0;
}

.app-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
}

.app-tagline {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.125rem;
}

/* ── Welcome ── */
.app-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
}

.welcome-content {
  text-align: center;
  max-width: 480px;
}

.welcome-text {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.welcome-hint {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.welcome-hint em {
  color: var(--color-accent);
  font-style: normal;
  font-weight: 500;
}

/* ── Body (post-search) ── */
.app-body {
  flex: 1;
  padding: 1.5rem 0;
}

.app-body-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.app-main {
  flex: 1;
  min-width: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .app-header-inner {
    flex-direction: column;
    align-items: stretch;
  }

  .app-body-inner {
    flex-direction: column;
  }
}
</style>