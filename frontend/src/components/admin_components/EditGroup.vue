<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { updateGroup } from '@/api/api';

const props = defineProps({
  group: {
    type: Object,
    default: () => ({
      group_id: '',
      group_name: '',
      description: '',
      email: ''
    })
  }
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const saveGroupChanges = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await updateGroup(props.group.group_id, props.group);
  } catch (err) {
    error.value = 'Napaka pri posodabljanju skupine.';
  } finally {
    isLoading.value = false;
  }
};

const emit = defineEmits(['close', 'save']);

const saveChanges = () => {
  saveGroupChanges();
  emit('save', props.group);
  emit('close');
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi skupino</h3>
      <label>Ime:</label>
      <input v-model="group.group_name" type="text" />

      <label>Opis:</label>
      <textarea v-model="group.description"></textarea>

      <label>Email:</label>
      <input v-model="group.email" type="email" />
      
      <button class="bt-save" @click="saveChanges">Shrani</button>
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

button, input, form, option { border-radius: 5px;}

.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}
</style>
