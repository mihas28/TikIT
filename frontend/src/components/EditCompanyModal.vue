<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { updateCompany } from '@/api/api';

const props = defineProps({
  company: {
    type: Object,
    required: true
  }
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const emit = defineEmits(['close', 'save']);

// **Funkcija za shranjevanje sprememb podjetja**
const saveCompanyChanges = async () => {
  if (!props.company.company_id) {
    error.value = 'Manjka ID podjetja!';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await updateCompany(props.company.company_id, props.company);
    emit('save', props.company);
    emit('close');
  } catch (err) {
    console.error('Napaka pri posodabljanju podjetja:', err);
    error.value = 'Napaka pri posodabljanju podjetja.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi podjetje</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Ime:</label>
      <input v-model="company.company_name" type="text" required />

      <label>Email:</label>
      <input v-model="company.email" type="email" required />

      <label>Telefon:</label>
      <input v-model="company.phone" type="text" />

      <label>Ulica:</label>
      <input v-model="company.street" type="text" />

      <label>Mesto:</label>
      <input v-model="company.city" type="text" />

      <label>Poštna številka:</label>
      <input v-model="company.post_code" type="text" />

      <label>Država:</label>
      <input v-model="company.country" type="text" />

      <label>Opombe:</label>
      <textarea v-model="company.notes"></textarea>

      
    <button class="bt-save" @click="saveCompanyChanges" :disabled="isLoading">
        {{ isLoading ? 'Shranjevanje...' : 'Shrani' }}
    </button>
    <button class="bt-close" @click="$emit('close')">Prekliči</button>
      
    </div>
  </div>
</template>

<style scoped>
/* Enostavno oblikovanje modala */
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

button, input {
  border-radius: 5px;
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
