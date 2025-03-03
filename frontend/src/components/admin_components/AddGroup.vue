<script setup lang="ts">
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['close', 'add']);

const newGroup = ref({
  name: '',
  description: '',
  email: '',
  leader: ''
});

const addGroup = () => {
  emit('add', newGroup.value);
  emit('close');
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Dodaj skupino</h3>
      <label>Ime:</label>
      <input v-model="newGroup.name" type="text" />

      <label>Opis:</label>
      <textarea v-model="newGroup.description"></textarea>

      <label>Email skupine:</label>
      <input v-model="newGroup.email" type="email" />

      <label>Ime vodje:</label>
      <input v-model="newGroup.leader" type="text" />

      <div class="buttons">
        <button @click="addGroup">Dodaj</button>
        <button @click="$emit('close')">Prekliči</button>
      </div>
    </div>
  </div>
</template>
