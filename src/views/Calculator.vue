<script setup lang="ts">
import { ref, computed } from 'vue'

const precio = ref(100)
const cantidad = ref(2)
const descuento = ref(10)

const subtotal = computed(() => precio.value * cantidad.value)
const tieneDescuento = computed(() => subtotal.value > 200)
const valorConDescuento = computed(() =>
  subtotal.value * (100 - descuento.value) / 100
)
</script>

<template>
  <div class="home-container">
    <div class="calculator-card">
      <h2 class="calculator-title">
        Purchase Calculator
      </h2>

      <div class="form-group">
        <label>
          <span>Price:</span>
          <input
            type="number"
            v-model.number="precio"
            class="input-field"
          />
        </label>

        <label>
          <span>Quantity:</span>
          <input
            type="number"
            v-model.number="cantidad"
            class="input-field"
          />
        </label>

        <label>
          <span>Discount (%):</span>
          <input
            type="number"
            v-model.number="descuento"
            class="input-field"
          />
        </label>
      </div>

      <div class="result-group">
        <p class="subtotal-text">
          Subtotal:
          <span class="subtotal-value">
            {{ tieneDescuento ? valorConDescuento : subtotal }}
          </span>
        </p>

        <p v-if="tieneDescuento" class="descuento-text">
          🎉 Aplica descuento
        </p>
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
  padding: 2.5rem 2rem;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.calculator-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 1.2rem;
  text-align: center;
  letter-spacing: 0.5px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group label {
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
  gap: 0.3rem;
}
.input-field {
  margin-top: 0.2rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #f9fafb;
}
.input-field:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
}
.result-group {
  margin-top: 2rem;
  text-align: center;
}
.subtotal-text {
  font-size: 1.15rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 0.5rem;
}
.subtotal-value {
  color: #2563eb;
  font-weight: 700;
  margin-left: 0.4rem;
}
.descuento-text {
  color: #16a34a;
  font-weight: 600;
  margin-top: 0.7rem;
  font-size: 1rem;
}
</style>

