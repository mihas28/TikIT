<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { updatePassword } from '@/api/api';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref<string | null>(null);

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Gesli se ne ujemata!';
    return;
  }

  try {
    // @ts-ignore
    await updatePassword(props.user.user_id, newPassword.value);
    alert('Geslo uspešno posodobljeno!');
    emit('close');
  } catch (err) {
    error.value = 'Napaka pri spreminjanju gesla.';
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Spremeni geslo</h3>
      <label>Novo geslo:</label>
      <input v-model="newPassword" type="password" />

      <label>Potrdi geslo:</label>
      <input v-model="confirmPassword" type="password" />

      <p v-if="error" class="error">{{ error }}</p>

      <button class="bt-save" @click="changePassword">Shrani</button>
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

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
}
</style>
