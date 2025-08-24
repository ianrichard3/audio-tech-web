<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GridCell from './GridCell.vue'

type Key = string
type ActiveList = Key[]
type CellData = { id: Key; name: string; description: string }

const props = withDefaults(defineProps<{
  rows: number
  cols: number
  /** Lista de celdas (en orden de pintado). Si faltan para completar rows*cols, se autogeneran */
  cells?: CellData[]

  /** Ids presionables o 'all' */
  pressableCells?: Key[] | 'all'

  /** Estado controlado */
  modelValue?: ActiveList
  /** Estado inicial si no es controlado */
  defaultActive?: ActiveList

  /** Tamaño total del board (px). Usa todo el ancho/alto del contenedor si null */
  boardWidth?: number | null
  boardHeight?: number | null

  gap?: number
  radius?: string
  activeColor?: string
  cellBg?: string
  centerBg?: string
  borderColor?: string
  disabled?: boolean
  readonly?: boolean

  multiSelect?: boolean

  /** Permitir drag & drop de reordenamiento */
  draggable?: boolean
}>(), {
  cells: () => [],
  pressableCells: () => [],
  defaultActive: () => [],
  boardWidth: 500,
  boardHeight: 500,
  gap: 8,
  radius: '0.5rem',
  activeColor: '#2563eb',
  cellBg: '#ffffff',
  centerBg: '#e5e7eb',
  borderColor: '#cbd5e1',
  disabled: false,
  readonly: false,
  draggable: true,
  multiSelect: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: ActiveList): void
  (e: 'cell-press', id: Key, active: boolean): void
  (e: 'change', v: ActiveList): void
  (e: 'change-order', v: Key[]): void
}>()

const isControlled = computed(() => props.modelValue !== undefined)
const inner = ref<ActiveList>(isControlled.value ? (props.modelValue as ActiveList) : [...props.defaultActive])

watch(() => props.modelValue, (v) => {
  if (isControlled.value && v) inner.value = [...v]
})

const active = computed<ActiveList>({
  get: () => inner.value,
  set: (v) => {
    inner.value = v
    // Emitimos siempre; si el padre no usa v-model, no pasa nada.
    emit('update:modelValue', v)
  }
})

/** Matriz visible (rows x cols) construida desde `cells` */
const cellMatrix = ref<CellData[][]>([])

// Generador simple si faltan celdas
let autoId = 1
const genAuto = (): CellData => ({ id: `auto-${autoId++}`, name: `Cell ${autoId}`, description: `Celda ${autoId}` })

function initMatrix() {
  const needed = props.rows * props.cols
  const pool: CellData[] = props.cells.slice(0, needed)
  while (pool.length < needed) pool.push(genAuto())

  const m: CellData[][] = []
  let i = 0
  for (let r = 0; r < props.rows; r++) {
    const row: CellData[] = []
    for (let c = 0; c < props.cols; c++) row.push(pool[i++])
    m.push(row)
  }
  cellMatrix.value = m
}

// Inicial e/ cambios en `cells` o dimensiones
watch([() => props.cells, () => props.rows, () => props.cols], initMatrix, { immediate: true, deep: true })

/** Set de ids presionables */
const pressableSet = computed<Set<Key>>(() => {
  if (props.pressableCells === 'all') {
    return new Set(cellMatrix.value.flat().map(c => c.id))
  }
  return new Set(props.pressableCells as Key[])
})

function isPressable(id: Key) {
  return pressableSet.value.has(id)
}

/** Drag & drop (reordenamiento) */
function findPosById(id: Key): [number, number] | null {
  for (let r = 0; r < cellMatrix.value.length; r++) {
    const c = cellMatrix.value[r].findIndex(x => x.id === id)
    if (c >= 0) return [r, c]
  }
  return null
}

let dragFrom: Key | null = null

function onDragStart(e: DragEvent, id: Key) {
  if (!props.draggable) return
  dragFrom = id
  e.dataTransfer?.setData('text/plain', id)
  e.dataTransfer?.setDragImage?.(new Image(), 0, 0) // drag ghost mínimo
}

