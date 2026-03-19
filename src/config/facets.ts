export interface FacetConfig {
  id: string
  label: string
  multiSelect?: boolean
  sortByYear?: boolean
  /**
   * Optional custom filter URL segment builder.
   * If omitted, the filter is serialized as `id:value`.
   * This is for facets that map to multiple API filter params (e.g. published → date range).
   */
  buildFilter?: (value: string) => string[]
}

export const FACET_CONFIG: FacetConfig[] = [
  {
    id: 'type-name',
    label: 'Record Type',
    multiSelect: true,
  },
  {
    id: 'published',
    label: 'Publication Year',
    multiSelect: true,
    sortByYear: true,
    // Pin to an exact year using both bounds
    buildFilter: (year) => [`from-pub-date:${year}`, `until-pub-date:${year}`],
  },
]
