import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStorageSettingsStore } from '../store/storageSettings'

const originalLocation = window.location

function setHostname(hostname) {
  Object.defineProperty(window, 'location', {
    value: { hostname },
    writable: true,
    configurable: true
  })
}

describe('storageSettings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    })
  })

  it('defaults to local mode', () => {
    setHostname('localhost')
    const store = useStorageSettingsStore()
    expect(store.effectiveMode).toBe('local')
  })

  it('effectiveMode reflects the chosen mode when not free-hosted', () => {
    setHostname('localhost')
    const store = useStorageSettingsStore()
    store.setMode('file')
    expect(store.mode).toBe('file')
    expect(store.effectiveMode).toBe('file')
  })

  it('forces local mode on github.io regardless of stored preference', () => {
    setHostname('my-app.github.io')
    const store = useStorageSettingsStore()
    store.setMode('file')
    expect(store.mode).toBe('file')
    expect(store.effectiveMode).toBe('local')
  })

  it('forces local mode on netlify.app regardless of stored preference', () => {
    setHostname('my-app.netlify.app')
    const store = useStorageSettingsStore()
    store.setMode('file')
    expect(store.effectiveMode).toBe('local')
  })

  it('save getter only exposes persistable fields', () => {
    setHostname('localhost')
    const store = useStorageSettingsStore()
    store.setFileBackendUrl('http://example.test:1234')
    expect(store.save).toEqual({ mode: 'local', fileBackendUrl: 'http://example.test:1234' })
  })
})
