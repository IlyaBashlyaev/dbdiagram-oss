import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VDbTable from '../components/VDbChart/VDbTable.vue'
import { useChartStore } from '../store/chart'

function fireMouseEvent(el, type, { clientX = 0, clientY = 0 } = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY })
  el.dispatchEvent(event)
}

function mountTable() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useChartStore()
  // jsdom has no DOMMatrix geometry implementation, and the store's default
  // inverseCtm is just a plain array until updateCTM() runs — stub an identity
  // transform so the drag math is deterministic.
  store.inverseCtm = { transformPoint: ({ x, y }) => ({ x, y }) }

  // jsdom SVG elements don't implement createSVGPoint(); a plain element is a
  // real EventTarget, which is all startDrag()/drag()/drop() need from it.
  const containerRef = document.createElement('div')
  containerRef.createSVGPoint = () => ({})
  // startDrag()/drag() convert clientX/clientY to container-local coordinates
  // via getBoundingClientRect(); jsdom has no layout engine, so pin it at
  // (0,0) to keep clientX/clientY numerically equal to the local point.
  containerRef.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 })

  // seed the table entry the same way loadDatabase() does — VDbTable's own
  // `state` computed calls getTable(id) with no schema/tablename, which only
  // works once an entry already exists under some "schema.table" key
  const table = store.getTable(1, 'public', 'users')

  const wrapper = mount(VDbTable, {
    props: {
      id: 1,
      name: 'users',
      schema: { name: 'public' },
      fields: [],
      indexes: [],
      containerRef,
      useSchema: false
    },
    global: {
      plugins: [pinia],
      directives: { 'touch-hold': {} }
    }
  })

  return { wrapper, store, containerRef, table }
}

beforeEach(() => {
  // unimplemented in jsdom; updateWidth() calls this on mount
  SVGElement.prototype.getComputedTextLength = () => 50
})

describe('drag-and-drop', () => {
  it('keeps the mouse-to-corner offset constant while dragging', async () => {
    const { wrapper, containerRef, table } = mountTable()
    table.x = 100
    table.y = 50
    await wrapper.vm.$nextTick()

    const header = wrapper.find('.db-table-header')
    // grab the entity 20px right / 15px down from its top-left corner
    fireMouseEvent(header.element, 'mousedown', { clientX: 120, clientY: 65 })
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('db-table__dragging')

    // move the mouse by (+50, +30)
    fireMouseEvent(containerRef, 'mousemove', { clientX: 170, clientY: 95 })
    await wrapper.vm.$nextTick()

    expect(table.x).toBe(150) // moved by the same delta as the mouse
    expect(table.y).toBe(80)
    expect(170 - table.x).toBe(20) // grab offset preserved
    expect(95 - table.y).toBe(15)

    const svg = wrapper.find('#table-1')
    expect(svg.attributes('x')).toBe('150') // rendered attribute matches store
    expect(svg.attributes('y')).toBe('80')

    expect(wrapper.emitted('update:position')).toBeTruthy()
  })

  it('stops updating position after mouseup (listeners detached)', async () => {
    const { wrapper, containerRef, table } = mountTable()
    table.x = 100
    table.y = 50
    await wrapper.vm.$nextTick()

    fireMouseEvent(wrapper.find('.db-table-header').element, 'mousedown', { clientX: 120, clientY: 65 })
    fireMouseEvent(containerRef, 'mousemove', { clientX: 170, clientY: 95 })
    fireMouseEvent(containerRef, 'mouseup', {})
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('db-table__dragging')

    const xBefore = table.x
    fireMouseEvent(containerRef, 'mousemove', { clientX: 999, clientY: 999 })
    await wrapper.vm.$nextTick()
    expect(table.x).toBe(xBefore) // drag() listener was removed on drop
  })
})

