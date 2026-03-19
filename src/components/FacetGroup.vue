<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  facetKey: string
  values: Record<string, number>
  activeValues: string[]
  sortByYear?: boolean
}>()

const emit = defineEmits<{
  toggle: [facetKey: string, value: string]
}>()

const sortedEntries = computed((): [string, number][] => {
  const entries = Object.entries(props.values)
  if (props.sortByYear) {
    return entries.sort(([a], [b]) => Number(b) - Number(a))
  }
  return entries.sort(([, a], [, b]) => b - a)
})
</script>

<template>
  <div class="facet-group" role="group" :aria-labelledby="`facet-heading-${facetKey}`">
    <h3 :id="`facet-heading-${facetKey}`" class="facet-title">{{ title }}</h3>
    <ul class="facet-list" role="list">
      <li v-for="[value, count] in sortedEntries" :key="value">
        <label class="facet-label" :class="{ 'is-active': activeValues.includes(value) }">
          <input
            type="checkbox"
            class="facet-checkbox"
            :checked="activeValues.includes(value)"
            @change="emit('toggle', facetKey, value)"
          />
          <span class="facet-value">{{ value }}</span>
          <span class="facet-count" :aria-label="`, ${count.toLocaleString()} results`">{{ count.toLocaleString() }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.facet-group {
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
      border-bottom: none;
      padding-bottom: 0;
  }
}


.facet-title {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.625rem;
}

.facet-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  max-height: 16rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.facet-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3125rem 0.5rem;
  border-radius: var(--radius);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s ease;
  
  &:hover {
    background: var(--color-bg-hover);
  }
  
  &:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: px;
  }
  
  &.is-active {
    color: var(--color-accent);
    font-weight: 600;
  }
}



.facet-label.is-active .facet-count {
  color: var(--color-accent);
}

.facet-checkbox {
  appearance: none;
  -webkit-appearance: none;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  transition: background 0.1s ease, border-color 0.1s ease;
}

.facet-checkbox:checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.facet-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 7px;
  border: 1.5px solid #fff;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

.facet-checkbox:focus-visible {
  outline: none;
}

.facet-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.facet-count {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
