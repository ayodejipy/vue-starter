<script setup lang="ts">
import { computed } from 'vue'
import type { CrossrefWork } from '@/types/crossref'

const props = defineProps<{
  item: CrossrefWork
}>()

const title = computed(() => props.item.title?.[0] ?? 'Untitled')
// Prefer the publisher landing page; the API's URL field is always the DOI URL
const resourceUrl = computed(() => props.item.resource?.primary?.URL ?? props.item.URL)
const journal = computed(() => props.item['container-title']?.[0] ?? null)

const publishedYear = computed(() => {
  const dateParts =
    props.item['published-print']?.['date-parts'] ??
    props.item['published-online']?.['date-parts'] ??
    props.item.published?.['date-parts'] ??
    props.item.issued?.['date-parts']
  return dateParts?.[0]?.[0] ?? null
})

const MAX_AUTHORS = 3

const authorList = computed(() => {
  const authors = props.item.author
  if (!authors || authors.length === 0) return { visible: [], extra: 0 }

  const visible = authors.slice(0, MAX_AUTHORS).map((a) => {
    if (a.name) return a.name
    const parts = [a.given, a.family].filter(Boolean)
    return parts.join(' ')
  })

  return { visible, extra: Math.max(0, authors.length - MAX_AUTHORS) }
})

// Format the type slug for display (e.g. "journal-article" → "Journal Article")
const displayType = computed(() =>
  props.item.type
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
)
</script>

<template>
  <article class="result-item">
    <h3 class="result-title">
      <a :href="resourceUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${title} (opens in new tab)`">{{ title }}</a>
    </h3>

    <div class="result-meta">
      <span v-if="authorList.visible.length" class="result-authors">
        {{ authorList.visible.join(', ') }}
        <span v-if="authorList.extra > 0" class="result-authors-more">
          +{{ authorList.extra }} more
        </span>
      </span>
    </div>

    <div class="result-details">
      <span class="result-badge">{{ displayType }}</span>
      <span v-if="journal" class="result-journal" :title="journal">{{ journal }}</span>
      <span v-if="publishedYear" class="result-year">{{ publishedYear }}</span>
      <span v-if="item.publisher" class="result-publisher">{{ item.publisher }}</span>
    </div>

    <div class="result-doi">
      <a :href="item.URL" target="_blank" rel="noopener noreferrer" class="result-doi-link" :aria-label="`Access resource at doi.org/${item.DOI} (opens in new tab)`">
        doi.org/{{ item.DOI }}
      </a>
    </div>
  </article>
</template>

<style scoped>
.result-item {
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.result-item:last-child {
  border-bottom: none;
}

.result-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}

.result-title a {
  color: var(--color-text);
}

.result-title a:hover {
  color: var(--color-accent);
}

.result-authors {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.result-authors-more {
  font-style: italic;
}

.result-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.result-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
  text-transform: capitalize;
}

.result-journal {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-style: italic;
}

.result-year,
.result-publisher {
  white-space: nowrap;
  font-weight: 500;
}

.result-doi {
  font-size: 0.75rem;
}

.result-doi-link {
  color: var(--color-text-muted);
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.result-doi-link:hover {
  color: var(--color-accent);
}
</style>
