<script setup lang="ts">
import { ref } from 'vue'
import GenericGrid from '../components/GenericGrid.vue'

const active = ref<string[]>([])

const cells = [
  { id: 'tl',     name: 'TL',     description: 'Arriba izquierda' },
  { id: 'tr',     name: 'TR',     description: 'Arriba derecha' },
  { id: 'center', name: 'Center', description: 'Centro no presionable' },
  { id: 'bl',     name: 'BL',     description: 'Abajo izquierda' },
  { id: 'br',     name: 'BR',     description: 'Abajo derecha' },
  { id: 'c1',     name: 'C1',     description: 'Extra 1' },
  { id: 'c2',     name: 'C2',     description: 'Extra 2' },
  { id: 'c3',     name: 'C3',     description: 'Extra 3' },
  { id: 'c4',     name: 'C4',     description: 'Extra 4' }
]

// Solo estas IDs serán presionables
const pressableCells = ['tl', 'tr', 'bl', 'br']

function handleOrderChange(newOrder: string[]) {
  console.log('Nuevo orden:', newOrder)
}
</script>

<template>
  <GenericGrid
    v-model="active"
    :rows="3"
    :cols="3"
    :cells="cells"
    :pressableCells="pressableCells"
    :boardWidth="500"
    :boardHeight="500"
    :gap="8"
    activeColor="#2563eb"
    centerBg="#e5e7eb"
    borderColor="#cbd5e1"
    @cell-press="(k, on) => console.log('cell-press', k, on)"
    @change="(v) => console.log('change', v)"
    @change-order="handleOrderChange"
  />

  <pre style="margin-top:12px; background:#f8fafc; border:1px solid #e5e7eb; padding:.5rem; border-radius:.5rem;">
Activos:
{{ JSON.stringify(active, null, 2) }}
  </pre>
</template>
