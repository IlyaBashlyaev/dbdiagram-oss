import { describe, it, expect, afterEach } from 'vitest'
import { isFreeHostedOrigin } from '../utils/hostUtils'

function setHostname(hostname) {
  Object.defineProperty(window, 'location', {
    value: { hostname },
    writable: true,
    configurable: true
  })
}

const originalLocation = window.location

describe('isFreeHostedOrigin', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    })
  })

  it('detects github.io subdomains', () => {
    setHostname('my-app.github.io')
    expect(isFreeHostedOrigin()).toBe(true)
  })

  it('detects netlify.app subdomains', () => {
    setHostname('my-app.netlify.app')
    expect(isFreeHostedOrigin()).toBe(true)
  })

  it('is false for localhost', () => {
    setHostname('localhost')
    expect(isFreeHostedOrigin()).toBe(false)
  })

  it('is false for a custom domain', () => {
    setHostname('dbdiagram.example.com')
    expect(isFreeHostedOrigin()).toBe(false)
  })
})
