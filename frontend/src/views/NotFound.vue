<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="content-wrapper text-center">
    <h1 class="display-4">404</h1>
    <h3>Stran ne obstaja</h3>
    <p>Oprostite, iskana stran ni bila najdena.</p>
    <button class="btn btn-primary" @click="router.push('/')">
      Nazaj na začetno stran
    </button>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 50px;
}
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: 50px;
    margin-left: 0;
    width: 100%;
  }
}
h1 {
  font-size: 6rem;
  color: #00B0BE;
}
h3 {
  color: #333;
}
.btn-primary {
  background-color: #00B0BE;
  border-color: #00B0BE;
}
.btn-primary:hover {
  background-color: #0090a1;
}
</style>
