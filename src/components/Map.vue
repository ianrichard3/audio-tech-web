<script setup lang="ts">
import { ref } from 'vue'

type CornerKey = 'tl' | 'tr' | 'bl' | 'br'
const corners = ref<Record<CornerKey, boolean>>({
  tl: false,
  tr: false,
  bl: false,
  br: false
})

const toggle = (k: CornerKey) => (corners.value[k] = !corners.value[k])
</script>

<template>
  <div class="home-container">
    <div class="calculator-card">
      <h2 class="calculator-title">Grid de esquinas</h2>

      <div class="board">
        <div
          class="corner"
          :class="{ active: corners.tl }"
          @click="toggle('tl')"
        ></div>

        <div></div>

        <div
          class="corner"
          :class="{ active: corners.tr }"
          @click="toggle('tr')"
        ></div>

        <div></div>
        <div class="center"></div>
        <div></div>

        <div
          class="corner"
          :class="{ active: corners.bl }"
          @click="toggle('bl')"
        ></div>

        <div></div>

        <div
          class="corner"
          :class="{ active: corners.br }"
          @click="toggle('br')"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.calculator-card {
  background: #fff;
  padding: 2rem;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  max-width: 520px;
  width: 100%;
}
.calculator-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 1rem;
  text-align: center;
}

.board {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 2fr 1fr;
  gap: 0.5rem;
  width: 500px;
  height: 500px;
  background: #f9fafb;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  margin: 0 auto;
  padding: 0.5rem;
}

.center {
  background: #e5e7eb;
  border-radius: 0.5rem;
}

.corner {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: 0.2s;
}
.corner:hover {
  border-color: #2563eb;
}
.corner.active {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
