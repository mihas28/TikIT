<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';
import { createGroup } from '@/api/api';

const emit = defineEmits(['close', 'add']);

const newGroup = ref({
  group_id: '',
  group_name: '',
  description: '',
  email: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleAddGroup = async () => {

  if (!newGroup.value.group_name || newGroup.value.group_name === '' || newGroup.value.description === '' || newGroup.value.email === '' || newGroup.value.email === '') {
      error.value = 'Vsa polja so obvezna!';
      return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const createdGroup = await createGroup(newGroup.value);
    newGroup.value.group_id = createdGroup.group_id;
    emit('add', newGroup.value);
    emit('close');
  } catch (err) {
    error.value = 'Napaka pri dodajanju skupine.';
  } finally {
    isLoading.value = false;
  }
};

</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Dodaj skupino</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Ime skupine:</label>
      <input v-model="newGroup.group_name" type="text" />

      <label>Opis:</label>
      <textarea v-model="newGroup.description"></textarea>

      <label>Email:</label>
      <input v-model="newGroup.email" type="email" />

      <button class="bt-save" @click="handleAddGroup" :disabled="isLoading">
        {{ isLoading ? 'Dodajanje...' : 'Dodaj' }}
      </button>
      <button class="bt-close" @click="$emit('close')">Prekliči</button>
      
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
}
.bt-save {
  background-color: #4DD6AA;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px;
  cursor: pointer;
}
.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}
button, input, form, option { border-radius: 5px; }
</style>
