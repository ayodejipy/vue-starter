export interface CrossrefResponse {
  status: string
  'message-type': string
  'message-version': string
  message: CrossrefMessage
}

export interface CrossrefMessage {
  facets: CrossrefFacets
  'total-results': number
  items: CrossrefWork[]
  'items-per-page': number
  query: {
    'start-index': number
    'search-terms': string
  }
}

// Keyed by facet id — matches whatever is requested in the FACET_CONFIG
export type CrossrefFacets = Record<string, CrossrefFacet>

export interface CrossrefFacet {
  values: Record<string, number>
  'value-count': number
}

export interface CrossrefWork {
  DOI: string
  /** Canonical DOI URL, e.g. "https://doi.org/10.1016/..." */
  URL: string
  title: string[]
  author?: CrossrefAuthor[]
  type: string
  publisher?: string
  'container-title'?: string[]
  'published-print'?: CrossrefDateParts
  'published-online'?: CrossrefDateParts
  published?: CrossrefDateParts
  issued?: CrossrefDateParts
  page?: string
  language?: string
  ISBN?: string[]
  'is-referenced-by-count'?: number
  'references-count'?: number
  /** Publisher landing page URL */
  resource?: {
    primary: {
      URL: string
    }
  }
  score: number
}

export interface CrossrefAuthor {
  given?: string
  family?: string
  name?: string // for organizational authors
}

export interface CrossrefDateParts {
  'date-parts': number[][]
}

// Keyed by facet id — built dynamically from FACET_CONFIG at runtime
export type ActiveFilters = Record<string, string[]>
