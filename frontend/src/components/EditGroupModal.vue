<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  group: {
    type: Object,
    default: () => ({ name: '', description: '', email: '', leader: '' })
  }
});

const emit = defineEmits(['close', 'save']);

const saveChanges = () => {
  emit('save', props.group);
  emit('close');
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi skupino</h3>
      <label>Ime:</label>
      <input v-model="group.name" type="text" />

      <label>Opis:</label>
      <textarea v-model="group.description"></textarea>

      <label>Email skupine:</label>
      <input v-model="group.email" type="email" />

      <label>Ime vodje:</label>
      <input v-model="group.leader" type="text" />

      <div class="buttons">
        <button @click="saveChanges">Shrani</button>
        <button @click="$emit('close')">Prekliči</button>
      </div>
    </div>
  </div>
</template>
