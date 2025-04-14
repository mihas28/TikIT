<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EditContract from './EditContract.vue';
import AddContract from './AddContract.vue';
import { fetchContracts, openContractFile } from '@/api/api';
import { format } from 'date-fns';

const formatDate = (isoDate: string) => {
  return format(new Date(isoDate), 'dd.MM.yyyy'); // Prikaže v obliki "13.03.2025"
};

interface Contract {
  contract_id: number;
  short_description: string;
  description: string;
  start_date: string;
  end_date: string;
  company_name: string;
  contract_file: string;
  state: string;
}

const contracts = ref<Contract[]>([]);
const searchQuery = ref('');
const selectedContract = ref<Record<string, any>>({});
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);
const sortKey = ref<keyof Contract | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');
const isLoading = ref(false);

// **Funkcija za nalaganje pogodb**
const loadContracts = async () => {
  try {
    isLoading.value = true;
    contracts.value = await fetchContracts();
  } catch (error) {
    console.error('Napaka pri nalaganju pogodb:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadContracts();
});

// **Filtriranje pogodb glede na iskalni niz**
const filteredContracts = computed(() => {
  return contracts.value.filter(contract =>
    Object.values(contract).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

// **Sortiranje pogodb po iskanih rezultatih**
const sortedContracts = computed(() => {
  if (!sortKey.value) return filteredContracts.value;
  return [...filteredContracts.value].sort((a, b) => {
    const valueA = a[sortKey.value!] as string;
    const valueB = b[sortKey.value!] as string;
    return (sortOrder.value === 'asc' ? 1 : -1) * valueA.localeCompare(valueB);
  });
});

const sortBy = (key: keyof Contract) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const openEditModal = (contract: any) => {
  selectedContract.value = contract;
  isEditModalOpen.value = true;
};

const openAddModal = () => {
  isAddModalOpen.value = true;
};
</script>

<template>
  <div v-if="isLoading">
    <p>Nalaganje pogodb...</p>
  </div>

  <div v-if="!isLoading">
    <h3>Pogodbe</h3>
    <input type="text" v-model="searchQuery" placeholder="Išči pogodbe..." />

    <table>
      <thead>
        <tr>
          <th @click="sortBy('short_description')">Kratek opis {{ sortKey === 'short_description' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('state')">Status {{ sortKey === 'state' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('start_date')">Začetek {{ sortKey === 'start_date' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('end_date')">Konec {{ sortKey === 'end_date' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('company_name')">Podjetje {{ sortKey === 'company_name' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th>Pogodba</th>
          <th>Dejanja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contract in sortedContracts" :key="contract.contract_id">
          <td>{{ contract.short_description }}</td>
          <td>{{ contract.state }}</td>
          <td>{{ formatDate(contract.start_date) }}</td>
          <td>{{ formatDate(contract.end_date) }}</td>
          <td>{{ contract.company_name }}</td>
          <td>
            <i class="bi bi-file-earmark-pdf" @click="openContractFile(contract.contract_id)"></i>
          </td>
          <td>
            <button class="btn-edit" @click="openEditModal(contract)">Uredi</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novo pogodbo</button>

    <EditContract v-if="isEditModalOpen" :contract="selectedContract" @close="isEditModalOpen = false" />
    <AddContract v-if="isAddModalOpen" @close="isAddModalOpen = false" />
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}
.btn-edit {
  background-color: #f0ad4e;
  color: white;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
}
button, input {
  border-radius: 5px;
}
.btn-add {
  margin-top: 10px;
  padding: 10px;
  background-color: #11C4B9;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
