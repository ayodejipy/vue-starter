<script setup lang="ts">
import type { CrossrefWork } from '@/types/crossref'
import ResultItem from './ResultItem.vue'

defineProps<{
  results: CrossrefWork[]
  isLoading: boolean
  error: string | null
  hasSearched: boolean
  query: string
}>()
</script>

<template>
  <section class="results-list" aria-label="Search results" :aria-busy="isLoading">
    <!-- Error state -->
    <div v-if="error && !isLoading" class="state-message state-error" role="alert">
      <strong>Something went wrong</strong>
      <p>{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="hasSearched && !isLoading && results.length === 0"
      class="state-message"
      role="status"
    >
      <strong>No results found</strong>
      <p v-if="query">No scholarly works matched "<em>{{ query }}</em>". Try a different search term.</p>
    </div>

    <!-- Results -->
    <ol v-else-if="results.length > 0" class="results-ol" role="list">
      <li v-for="item in results" :key="item.DOI">
        <ResultItem :item="item" />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.results-list {
  flex: 1;
  min-width: 0;
}

.results-ol {
  list-style: none;
}

.state-message {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
}

.state-message strong {
  display: block;
  font-size: 1rem;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.state-message p {
  font-size: 0.875rem;
  line-height: 1.6;
}

.state-message em {
  color: var(--color-text);
  font-style: italic;
}

.state-error strong {
  color: var(--color-error);
}
</style>
