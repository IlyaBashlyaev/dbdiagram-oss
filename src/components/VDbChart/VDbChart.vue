<template>
  <svg
    ref="root"
    class="db-chart"
    @mousemove.passive.capture="updateCursorPosition"
  >
    <defs>
      <pattern id="db-chart__bg-grid-base"
               :width="bgGrid.pattern.width"
               :height="bgGrid.pattern.height"
               patternUnits="userSpaceOnUse"
               :viewBox="`0 0 ${bgGrid.pattern.width} ${bgGrid.pattern.height}`"
               class="db-chart__bg-grid"
               ref="bgGridRect">
        <g class="db-chart__bg-grid-small">
          <path :d="bgGrid.pattern.path" fill="none"/>
        </g>
        <path :d="`M ${bgGrid.pattern.width} 0 L 0 0 0 ${bgGrid.pattern.height}`" fill="none"/>
      </pattern>

      <pattern id="db-chart__bg-grid"
               x="0" y="0"
               :width="bgGrid.pattern.width"
               :height="bgGrid.pattern.height"
               patternUnits="userSpaceOnUse"
               :viewBox="`${bgGrid.pattern.x} ${bgGrid.pattern.y} ${bgGrid.pattern.width} ${bgGrid.pattern.height}`">
        <rect
          :x="`-${bgGrid.pattern.width}`"
          :y="`-${bgGrid.pattern.height}`"
          :width="`${bgGrid.pattern.width*3}`"
          :height="`${bgGrid.pattern.height*3}`"
          fill="url(#db-chart__bg-grid-base)"/>
      </pattern>
    </defs>

    <g id="background-layer">
      <rect ref="bgRef" class="db-chart__bg"
            @mousedown="onBgMouseDown"
            @mouseup="panZoom.disablePan()"
            @touchend="panZoom.disablePan()"
      />
      <rect class="db-chart__bg-grid"
            x="0" y="0"
            width="100%" height="100%"
            fill="url(#db-chart__bg-grid)"/>
    </g>
    <g id="viewport-layer">
      <g id="tablegroups-layer"
         v-if="store.loaded">
        <v-db-table-group v-for="tableGroup of tableGroups"
                          :key="tableGroup.id"
                          v-bind="tableGroup"
                          :container-ref="root"
                          @click.passive="dblclickHelper(onTableGroupDblClick, $event, tableGroup)"
                          @mouseenter.passive="onTableGroupMouseEnter"
                          @mouseleave.passive="onTableGroupMouseLeave"
        >

        </v-db-table-group>
      </g>
      <g id="refs-layer"
         v-if="store.loaded">
        <v-db-ref v-for="ref of refs"
                  :key="ref.id"
                  v-bind="ref"
                  :container-ref="root"
                  @click:ref="dblclickHelper(onRefDblClick, $event, ref)"
                  @click.passive="dblclickHelper(onRefDblClick, $event, ref)"
                  @mouseenter.passive="onRefMouseEnter"
                  @mouseleave.passive="onRefMouseLeave"
                  
        />
      </g>
      <g id="tables-layer"
         v-if="store.loaded"
         @mousedown="redispatchToRealTarget">
        <v-db-table v-for="table of tables"
                    v-bind="table"
                    :useSchema="useSchema"
                    :key="table.id"
                    :container-ref="root"
                    @click:header="dblclickHelper(onTableDblClick, $event, table)"
                    @click:field="(...e) => dblclickHelper(onFieldDblClick, ...e)"
                    @mouseenter.passive="onTableMouseEnter"
                    @mouseleave.passive="onTableMouseLeave"
        />
       
      </g>
      <g id="selection-layer" v-if="selecting">
        <rect class="db-chart__selection-box"
              :x="selectionBox.x"
              :y="selectionBox.y"
              :width="selectionBox.width"
              :height="selectionBox.height"
        />
      </g>
      <g id="overlays-layer"
         v-if="store.loaded">
        <v-db-tooltip/>
      </g>
      <g id="panel-overlays-layer"
         v-if="store.loaded">
        <v-db-panel 
          @click:color="onColorClick" 
          @touchend.passive="onColorClick"/>
      
      </g>
      <g id="panel-ref-overlays-layer"
         v-if="store.loaded">
        <v-db-ref-panel 
          @click:cp="onCpClick"
          @touchend.passive="onCpClick"/>
      </g>
    
    </g>
    <g id="tools-layer">
      <svg x="10" y="10" width="150" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">position</text>
        <text x="0">x:
          <v-number :value="position.x" decimals="1"/>
        </text>
        <text x="75">y:
          <v-number :value="position.y" decimals="1"/>
        </text>
      </svg>

      <svg x="170" y="10" width="150" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">pan</text>
        <text x="0">x:
          <v-number :value="store.pan.x" decimals="1"/>
        </text>
        <text x="75">y:
          <v-number :value="store.pan.y" decimals="1"/>
        </text>
      </svg>

      <svg x="330" y="10" width="100" height="36" class="db-tools">
        <rect class="db-tools__bg"/>
        <text x="0" class="db-tools__header">zoom</text>
        <text x="0">
          <v-number :value="store.zoom" decimals="3"/>
        </text>
      </svg>
    </g>
  </svg>
