<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
//import { logWorkTime } from '@/api/api';

defineProps<{ ticketId: string }>();
const emit = defineEmits(["close"]);

const workTime = ref({
  date: new Date().toISOString().split("T")[0],
  description: '',
  normalHours: 0,
  overtime: 0
});

const submitWorkLog = async () => {
  //await logWorkTime(ticketId, workTime.value);
  emit("close");
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Vpis delovnega časa</h3>
      <input type="date" v-model="workTime.date" />
      <textarea v-model="workTime.description" placeholder="Opis aktivnosti"></textarea>
      <input type="number" v-model="workTime.normalHours" placeholder="Navadne ure" />
      <input type="number" v-model="workTime.overtime" placeholder="Nadure" />
      <button @click="submitWorkLog">Shrani</button>
      <button @click="emit('close')">Zapri</button>
    </div>
  </div>
</template>
