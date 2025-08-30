<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GridCell from './GridCell.vue'

type Key = string
type ActiveList = Key[]
type CellData = { id: Key; name: string; description: string }

const props = withDefaults(defineProps<{
  rows: number
  cols: number
  cells?: CellData[]

  /** Controlled state */
  modelValue?: ActiveList
  /** Initial state if uncontrolled */
  defaultActive?: ActiveList

  boardWidth?: number | null
  boardHeight?: number | null

  gap?: number
  radius?: string
  cellBg?: string
  centerBg?: string
  borderColor?: string

  firstColor?: string
  secondColor?: string
  extraActiveColor?: string
}>(), {
  cells: () => [],
  defaultActive: () => [],
  boardWidth: 500,
  boardHeight: 500,
  gap: 12,
  radius: '1rem',
  cellBg: '#ffffff',
  centerBg: '#f6f7fb',
  borderColor: '#e5e7eb',
  firstColor: '#2563eb',
  secondColor: '#f59e0b',
  extraActiveColor: '#10b981'
})

const isControlled = computed(() => props.modelValue !== undefined)
const inner = ref<ActiveList>(isControlled.value ? (props.modelValue as ActiveList) : [...props.defaultActive])

watch(() => props.modelValue, (v) => {
  if (isControlled.value && v) inner.value = [...v]
})

const active = computed<ActiveList>(() => inner.value)

/** Visible matrix (rows x cols) built from `cells` */
const cellMatrix = ref<CellData[][]>([])

let autoId = 1
const genAuto = (): CellData => ({ id: `auto-${autoId++}`, name: "", description: "" })

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

watch([() => props.cells, () => props.rows, () => props.cols], initMatrix, { immediate: true, deep: true })

/** Style helpers */
const indexInActive = (id: Key) => active.value.findIndex(x => x === id)
const isActive = (id: Key) => indexInActive(id) !== -1

const colorFor = (id: Key) => {
  const idx = indexInActive(id)
  if (idx === -1) return props.cellBg
  if (idx === 0) return props.firstColor
  if (idx === 1) return props.secondColor
  return props.extraActiveColor
}
</script>

<template>
  <div
    class="cg-surface"
    :style="{
      '--board-width': boardWidth ? boardWidth + 'px' : 'auto',
      '--board-height': boardHeight ? boardHeight + 'px' : 'auto',
      '--gap': gap + 'px',
      '--radius': radius,
      '--cell-bg': cellBg,
      '--center-bg': centerBg,
      '--border': borderColor,
      '--first': firstColor,
      '--second': secondColor,
      '--extra': extraActiveColor
    } as any"
  >
    <div class="board">
      <div
        class="grid"
        :style="{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }"
        role="grid"
        aria-label="ConnectionsGrid"
      >
        <template v-for="(row, r) in cellMatrix" :key="r">
          <template v-for="cell in row" :key="cell.id">
            <div
              class="cell"
              :class="{
                active: isActive(cell.id),
                first: indexInActive(cell.id) === 0,
                second: indexInActive(cell.id) === 1,
                extra: indexInActive(cell.id) > 1
              }"
              role="gridcell"
              :style="{
                background: colorFor(cell.id),
                borderColor: isActive(cell.id) ? colorFor(cell.id) : 'var(--border)'
              }"
            >
              <GridCell
                :name="cell.name"
                :description="cell.description"
                :active="isActive(cell.id)"
                :pressable="false"
              />
            </div>
          </template>
        </template>
      </div>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.cg-surface {
  width: 100%;
  display: flex;
  justify-content: center;
  background: #fff;
  padding: 0px 0px;
  border-radius: 0.8rem;
  border: 1px solid #e5e7eb;
  margin: 0px 24px;
}

.board {
  width: 100%;
  background: #fff;
  border-radius: 0.7rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 8px 2px;
}

.grid {
  display: grid;
  gap: 4px;
  width: 100%;
  background: #f6f7fb;
  border-radius: 1rem;
  padding: 2px 4px;
  box-sizing: border-box;
}

.cell {
  border: 1px solid #e5e7eb;
  border-radius: 0.6rem;
  background: #fff;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  transition:
    background .15s,
    border-color .15s,
    box-shadow .15s,
    transform .15s;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}

.cell.active {
  box-shadow: 0 4px 16px rgba(37,99,235,0.10);
}

.cell.first {
  box-shadow: 0 4px 16px rgba(37,99,235,0.18);
}

.cell.second {
  box-shadow: 0 4px 16px rgba(245,158,11,0.18);
}

.cell.extra {
  box-shadow: 0 4px 16px rgba(16,185,129,0.16);
}

:deep(.grid-cell) {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  box-sizing: border-box;
  font-size: 14px;
  color: #222;
}
</style>
