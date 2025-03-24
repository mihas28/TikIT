<!-- SlaBreachModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'reason-submitted'])

const reason = ref('')

// Oddaj razlog in zapri modal
const submit = () => {
  if (!reason.value.trim()) return
  emit('reason-submitted', reason.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop">
    <div class="modal-content p-3 rounded bg-white shadow">
      <h5>Razlog za SLA prekoračitev</h5>
      <textarea class="form-control" v-model="reason" rows="4" />
      <div class="mt-3 d-flex justify-content-end">
        <button class="btn btn-primary" @click="submit">Shrani</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.modal-content {
  width: 100%;
  max-width: 500px;
}
</style>
