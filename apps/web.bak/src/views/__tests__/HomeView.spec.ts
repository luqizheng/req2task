import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../HomeView.vue'

describe('HomeView', () => {
  it('renders properly', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.find('h1').text()).toBe('req2task')
    expect(wrapper.find('p').text()).toBe('Welcome to req2task')
  })
})