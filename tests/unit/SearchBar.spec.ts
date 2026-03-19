import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

function factory(modelValue = '', isLoading = false) {
  return mount(SearchBar, { props: { modelValue, isLoading } })
}

describe('SearchBar', () => {
  it('disables the submit button when the query is empty', () => {
    const wrapper = factory('')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('disables the submit button when the query is only whitespace', () => {
    const wrapper = factory('   ')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('enables the submit button when the query has content', () => {
    const wrapper = factory('climate change')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('emits search on form submit with a valid query', async () => {
    const wrapper = factory('climate change')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('search')).toHaveLength(1)
  })

  it('does not emit search when the query is blank', async () => {
    // Guard inside handleSubmit — not just the disabled button attribute
    const wrapper = factory('   ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('search')).toBeUndefined()
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = factory('climate')
    await wrapper.find('input').setValue('climate change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['climate change']])
  })

  it('disables both input and button while loading', () => {
    const wrapper = factory('climate change', true)
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
