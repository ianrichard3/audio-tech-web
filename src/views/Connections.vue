<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { cells as rawCells } from "../data/mockCells"
import ConnectionsGrid from "../components/ConnectionsGrid.vue"

// Data source
const cells = rawCells
const options = cells.map(c => ({ ...c, id: String(c.id) }))

// Select state
const leftValue = ref("")
const rightValue = ref("")

// Active cells (in order): [first, second]
const active = ref<string[]>([])

// Sync active cells when selects change
watch([leftValue, rightValue], ([l, r]) => {
  const uniq = Array.from(new Set([l, r].filter(Boolean))) // keeps order, no duplicates
  active.value = uniq
}, { immediate: true })

// Render helpers
const leftValueRender = computed(() => options.find(c => c.id === String(leftValue.value))?.name ?? "")
const rightValueRender = computed(() => options.find(c => c.id === String(rightValue.value))?.name ?? "")
</script>

<template>
  <div
    style="--first:#2563eb; --second:#f59e0b; --extra:#10b981;"
  >
    <div class="card">
      <header class="card__header">
        <div>
          <h1 class="title">Connections</h1>
          <p class="subtitle">Select two entries to highlight them on the board.</p>
        </div>
      </header>

      <section class="controls">
        <div class="control">
          <label class="label" for="leftSelect">Source</label>
          <div class="select-wrap">
            <select id="leftSelect" v-model="leftValue" class="select">
              <option disabled value="">Select left</option>
              <option v-for="cell in options" :key="cell.id" :value="cell.id">{{ cell.name }}</option>
            </select>
          </div>
        </div>

        <div class="control">
          <label class="label" for="rightSelect">Target</label>
          <div class="select-wrap">
            <select id="rightSelect" v-model="rightValue" class="select">
              <option disabled value="">Select right</option>
              <option v-for="cell in options" :key="cell.id" :value="cell.id">{{ cell.name }}</option>
            </select>
          </div>
        </div>
      </section>

      <section class="info">
        <div class="pill">
          <span class="dot" style="background:var(--first)"></span>
          First active: <strong>{{ leftValueRender || "—" }}</strong>
        </div>
        <div class="pill">
          <span class="dot" style="background:var(--second)"></span>
          Second active: <strong>{{ rightValueRender || "—" }}</strong>
        </div>
      </section>

      <section class="board">
        <ConnectionsGrid
          v-model="active"
          :rows="6"
          :cols="32"
          :cells="cells"
          :boardWidth="1000"
          :boardHeight="420"
          :gap="12"
          :radius="'1rem'"
          :cellBg="'#ffffff'"
          :centerBg="'#f6f7fb'"
          :borderColor="'#e5e7eb'"
          :firstColor="'#2563eb'"
          :secondColor="'#f59e0b'"
          :extraActiveColor="'#10b981'"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 100%;
  max-width: 98vw;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  overflow: hidden;
}
.card__header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbff;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
}
.subtitle {
  color: #666;
  font-size: 14px;
}
.controls {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: #fff;
}
.control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
}
.select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d7dde6;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
  color: #222;
}
.info {
  display: flex;
  gap: 14px;
  padding: 0 24px 18px;
}
.pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e6ebf2;
  color: #222;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
}
.pill .dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #2563eb;
}
.board {
  padding: 10px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
