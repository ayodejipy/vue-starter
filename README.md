# Vue Starter

Vue 3 + TypeScript + Vite starter.

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Lint and fix |

## Tech stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- Vue Router
- Vitest (unit)
- Playwright (E2E)

## Design decisions

### Stable facet list during filtering

The filter sidebar always shows the full facet list from the most recent keyword search. When a user toggles a filter, the facet options do not change — only the results update. The selected filter is highlighted visually, and deselecting it restores the unfiltered results.

**Why:** Replacing the facet list on every filter request creates a disorienting UX. If the API only returns facets relevant to the filtered subset, previously available options disappear, making it impossible to switch to a different filter value without clearing first. Keeping the facet list anchored to the keyword search lets users freely explore and compare filter options.

**How it works:** `useCrossrefSearch` distinguishes between keyword-driven fetches (which update the facet list) and filter/pagination fetches (which preserve it). The `fetchResults(updateFacets: boolean)` function controls this — `search()` and the debounced query watcher pass `true`; `toggleFilter`, `clearFilters`, and the rows watcher pass `false`.

### Filters are cleared on a new keyword search

When the user submits a new query (or the debounced auto-search fires), all active filters are reset before the fetch runs. This ensures the facet list reflects the full distribution for the new keyword — otherwise, if a filter were preserved, the API would return facets only for the filtered subset, making other options disappear and preventing the user from selecting them. The user can re-apply filters after the new results load.

### `toggleFilter` retains the `multiSelect` branch even when both paths are identical

`FACET_CONFIG` drives whether a facet is multi-select or single-select. All facets are multi-select, so both branches of the `if (config?.multiSelect)` check in `toggleFilter` do the same thing. The branch is kept explicitly so that a future facet set to `multiSelect: false` can be given distinct single-select behaviour (e.g. replacing the current selection rather than appending) without touching the toggle logic elsewhere.

---

### Handling API response time

The Crossref API can take 1–5 seconds per request, depending on query complexity and server load. The current approach:

- `isLoading` flips to `true` synchronously before the fetch begins — the spinner appears with no perceptible delay.
- `AbortController` cancels any in-flight request before starting a new one, so stale responses can never overwrite fresh results.
- The search input and submit button are disabled while loading, preventing concurrent requests.
- Previous results remain visible until the new response arrives, avoiding a jarring blank state mid-request.
- A 500 ms debounce on the query watcher limits requests while typing without delaying the explicit Submit path.
- The polite `mailto` parameter is included on every request as required by Crossref's etiquette guidelines.

There is currently **no caching** — every unique query + filter combination makes a fresh network round-trip.

---

## Out-of-scope ideas (given more time)

- **URL-based state** — sync `query`, `activeFilters`, and `rows` to `URLSearchParams` so searches are shareable and browser back/forward work correctly. Vue Router's `useRoute` / `useRouter` with `watchEffect` is the natural fit.
- **In-memory response cache** — a `Map<url, Promise<CrossrefMessage>>` keyed by the full request URL would serve repeated query + filter combinations instantly within a session and also deduplicate concurrent requests for the same URL.
- **Cursor-based pagination** — the Crossref API supports `cursor=*` for deep pagination. A "Load more" button with cursor state would let users browse beyond the first page without the jarring re-request a page-size change currently causes.
- **Sort options** — expose the API's `sort` + `order` parameters (relevance, published asc/desc, updated) as a dropdown in the status bar.
- **More facets** — publisher, funder, license type, and open-access status are all available from the API and would meaningfully extend the filter surface.
- **Cap publication year to current year** — the Publication Year facet can surface future-dated records (pre-prints assigned a prospective year). Capping the displayed range to `<= new Date().getFullYear()` or as a display-layer filter in `FacetGroup` would prevent confusing results.
- **Abstract / snippet preview** — some Crossref records include `abstract`; showing a truncated preview on each result card would significantly improve result utility without a separate detail page.
- **Keyboard shortcut** — a `/` shortcut to focus the search bar (standard in search-heavy UIs) would let keyboard users jump to search from anywhere on the page.
- **Unit tests** — `useCrossrefSearch` has no DOM dependency, making it straightforward to test with Vitest and `vi.mock` for `fetch`.
- **Component tests** — Vue Test Utils + `@testing-library/vue` for each component's rendering and interaction in isolation.
- **Feature/domain-based folder structure** — group each feature's components, composables, types, config, and utilities under a single `features/<domain>/` directory. Truly shared code (used by more than one feature) is promoted to a top-level `shared/` directory. This keeps related code co-located, eliminates cross-feature file collisions, and lets developers own a feature end-to-end in parallel without merge conflicts.
