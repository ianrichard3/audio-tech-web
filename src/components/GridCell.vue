<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string
  description: string
  active?: boolean
  pressable?: boolean
}>(), {
  active: false,
  pressable: true
})
</script>

<template>
  <div
    class="grid-cell"
    :class="{ active: props.active, 'non-pressable': !props.pressable }"
    :aria-disabled="!props.pressable"
  >
    <span class="cell-name">{{ props.name }}</span>
    <div v-if="props.pressable" class="tooltip">
      <h4>{{ props.name }}</h4>
      <p>{{ props.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.grid-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100px;
  height: 100px;

  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;

  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);

  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
}

.grid-cell.non-pressable {
  opacity: 0.7;
}

.cell-name {
  text-align: center;
  padding: 0.2rem;
}

/* Tooltip */
.tooltip {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: white;
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  line-height: 1.2;
  width: max-content;
  max-width: 220px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 20;
}

.tooltip h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.2rem;
}

.tooltip p {
  font-size: 0.8rem;
  margin: 0;
  color: #e5e7eb;
}

/* El hover real lo controla el padre (.cell:hover ...), esto queda como refuerzo */
.grid-cell:hover .tooltip,
.grid-cell:focus .tooltip {
  opacity: 1;
  pointer-events: auto;
}

/* Activa */
.grid-cell.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}
.grid-cell.active .cell-name {
  color: white;
}
</style>
