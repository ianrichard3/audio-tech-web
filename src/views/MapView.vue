<script setup lang="ts">
import { ref } from 'vue'
import GenericGrid from '../components/GenericGrid.vue'

const active = ref<string[]>([])

import { cells } from '../data/mockCells.ts'

// Solo estas IDs serán presionables
// const pressableCells = cells.filter(c => c.id.startsWith("in")).map(c => c.id)

const handleOrderChange = (newOrder: string[]) => {
  console.log('Nuevo orden:', newOrder)
}

const handleCellPress = (cellId: string, isActive: boolean) => {
  console.log('Cell pressed:', cellId, 'Active:', isActive)
}

</script>

<template>
  <GenericGrid
    v-model="active"
    :rows="2"
    :cols="4"
    :cells="cells"
    :pressableCells="'all'"
    :boardWidth="1800"
    :boardHeight="500"
    :gap="8"
    :draggable="false"
    :multi-select="false"
    activeColor="#2563eb"
    centerBg="#e5e7eb"
    borderColor="#cbd5e1"
    @cell-press="handleCellPress"
    @change="(v) => console.log('change', v)"
    @change-order="handleOrderChange"
  />
</template>
