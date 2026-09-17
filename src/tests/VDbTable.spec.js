import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VDbTable from '../components/VDbChart/VDbTable.vue'
import { useChartStore } from '../store/chart'

function fireMouseEvent(el, type, { offsetX = 0, offsetY = 0 } = {}) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'offsetX', { get: () => offsetX })
  Object.defineProperty(event, 'offsetY', { get: () => offsetY })
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
    fireMouseEvent(header.element, 'mousedown', { offsetX: 120, offsetY: 65 })
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('db-table__dragging')

    // move the mouse by (+50, +30)
    fireMouseEvent(containerRef, 'mousemove', { offsetX: 170, offsetY: 95 })
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

    fireMouseEvent(wrapper.find('.db-table-header').element, 'mousedown', { offsetX: 120, offsetY: 65 })
    fireMouseEvent(containerRef, 'mousemove', { offsetX: 170, offsetY: 95 })
    fireMouseEvent(containerRef, 'mouseup', {})
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('db-table__dragging')

    const xBefore = table.x
    fireMouseEvent(containerRef, 'mousemove', { offsetX: 999, offsetY: 999 })
    await wrapper.vm.$nextTick()
    expect(table.x).toBe(xBefore) // drag() listener was removed on drop
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
