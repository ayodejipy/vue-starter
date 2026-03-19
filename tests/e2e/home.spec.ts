import { test, expect } from '@playwright/test'

// Allow time for real Crossref API responses
const API_TIMEOUT = 45_000

test.describe('Home page', () => {
  test('shows welcome screen on load', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Crossref Metadata Search' })).toBeVisible()
    await expect(page.getByRole('main', { name: 'Welcome' })).toBeVisible()
    // Filter panel is not shown before first search
    await expect(page.getByRole('complementary', { name: 'Filter results' })).not.toBeVisible()
  })

  test.describe('after searching for "climate change"', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByLabel('Search for scholarly works').fill('climate change')
      await page.getByRole('button', { name: 'Submit search' }).click()
      // Wait for results AND for at least one facet checkbox to be rendered.
      // The results list and facets come from the same response, but Vue may not
      // have flushed the facet DOM update by the time <ol> becomes visible.
      await expect(
        page.getByRole('region', { name: 'Search results' }).getByRole('list'),
      ).toBeVisible({ timeout: API_TIMEOUT })
      await expect(
        page.getByRole('group', { name: 'Record Type' }).getByRole('checkbox').first(),
      ).toBeVisible({ timeout: API_TIMEOUT })
    })

    test('shows results, status count, and filter panel', async ({ page }) => {
      await expect(page.getByRole('status')).toContainText('results')
      await expect(page.getByRole('complementary', { name: 'Filter results' })).toBeVisible()
      await expect(page.getByRole('group', { name: 'Record Type' })).toBeVisible()
      await expect(page.getByRole('group', { name: 'Publication Year' })).toBeVisible()
    })

    test('can apply a Record Type filter', async ({ page }) => {
      const recordTypeGroup = page.getByRole('group', { name: 'Record Type' })
      const firstCheckbox = recordTypeGroup.getByRole('checkbox').first()

      await firstCheckbox.check()

      // Filter tag appears in the status bar
      await expect(
        page.getByRole('status').locator('span', { hasText: /Record Type:/ }),
      ).toBeVisible({ timeout: API_TIMEOUT })
      // Checkbox stays checked after the filtered search completes
      await expect(firstCheckbox).toBeChecked()
    })

    test('facet list stays stable when a filter is applied', async ({ page }) => {
      const recordTypeGroup = page.getByRole('group', { name: 'Record Type' })
      const checkboxes = recordTypeGroup.getByRole('checkbox')

      const countBefore = await checkboxes.count()
      expect(countBefore).toBeGreaterThan(0)

      await checkboxes.first().check()

      // Wait for the filter to take effect
      await expect(
        page.getByRole('status').locator('span', { hasText: /Record Type:/ }),
      ).toHaveCount(1, { timeout: API_TIMEOUT })

      // Facet options must be unchanged after filtering
      await expect(checkboxes).toHaveCount(countBefore)
    })

    test('can select multiple filters within the same group', async ({ page }) => {
      const recordTypeGroup = page.getByRole('group', { name: 'Record Type' })
      const checkboxes = recordTypeGroup.getByRole('checkbox')
      const filterTags = page.getByRole('status').locator('span', { hasText: /Record Type:/ })

      await checkboxes.nth(0).check()
      await expect(filterTags).toHaveCount(1, { timeout: API_TIMEOUT })

      await checkboxes.nth(1).check()
      await expect(filterTags).toHaveCount(2, { timeout: API_TIMEOUT })

      await expect(checkboxes.nth(0)).toBeChecked()
      await expect(checkboxes.nth(1)).toBeChecked()
    })

    test('"Clear all" removes all active filters', async ({ page }) => {
      const recordTypeGroup = page.getByRole('group', { name: 'Record Type' })
      const firstCheckbox = recordTypeGroup.getByRole('checkbox').first()
      const filterTags = page.getByRole('status').locator('span', { hasText: /Record Type:/ })

      await firstCheckbox.check()
      await expect(filterTags).toHaveCount(1, { timeout: API_TIMEOUT })

      await page.getByRole('button', { name: 'Clear all filters' }).click()

      await expect(filterTags).toHaveCount(0, { timeout: API_TIMEOUT })
      await expect(firstCheckbox).not.toBeChecked()
    })
  })
})