</template>

<script setup>
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, watchEffect } from 'vue'
  import VDbTable from './VDbTable'
  import VDbRef from './VDbRef'
  import svgPanZoom, { pan } from 'svg-pan-zoom'
  import { useChartStore } from '../../store/chart'
  import VDbTooltip from './VDbTooltip'
  import VDbPanel from './VDbPanel.vue'
  import VDbRefPanel from './VDbRefPanel.vue'
  import VDbTableGroup from './VDbTableGroup'

  const store = useChartStore()

  const props = defineProps({
    tableGroups: {
      type: Array,
      default: () => ([])
    },
    tables: {
      type: Array,
      default: () => ([])
    },
    refs: {
      type: Array,
      default: () => ([])
    },
    schemes: {
      type: Array,
      default: () => ([])
    },
    startpan: {
    x:0,
    y:0
  }
   
  })

  const emit = defineEmits([
    'dblclick:table-group',
    'dblclick:table',
    'dblclick:ref',
    'dblclick:field',
  
  ])

  const root = ref(null)
  const bgGrid2 = ref(null)
  const bgGridRect = ref(null)
  const useSchema = computed(()=>props.schemes.length > 1);

  const bgGrid = reactive({
    pattern: {
      viewport: {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      },
      rect: {
        x: -100,
        y: -100,
        width: 300,
        height: 300
      },
      path: '',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    offset: {
      x: 0,
      y: 0
    },
  } )
  const panZoom = ref({})
  const position = reactive({
    x: 0,
    y: 0
  },)
  let initialized = false

  // Rubber-band multi-select on the empty canvas. Panning by dragging the
  // background is kept, but only while Space is held, since a plain drag
  // now draws the selection box instead.
  const spacePressed = ref(false)
  const selecting = ref(false)
  const selectionStart = reactive({ x: 0, y: 0 })
  const selectionBox = reactive({ x: 0, y: 0, width: 0, height: 0 })

  const onSpaceKeyDown = (e) => {
    if (e.code === 'Space') spacePressed.value = true
  }
  const onSpaceKeyUp = (e) => {
    if (e.code === 'Space') spacePressed.value = false
  }

  const chartPoint = (clientX, clientY) => {
    const rect = root.value.getBoundingClientRect()
    return store.inverseCtm.transformPoint({
      x: clientX - rect.left,
      y: clientY - rect.top
    })
  }

  const onBgMouseDown = (e) => {
    if (spacePressed.value) {
      panZoom.value.enablePan()
      return
    }

    store.clearSelectedTables()

    const p = chartPoint(e.clientX, e.clientY)
    selectionStart.x = p.x
    selectionStart.y = p.y
    selectionBox.x = p.x
    selectionBox.y = p.y
    selectionBox.width = 0
    selectionBox.height = 0
    selecting.value = true

    root.value.addEventListener('mousemove', onSelectionMove, { passive: true })
    root.value.addEventListener('mouseup', onSelectionEnd, { passive: true })
  }

  const onSelectionMove = (e) => {
    const p = chartPoint(e.clientX, e.clientY)
    selectionBox.x = Math.min(selectionStart.x, p.x)
    selectionBox.y = Math.min(selectionStart.y, p.y)
    selectionBox.width = Math.abs(p.x - selectionStart.x)
    selectionBox.height = Math.abs(p.y - selectionStart.y)
  }

  // A table counts as "inside" the selection window only when its whole
  // bounding box, borders included, fits within the drawn rectangle.
  const onSelectionEnd = () => {
    selecting.value = false
    root.value.removeEventListener('mousemove', onSelectionMove, { passive: true })
    root.value.removeEventListener('mouseup', onSelectionEnd, { passive: true })

    const selectedIds = props.tables
      .filter((table) => {
        const s = store.getTable(table.id, table.schema.name, table.name)
        return s.x >= selectionBox.x &&
          s.y >= selectionBox.y &&
          (s.x + s.width) <= (selectionBox.x + selectionBox.width) &&
          (s.y + s.height) <= (selectionBox.y + selectionBox.height)
      })
      .map((table) => table.id)

    store.setSelectedTables(selectedIds)
    selectionBox.width = 0
    selectionBox.height = 0
  }

  const updateCursorPosition = (e) => {
    const p = store.inverseCtm.transformPoint({
      x: e.offsetX,
      y: e.offsetY
    })
    position.x = p.x
    position.y = p.y
  }

  const saveSizes = () => {
    const s = panZoom.value.getSizes()
    const p = panZoom.value.getPan()
    const z = panZoom.value.getZoom()
    const pan = {
      x: p.x - (s.width / 2),
      y: p.y - (s.height / 2)
    }
    store.$patch({
      pan: pan,
      zoom: z
    })
  }

  const loadSizes = () => {
    const s = panZoom.value.getSizes()
    const p = store.pan
    const z = store.zoom
    const pan = {
      x: p.x,
      y: p.y
    }
    panZoom.value.resize()
    panZoom.value.center()
    panZoom.value.zoom(z)
    panZoom.value.panBy(pan)
  }

  function updateGrid (matrix) {
    let p = ''
    const {
      size: c,
      divisions: d
    } = store.grid
    const e = c / d

    const restrainedMatrix = DOMMatrix.fromMatrix(matrix)
    const minPos = restrainedMatrix.transformPoint({
      x: 0,
      y: 0
    })
    const maxPos = restrainedMatrix.transformPoint({
      x: c,
      y: c
    })

    const cx = Math.abs(maxPos.x - minPos.x)
    const cy = Math.abs(maxPos.y - minPos.y)
    const dx = cx / d
    const dy = cy / d

    const tx = minPos.x
    const ty = minPos.y
    const mx = ((tx % cx) + cx) % cx
    const my = ((ty % cy) + cy) % cy

    p += 'M 0 0'
    for (let i = 1; i < d; i++) {
      p += ` m ${dx * i} 0 l 0 ${cy} m -${dx * i} -${cy}`
    }
    p += 'M 0 0'
    for (let i = 1; i < d; i++) {
      p += ` m 0 ${dy * i} l ${cx} 0 m -${cx} -${dy * i}`
    }

    bgGrid.pattern.x = -mx
    bgGrid.pattern.y = -my
    bgGrid.pattern.width = cx
    bgGrid.pattern.height = cy
    bgGrid.pattern.path = p
  }

  const updateCTM = (newCTM) => {
    store.updateCTM(newCTM)
    updateGrid(newCTM)
  }

  const updateZoom = () => {
    saveSizes()

  }

  onMounted(() => {
    panZoom.value = svgPanZoom(root.value, {
      viewportSelector: '#viewport-layer',
      panEnabled: false,
      fit: false,
      center: false,
      dblClickZoomEnabled: false,
      zoomScaleSensitivity: 0.2,
      minZoom: 0.1,
      maxZoom: 2.0,
      // onPan: (newPan) => {
      //   saveSizes()
      // },
      // onZoom: (newZoom) => {
      //   saveSizes()
      // },
      // onUpdatedCTM: (newCTM) => {
      //   store.updateCTM(newCTM)
      // }
    })
    nextTick(() => {
      loadSizes()
      panZoom.value.disablePan()
      panZoom.value.setOnPan(() => saveSizes())
      panZoom.value.setOnZoom(() => updateZoom())
      panZoom.value.setOnUpdatedCTM((newCTM) => updateCTM(newCTM))
    })
    initialized = true

    window.addEventListener('keydown', onSpaceKeyDown)
    window.addEventListener('keyup', onSpaceKeyUp)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onSpaceKeyDown)
    window.removeEventListener('keyup', onSpaceKeyUp)
  })

  watch(() => props.tables, () => {
    panZoom.value.updateBBox()
  })

  watch(() => props.refs, () => {
    panZoom.value.updateBBox()
  })

  watch(() => store.zoom, (newZoom) => {
    panZoom.value.zoom(newZoom)
  })

  watch(() => props.startpan, (newPan) => {
    //panZoom.value.resize()
    let s = panZoom.value.getSizes();
    let z = store.zoom
    let zHeight = 1
    let zWidth = 1
    let cor = 0.04;
    if (newPan.diagram.height > s.height){
      zHeight = s.height / newPan.diagram.height
    } 
    if (newPan.diagram.width > s.width){
      zWidth = s.width / newPan.diagram.width  
    } 
    const p = panZoom.value.getPan()
    const pan = {
      x: p.x - (s.width / 2),
      y: p.y - (s.height / 2)
    }
    z = Math.min(zWidth, zHeight) - cor;
    console.log('sizes', s, 'start pan ', props.startpan, 'zooms', z,zWidth,zHeight)
    store.$patch({
      pan: pan,
      zoom: z
    })
    panZoom.value.center()
    panZoom.value.zoom(z)
    //panZoom.value.zoom(newZoom)
    //panZoom.value.panBy(newPan)
  })
   
  

  function onRefDblClick (e, ref) {
    console.log("onRefDblClick", e, ref);
    emit('dblclick:ref', e, ref);
  }

  function onCpClick (e,operation,points,wpid,refid) {

   let rl = store.getRef(refid);
   if (operation == 'RESET'){
    rl.vertices = [];
   }
   if (operation == 'ADD'){
    rl.vertices.splice(rl.vertices.length-1,0,{x:points.x, y:points.y});
    //rl.vertices.push({x:points.x, y:points.y});
   }
   if (operation == 'DEL'){
    if (rl.vertices.length > 2){
      rl.vertices.splice(Number(wpid),1);
    }
   
   }
   store.updateRef(refid,rl)
   store.hideRefPanel();
 }

  function onColorClick (e, id,name, color,schema) {
   
    store.updateTableColor(name,id,color,schema);
    store.hidePanel();
  }
  function onFieldDblClick (e, field) {
    console.log("onFieldDblClick", e, field);
    emit('dblclick:field', e, field);
  }
  function onTableDblClick (e, table) {
    console.log("onTableDblClick", e, table);
    emit('dblclick:table', e, table);
  }
  function onTableGroupDblClick (e, tableGroup) {
    console.log("onTableGroupDblClick", e, tableGroup);
    emit('dblclick:table-group', e, tableGroup);
  }

  function onRefMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onRefMouseLeave (e) {
  }

  function onTableMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onTableMouseLeave (e) {
  }

  function onTableGroupMouseEnter (e) {
    e.target.parentElement.appendChild(e.target)
  }

  function onTableGroupMouseLeave (e) {
  }

  // Chromium resolves mousedown's e.target to the shared <g id="tables-layer">
  // container instead of the actual table/header rect under the cursor when
  // many sibling nested <svg> tables live inside it, so listeners bound on
  // .db-table-header never receive the bubbled event. Re-resolve the real
  // element from the click's coordinates (elementFromPoint stays accurate)
  // and re-dispatch a fresh mousedown there so it bubbles correctly.
  function redispatchToRealTarget (e) {
    const real = document.elementFromPoint(e.clientX, e.clientY)
    if (!real || real === e.target) return
    real.dispatchEvent(new MouseEvent('mousedown', e))
  }

  let lastClick = Date.now();
  let lastClicked = null;
  function dblclickHelper(fn, e, ...args) {
    console.log("dblclickHelper", e, ...args)
    const nowClick = Date.now();

    if (((nowClick - lastClick) < 500) && lastClicked === e.target) {
      console.log("dblclickHelperYES", e, ...args)
      fn(e, ...args);
    }
    lastClicked = e.target;
    lastClick = nowClick;
  }

</script>
