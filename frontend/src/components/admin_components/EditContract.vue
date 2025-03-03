<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { updateContract } from '@/api/api';

const props = defineProps({
  contract: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const selectedFile = ref<File | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    selectedFile.value = target.files[0];
  }
};

const saveChanges = async () => {
  try {
    await updateContract(props.contract.contract_id, { ...props.contract, file: selectedFile.value });
    emit('close');
  } catch (error) {
    console.error('Napaka pri posodabljanju pogodbe:', error);
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi pogodbo</h3>
      <label>Kratek opis:</label>
      <input v-model="contract.short_description" type="text" />

      <label>Opis:</label>
      <textarea v-model="contract.description"></textarea>

      <label>Datum začetka:</label>
      <input v-model="contract.start_date" type="date" />

      <label>Datum konca:</label>
      <input v-model="contract.end_date" type="date" />

      <label>Status:</label>
      <input v-model="contract.status" type="text" />

      <label>Pogodba (.pdf):</label>
      <input type="file" accept="application/pdf" @change="handleFileUpload" />

      <button @click="saveChanges">Shrani</button>
      <button @click="$emit('close')">Prekliči</button>
    </div>
  </div>
</template>