function onDragOver(e: DragEvent) {
  if (!props.draggable) return
  e.preventDefault()
}

function onDrop(e: DragEvent, toId: Key) {
  if (!props.draggable) return
  e.preventDefault()
  if (!dragFrom || dragFrom === toId) return
  const fromPos = findPosById(dragFrom)
  const toPos = findPosById(toId)
  if (!fromPos || !toPos) return

  const tmp = cellMatrix.value[fromPos[0]][fromPos[1]]
  cellMatrix.value[fromPos[0]][fromPos[1]] = cellMatrix.value[toPos[0]][toPos[1]]
  cellMatrix.value[toPos[0]][toPos[1]] = tmp
  dragFrom = null

  emit('change-order', cellMatrix.value.flat().map(cell => cell.id))
}

/** Toggle */
function onPressCell(id: Key) {
  if (props.disabled || props.readonly || !isPressable(id)) return
  if (props.multiSelect) {
    const next = new Set(active.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const arr = Array.from(next)
    active.value = arr
    emit('cell-press', id, next.has(id))
    emit('change', arr)
  } else {
    // Solo uno activo
    const arr = active.value[0] === id ? [] : [id]
    active.value = arr
    emit('cell-press', id, arr.length > 0)
    emit('change', arr)
  }
}

function onKeyToggle(e: KeyboardEvent, id: Key) {
  if (!isPressable(id)) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onPressCell(id)
  }
}
</script>

<template>
  <div
    class="gg-wrapper"
    :style="{
      '--board-width': boardWidth ? boardWidth + 'px' : 'auto',
      '--board-height': boardHeight ? boardHeight + 'px' : 'auto',
      '--gap': gap + 'px',
      '--radius': radius,
      '--active': activeColor,
      '--cell-bg': cellBg,
      '--center-bg': centerBg,
      '--border': borderColor
    } as any"
  >
    <div
      class="board"
      :style="{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }"
      role="grid"
      aria-label="Grilla presionable"
    >
      <template v-for="(row, r) in cellMatrix" :key="r">
        <template v-for="cell in row" :key="cell.id">
          <div
            class="cell"
            :class="{
              active: active.includes(cell.id) && isPressable(cell.id),
              'non-pressable': !isPressable(cell.id)
            }"
            role="gridcell"
            :aria-pressed="isPressable(cell.id) ? active.includes(cell.id) : undefined"
            :aria-disabled="!isPressable(cell.id) || disabled || readonly"
            @click="onPressCell(cell.id)"
            @keydown="onKeyToggle($event, cell.id)"
            :tabindex="isPressable(cell.id) && !disabled ? 0 : -1"
            :draggable="draggable"
            @dragstart="onDragStart($event, cell.id)"
            @dragover="onDragOver"
            @drop="onDrop($event, cell.id)"
          >
            <GridCell
              :name="cell.name"
              :description="cell.description"
              :active="active.includes(cell.id) && isPressable(cell.id)"
              :pressable="isPressable(cell.id)"
            />
          </div>
        </template>
      </template>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.gg-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.board {
  display: grid;
  gap: var(--gap);
  width: var(--board-width);
  height: var(--board-height);
  max-width: 100%;
  aspect-ratio: 1 / 1;
  background: #f9fafb;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 0.25rem);
  padding: var(--gap);
  box-sizing: border-box;
}

.cell {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--cell-bg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: visible;
  display: flex;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease;
}

.cell:hover,
.cell:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(0,0,0,0.10);
  outline: none;
}

/* Mostrar tooltip del hijo */
.cell:hover :deep(.tooltip),
.cell:focus-visible :deep(.tooltip) {
  opacity: 1;
  pointer-events: auto;
  z-index: 20;
}

.cell.active {
  background: var(--active);
  border-color: var(--active);
  box-shadow:
    0 6px 22px rgba(37,99,235,0.35),
    0 0 0 2px rgba(37,99,235,0.15) inset;
}

.cell.non-pressable {
  cursor: default;
  background: var(--center-bg);
}

:deep(.grid-cell) {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  box-shadow: none;
  pointer-events: none; /* el click lo maneja .cell */
}
</style>
