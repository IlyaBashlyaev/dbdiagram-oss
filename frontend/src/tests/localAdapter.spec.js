import { describe, it, expect, beforeEach, vi } from 'vitest'
import localforage from 'localforage'

const localStore = localforage.createInstance({ name: 'dbdiagram-oss', storeName: 'local_files' })
const legacyStore = localforage.createInstance({ name: 'dbdiagram-oss', storeName: 'files' })

async function freshAdapter() {
  vi.resetModules()
  const mod = await import('../store/storageAdapters/localAdapter')
  return mod.default
}

describe('localAdapter', () => {
  beforeEach(async () => {
    await localStore.clear()
    await legacyStore.clear()
  })

  it('starts empty', async () => {
    const adapter = await freshAdapter()
    expect(await adapter.list()).toEqual([])
  })

  it('save/load/list round-trip as an array of {name, dbml, coords}', async () => {
    const adapter = await freshAdapter()
    await adapter.save('MyDiagram', { dbml: 'Table users {}', coords: { zoom: 1 } })

    expect(await adapter.list()).toEqual(['MyDiagram'])
    expect(await adapter.load('MyDiagram')).toEqual({ dbml: 'Table users {}', coords: { zoom: 1 } })

    const raw = await localStore.getItem('diagrams')
    expect(raw).toEqual([{ name: 'MyDiagram', dbml: 'Table users {}', coords: { zoom: 1 } }])
  })

  it('save overwrites an existing entry with the same name', async () => {
    const adapter = await freshAdapter()
    await adapter.save('MyDiagram', { dbml: 'v1', coords: {} })
    await adapter.save('MyDiagram', { dbml: 'v2', coords: {} })

    expect(await adapter.list()).toEqual(['MyDiagram'])
    expect(await adapter.load('MyDiagram')).toEqual({ dbml: 'v2', coords: {} })
  })

  it('delete removes an entry', async () => {
    const adapter = await freshAdapter()
    await adapter.save('A', { dbml: '', coords: {} })
    await adapter.save('B', { dbml: '', coords: {} })
    await adapter.delete('A')

    expect(await adapter.list()).toEqual(['B'])
  })

  it('rename changes the name while preserving content', async () => {
    const adapter = await freshAdapter()
    await adapter.save('Old', { dbml: 'text', coords: { zoom: 2 } })
    await adapter.rename('Old', 'New')

    expect(await adapter.list()).toEqual(['New'])
    expect(await adapter.load('New')).toEqual({ dbml: 'text', coords: { zoom: 2 } })
    expect(await adapter.load('Old')).toBeNull()
  })

  it('load returns null for a missing diagram', async () => {
    const adapter = await freshAdapter()
    expect(await adapter.load('Nope')).toBeNull()
  })

  it('migrates legacy per-key records only when the new store is empty', async () => {
    await legacyStore.setItem('LegacyDiagram', {
      source: { text: 'Table legacy {}' },
      chart: { zoom: 3 }
    })

    const adapter = await freshAdapter()
    expect(await adapter.list()).toEqual(['LegacyDiagram'])
    expect(await adapter.load('LegacyDiagram')).toEqual({ dbml: 'Table legacy {}', coords: { zoom: 3 } })

    // legacy store is left untouched (non-destructive migration)
    expect(await legacyStore.getItem('LegacyDiagram')).toBeTruthy()
  })

  it('does not migrate legacy records once the new store already has data', async () => {
    const adapter = await freshAdapter()
    await adapter.save('Fresh', { dbml: '', coords: {} })

    await legacyStore.setItem('LegacyDiagram', {
      source: { text: 'Table legacy {}' },
      chart: {}
    })

    expect(await adapter.list()).toEqual(['Fresh'])
  })
})
