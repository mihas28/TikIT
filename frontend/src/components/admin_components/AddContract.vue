<script setup lang="ts">
import { ref, defineEmits, onMounted } from 'vue';
import { addContract, fetchCompanyData } from '@/api/api';

const emit = defineEmits(['close', 'add']);

const newContract = ref({
  short_description: '',
  description: '',
  start_date: '',
  end_date: '',
  company_id: '',
  company_name: '',
  state: 'active',
  contract_file: null as File | null
});

interface Company {
  company_id: number;
  company_name: string;
}

const companies = ref<Company[]>([]);

// **Funkcija za nalaganje podjetij**
const loadCompanies = async () => {
  try {
    companies.value = await fetchCompanyData();
  } catch (error) {
    console.error('Napaka pri nalaganju podjetij:', error);
  }
};

onMounted(() => {
  loadCompanies();
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    newContract.value.contract_file = target.files[0];
  }
};

const addNewContract = async () => {
  if (!newContract.value.short_description || !newContract.value.contract_file) {
    error.value = 'Kratek opis in pogodba (.pdf) sta obvezna!';
    return;
  }

  if (newContract.value.start_date > newContract.value.end_date) {
    error.value = 'Datum začetka ne more biti kasnejši od datuma konca!';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const selectedCompany = companies.value.find(c => c.company_id === Number(newContract.value.company_id));
    newContract.value.company_name = selectedCompany ? selectedCompany.company_name : '';
    const createdContract = await addContract(newContract.value);
    
    emit('add', createdContract);
    emit('close');
  } catch (err) {
    console.error('Napaka pri dodajanju pogodbe:', err);
    error.value = 'Napaka pri dodajanju pogodbe.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Dodaj novo pogodbo</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Kratek opis:</label>
      <input v-model="newContract.short_description" type="text" required />

      <label>Opis:</label>
      <textarea v-model="newContract.description"></textarea>

      <label>Datum začetka:</label>
      <input v-model="newContract.start_date" type="date" />

      <label>Datum konca:</label>
      <input v-model="newContract.end_date" type="date" />

      <label>Podjetje:</label>
      <select v-model="newContract.company_id">
          <option v-for="company in companies" :key="company.company_id" :value="company.company_id">{{ company.company_name }}</option>
      </select>

      <label>Pogodba (.pdf):</label>
      <input type="file" accept="application/pdf" @change="handleFileUpload" />

      <button class="bt-save" @click="addNewContract" :disabled="isLoading">
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
.alert-danger {
  color: red;
  margin-bottom: 10px;
}
</style>
