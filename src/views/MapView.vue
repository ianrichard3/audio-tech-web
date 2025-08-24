<script setup lang="ts">
import { ref } from 'vue'
import GenericGrid from '../components/GenericGrid.vue'

const active = ref<string[]>([])

const cells = [
  {id: "off1", name: "", description: ""},
  {id: "off2", name: "", description: ""},
  {id: "off3", name: "", description: ""},
  {id: "off4", name: "", description: ""},
  {id: "off5", name: "", description: ""},
  {id: "off6", name: "", description: ""},
  {id: "in1", name: "Entrada 1", description: "Aca va la clave"},
  {id: "in2", name: "Entrada 2", description: "Aca va la clave"},
  {id: "in3", name: "Entrada 3", description: "Aca va la clave"},
  {id: "in4", name: "Entrada 4", description: "Aca va la clave"},
  {id: "in5", name: "Entrada 5", description: "Aca va la clave"},
  {id: "in6", name: "Entrada 6", description: "Aca va la clave"},
    {id: "off7", name: "", description: ""},
  {id: "off8", name: "", description: ""},
  {id: "off9", name: "", description: ""},
  {id: "off10", name: "", description: ""},
  {id: "off11", name: "", description: ""},
  {id: "off12", name: "", description: ""}

]

// Solo estas IDs serán presionables
const pressableCells = cells.filter(c => c.id.startsWith("in")).map(c => c.id)

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
    :rows="3"
    :cols="6"
    :cells="cells"
    :pressableCells="pressableCells"
    :boardWidth="600"
    :boardHeight="300"
    :gap="8"
    :multi-select="false"
    activeColor="#2563eb"
    centerBg="#e5e7eb"
    borderColor="#cbd5e1"
    @cell-press="(k, on) => console.log('cell-press', k, on)"
    @change="(v) => console.log('change', v)"
    @change-order="handleOrderChange"
  />
</template>