describe('multi-selection group drag', () => {
  function mountTwoTables() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useChartStore()
    store.inverseCtm = { transformPoint: ({ x, y }) => ({ x, y }) }

    const containerRef = document.createElement('div')
    containerRef.createSVGPoint = () => ({})
    containerRef.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 })

    const table1 = store.getTable(1, 'public', 'users')
    const table2 = store.getTable(2, 'public', 'orders')
    // startGroupDrag looks each selected table up via tablesDict, the way
    // loadDatabase() populates it for every real table on load
    store.tablesDict = {
      1: { schema: 'public', name: 'users' },
      2: { schema: 'public', name: 'orders' }
    }

    const mountOne = (id, name, fields = []) => mount(VDbTable, {
      props: { id, name, schema: { name: 'public' }, fields, indexes: [], containerRef, useSchema: false },
      global: { plugins: [pinia], directives: { 'touch-hold': {} } }
    })

    const wrapper1 = mountOne(1, 'users')
    const wrapper2 = mountOne(2, 'orders')

    return { store, containerRef, table1, table2, wrapper1, wrapper2 }
  }

  it('only tables fully inside the selection get selected', () => {
    const { store, table1, table2 } = mountTwoTables()
    table1.x = 0; table1.y = 0; table1.width = 100; table1.height = 50
    table2.x = 500; table2.y = 500; table2.width = 100; table2.height = 50

    store.setSelectedTables([1])
    expect(store.isTableSelected(1)).toBe(true)
    expect(store.isTableSelected(2)).toBe(false)

    store.clearSelectedTables()
    expect(store.selectedTableIds).toEqual([])
  })

  it('moves every selected table by the same delta, leaving unselected tables untouched', async () => {
    const { store, containerRef, table1, table2, wrapper1 } = mountTwoTables()
    table1.x = 100; table1.y = 100
    table2.x = 300; table2.y = 300
    store.setSelectedTables([1, 2])
    await wrapper1.vm.$nextTick()

    expect(wrapper1.classes()).toContain('db-table__selected')

    // mousedown inside the (selected) table-1 svg root starts the group drag
    fireMouseEvent(wrapper1.find('#table-1').element, 'mousedown', { clientX: 120, clientY: 120 })
    await wrapper1.vm.$nextTick()
    expect(wrapper1.classes()).toContain('db-table__dragging')

    fireMouseEvent(containerRef, 'mousemove', { clientX: 150, clientY: 170 })
    await wrapper1.vm.$nextTick()

    expect(table1.x).toBe(130) // +30
    expect(table1.y).toBe(150) // +50
    expect(table2.x).toBe(330) // same delta applied to the other selected table
    expect(table2.y).toBe(350)

    fireMouseEvent(containerRef, 'mouseup', {})
    await wrapper1.vm.$nextTick()

    expect(store.groupDragActive).toBe(false)
    expect(store.isTableSelected(1)).toBe(true) // selection survives mouseup
    expect(store.isTableSelected(2)).toBe(true)
  })

  it('a header mousedown on a selected table starts a group drag, not a solo drag', async () => {
    const { store, containerRef, table1, table2, wrapper1 } = mountTwoTables()
    table1.x = 100; table1.y = 100
    table2.x = 300; table2.y = 300
    store.setSelectedTables([1, 2])
    await wrapper1.vm.$nextTick()

    // the mousedown bubbles from the header up through the table's svg root,
    // where startDrag() bails out (selected) and onTableMouseDown() takes
    // over instead, moving the whole selection together
    fireMouseEvent(wrapper1.find('.db-table-header').element, 'mousedown', { clientX: 120, clientY: 120 })
    fireMouseEvent(containerRef, 'mousemove', { clientX: 140, clientY: 130 })
    await wrapper1.vm.$nextTick()

    expect(table1.x).toBe(120)
    expect(table2.x).toBe(320) // moved together with table1
  })
})

describe('coordinate changes reflect on the svg element', () => {
  it('updates x/y attributes when the store table is mutated directly', async () => {
    const { wrapper, table } = mountTable()
    table.x = 321
    table.y = 654
    await wrapper.vm.$nextTick()

    const svg = wrapper.find('#table-1')
    expect(svg.attributes('x')).toBe('321')
    expect(svg.attributes('y')).toBe('654')
  })

  it('updates x/y attributes via store.updateTable()', async () => {
    const { wrapper, store, table } = mountTable()
    store.updateTable(1, { ...table, x: 42, y: 84 })
    await wrapper.vm.$nextTick()

    const svg = wrapper.find('#table-1')
    expect(svg.attributes('x')).toBe('42')
    expect(svg.attributes('y')).toBe('84')
  })
})
