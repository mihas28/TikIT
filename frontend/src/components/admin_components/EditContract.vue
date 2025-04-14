<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { updateContract, fetchCompanyData } from '@/api/api';

const props = defineProps({
  contract: {
    type: Object,
    required: true,
    default: () => ({
      short_description: '',
      description: '',
      start_date: '',
      end_date: '',
      company_id: '',
      company_name: '',
      state: 'active',
      contract_file: null as File | null
    })
  }
});

interface Company {
  company_id: number;
  company_name: string;
}

const companies = ref<Company[]>([]);
const file = ref<File | null>(null);
const errorMessage = ref<string | null>(null);

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

const emit = defineEmits(['close', 'save']);

// **Upravljanje nalaganja datotek**
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
  }
};

// **Shranjevanje sprememb pogodbe**
const saveChanges = async () => {
  errorMessage.value = null;

  // Preverimo, če so obvezna polja izpolnjena
  if (!props.contract.short_description || !props.contract.description || 
      !props.contract.start_date || !props.contract.end_date || 
      !props.contract.company_id) {
    errorMessage.value = 'Vsa polja morajo biti izpolnjena, razen pogodbe.';
    return;
  }

  if (props.contract.end_date > props.contract.start_date) {
    errorMessage.value = 'Datum začetka ne more biti kasnejši od datuma konca!';
    return;
  }

  try {
    const selectedCompany = companies.value.find(c => c.company_id === props.contract.company_id);
    if (selectedCompany) props.contract.company_name = selectedCompany.company_name;

    // @ts-ignore
    await updateContract(props.contract.contract_id, props.contract, file.value);

    emit('save', props.contract);
    emit('close');
  } catch (error) {
    console.error('Napaka pri posodabljanju pogodbe:', error);
    errorMessage.value = 'Napaka pri posodabljanju pogodbe.';
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi pogodbo</h3>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <label>Kratek opis:</label>
      <input v-model="contract.short_description" type="text" />

      <label>Opis:</label>
      <textarea v-model="contract.description"></textarea>

      <label>Datum začetka:</label>
      <input v-model="contract.start_date" type="date" />

      <label>Datum konca:</label>
      <input v-model="contract.end_date" type="date" />

      <label>Podjetje:</label>
      <select v-model="contract.company_id">
        <option v-for="company in companies" :key="company.company_id" :value="company.company_id">
          {{ company.company_name }}
        </option>
      </select>

      <label>Pogodba (.pdf):</label>
      <input type="file" accept="application/pdf" @change="handleFileUpload" />
      <p>Uporabljena bo trenutna pogodba, če nobena datoteka ni izbrana.</p>

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
.error-message {
  color: red;
  font-size: 14px;
  margin-bottom: 10px;
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
</style>
