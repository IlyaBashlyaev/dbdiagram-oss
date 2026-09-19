import { describe, it, expect } from 'vitest'
import { isValidDiagramName } from '../store/storageAdapters'

describe('isValidDiagramName', () => {
  it('accepts a plain name', () => {
    expect(isValidDiagramName('MyDiagram')).toBe(true)
  })

  it('accepts inner spaces, e.g. the OS-style default name', () => {
    expect(isValidDiagramName('Untitled (1)')).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(isValidDiagramName('')).toBe(false)
  })

  it('rejects leading or trailing whitespace', () => {
    expect(isValidDiagramName(' Untitled')).toBe(false)
    expect(isValidDiagramName('Untitled ')).toBe(false)
  })

  it('rejects path separators', () => {
    expect(isValidDiagramName('a/b')).toBe(false)
    expect(isValidDiagramName('a\\b')).toBe(false)
  })

  it('rejects OS-invalid path characters', () => {
    for (const ch of ['<', '>', ':', '"', '|', '?', '*']) {
      expect(isValidDiagramName(`name${ch}`)).toBe(false)
    }
  })

  it('rejects control characters', () => {
    expect(isValidDiagramName('name\twith\ttab')).toBe(false)
    expect(isValidDiagramName('name\nwith\nnewline')).toBe(false)
  })
})
