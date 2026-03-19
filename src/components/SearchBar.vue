<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

function handleSubmit() {
  if (props.modelValue.trim()) {
    emit('search')
  }
}
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="handleSubmit">
    <label for="search-input" class="search-label">Search Crossref</label>
    <div class="search-input-group">
      <input
        id="search-input"
        ref="inputRef"
        type="search"
        class="search-input"
        placeholder="Search for scholarly works..."
        :value="modelValue"
        :disabled="isLoading"
        aria-label="Search for scholarly works"
        autocomplete="off"
        spellcheck="false"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="handleSubmit"
      />
      <button
        type="submit"
        class="search-button"
        :disabled="!modelValue.trim() || isLoading"
        aria-label="Submit search"
      >
        <span>Search</span>
      </button>
    </div>
  </form>
</template>

<style scoped>
.search-bar {
  width: 100%;
}

.search-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-muted);
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  font-family: inherit;
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.15s ease;
  outline: none;
  min-width: 0;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Remove native search cancel button */
.search-input::-webkit-search-cancel-button {
  display: none;
}

.search-button {
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius);
  transition: opacity 0.15s ease;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  opacity: 0.85;
}

.search-button:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

.search-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
