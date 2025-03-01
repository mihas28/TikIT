<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { createCompany } from '@/api/api'; // Import funkcije za dodajanje podjetja

const emit = defineEmits(['close', 'add']);

const newCompany = ref({
  company_id: '',
  company_name: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  post_code: '',
  country: '',
  notes: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);

// **Funkcija za dodajanje podjetja**
const handleAddCompany = async () => {
  if (!newCompany.value.company_name || !newCompany.value.email || !newCompany.value.phone || !newCompany.value.street || !newCompany.value.city || !newCompany.value.post_code || !newCompany.value.country || !newCompany.value.notes) {
    error.value = 'Vsa polja so obvezna!';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const createdCompany = await createCompany(newCompany.value);
    newCompany.value.company_id = createdCompany.company_id;
    emit('add', newCompany.value);
    emit('close');
  } catch (err) {
    console.error('Napaka pri dodajanju podjetja:', err);
    error.value = 'Napaka pri dodajanju podjetja.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Dodaj podjetje</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Ime podjetja:</label>
      <input v-model="newCompany.company_name" type="text" required />

      <label>Email:</label>
      <input v-model="newCompany.email" type="email" required />

      <label>Telefon:</label>
      <input v-model="newCompany.phone" type="text" />

      <label>Ulica:</label>
      <input v-model="newCompany.street" type="text" />

      <label>Mesto:</label>
      <input v-model="newCompany.city" type="text" />

      <label>Poštna številka:</label>
      <input v-model="newCompany.post_code" type="text" />

      <label>Država:</label>
      <input v-model="newCompany.country" type="text" />

      <label>Opombe:</label>
      <textarea v-model="newCompany.notes"></textarea>

      <button class="bt-save" @click="handleAddCompany" :disabled="isLoading">
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
  width: 300px;
}

.bt-save {
  background-color: #4DD6AA;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px;
  cursor: pointer;
}

button, input, form, option { border-radius: 5px; }

.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}

.alert-danger {
  color: red;
  margin-bottom: 10px;
}
</style>
