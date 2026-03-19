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

## Key decisions, in plain language

Here are the main decisions made during the build — what the problem was, what we tried, and why it landed where it did. No code knowledge needed to follow this.

---

### The filter panel (the hardest part)

**The setup.** Search for "climate change". The sidebar shows two filter panels:

```
Record Type          Publication Year
──────────────       ────────────────
Journal Article      2023
Book                 2022
Conference Paper     2021
Report               2020
```

Now tick "Journal Article". The right behaviour is:
- **Publication Year should narrow** — show only the years that have journal articles about climate change.
- **Record Type should stay complete** — Book, Conference Paper, and Report must still be visible, so you can tick a second type if you want. That's the whole point of multi-select.

The challenge: when the API responds to your "Journal Article" filter, it only sends back the Record Type options that exist within journal-article results. Conference Paper is not in that response — you've filtered it out. If the app blindly replaces the Record Type panel with what came back, Conference Paper disappears and multi-select is broken.

Getting Publication Year to update *and* keeping Record Type intact *at the same time* is what took the most work.

**Attempt 1 — freeze the sidebar after the first search.** Lock the options in after the very first response and never touch them again. Broke down when you typed a new keyword while a filter was active — the sidebar kept showing options from the *old* search. Completely misleading.

**Attempt 2 — always refresh everything on every toggle.** Replace the whole sidebar with whatever the API returned. Accurate counts, but Conference Paper vanished the moment you ticked Journal Article. Multi-select was effectively broken.

**What we have now — each panel decides for itself.** One API call per toggle, then each panel is handled based on whether it has any active selections:

- **Panel with nothing ticked** → replaced entirely from the fresh response. This is how Publication Year correctly narrows.
- **Panel with something already ticked** → the option list stays intact. Counts update selectively:
  - Options you've ticked → fresh count from the API, showing how many results match your current combined filters.
  - Options you *haven't* ticked → keep their count from before you started filtering. This was the final fix. An earlier version showed 0 for unticked options — which made Conference Paper *look* unavailable, so users never tried clicking it even though it would have expanded the results. Keeping the previous non-zero count signals "this is still an option."
- **Untick your last selection in a panel** → that panel is empty again and gets a full refresh on the next toggle.

---

### Why filters clear when you start a new search

If you search "climate change", tick "Journal Article", then type a new search for "machine learning" — should the Journal Article filter carry over?

The first instinct was yes (mirrors Google Scholar). The problem: when the API is called for "machine learning" with a Journal Article filter already active, it returns facets *only* for machine learning journal articles. So from the very first response, Book, Conference Paper, and Report are invisible for the new topic. The user is stuck inside a filter they didn't consciously re-apply to the new query.

Decision: clear all filters before every new keyword search. The user can re-apply them once the new results load.

---

### How slow API responses are handled

The Crossref API regularly takes 1–5 seconds to respond. A few things were put in place to keep the experience from feeling broken during that wait:

- The loading spinner appears the instant a request starts — no delay.
- The previous results stay visible while the new ones are loading, so the screen never goes blank mid-search.
- If you type fast and trigger several requests in a row, each new request cancels the previous one — so only the latest response ever updates the page. Older responses can't land late and overwrite fresher results.
- A short pause is added while you type (debounce) to avoid firing a new request after every single keystroke.

---

## Design decisions

### Disjunctive (independent) facets

When the user toggles a filter in group A, the API is re-fetched with all active filters. Each facet group is then updated based on its own filter state:

- Groups with **no active selections** receive a full update from the response.
- Groups **with active selections** keep their option list intact; selected options get counts from the response (accurate for the current context), unselected options keep their snapshot counts (non-zero, so they remain clickable for multi-select).

This means:

- Selecting "Journal Article" under Record Type does **not** collapse the Record Type list — the user can still pick "Conference Paper" on the next click (multi-select within a group works correctly).
- Cross-group facets **do** update: selecting "Journal Article" refreshes the Publication Year facet to show only the years that contain journal articles.
- Only **one** API call is made per filter toggle — no extra requests needed.

**How it works:** `fetchResults` accepts an optional `excludeFacetGroup` parameter. When provided (by `toggleFilter`), it activates disjunctive mode: each group is evaluated individually — groups with no active filters are fully replaced from the response; groups with active filters have their option list preserved and counts selectively synced. Keyword searches and `clearFilters` call `fetchResults` without this parameter, resetting all facets from the fresh response.

### Filters are cleared on a new keyword search

When the user submits a new query (or the debounced auto-search fires), all active filters are reset before the fetch runs. This ensures the facet list reflects the full distribution for the new keyword — otherwise, if a filter were preserved, the API would return facets only for the filtered subset, making other options disappear and preventing the user from selecting them. The user can re-apply filters after the new results load.

### `toggleFilter` retains the `multiSelect` branch even when both paths are identical

`FACET_CONFIG` drives whether a facet is multi-select or single-select. All facets are multi-select, so both branches of the `if (config?.multiSelect)` check in `toggleFilter` do the same thing. The branch is kept explicitly so that a future facet set to `multiSelect: false` can be given distinct single-select behaviour (e.g. replacing the current selection rather than appending) without touching the toggle logic elsewhere.


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
