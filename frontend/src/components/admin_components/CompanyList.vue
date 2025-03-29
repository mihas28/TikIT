<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EditCompanyModal from './EditCompany.vue';
import AddCompanyModal from './AddCompany.vue';
import { fetchCompanyData } from '../../api/api';
import AddContract from '../admin_components/AddContract.vue';

interface Company {
  company_id: number;
  company_name: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  post_code: string;
  address: string;
}

const companies = ref<Company[]>([]);
const searchQuery = ref('');
const selectedCompany = ref<Record<string, any>>({});
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);
const isContractModalOpen = ref(false);
const isLoading = ref(false);

// **Shranjuje trenutni stolpec in smer razvrščanja**
const sortColumn = ref<keyof Company | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');

// **Funkcija za nalaganje podatkov ob zagonu**
const loadTestData = async () => {
  try {
    isLoading.value = true;
    companies.value = await fetchCompanyData();
  } catch (error) {
    console.error('Napaka pri nalaganju podatkov:', error);
  } finally {
    isLoading.value = false;
  }  
};

// **Ko se komponenta naloži, se pokliče loadTestData()**
onMounted(() => {
  loadTestData();
});

// **Funkcija za razvrščanje stolpcev**
const sortCompanies = (column: keyof Company) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }

  companies.value.sort((a, b) => {
    const valueA = a[column]?.toString().toLowerCase() || '';
    const valueB = b[column]?.toString().toLowerCase() || '';

    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
};

// **Filtriranje in sortiranje podatkov**
const filteredCompanies = computed(() => {
  let sortedData = [...companies.value];

  // Filtriranje podatkov na podlagi iskalnega polja
  sortedData = sortedData.filter(company =>
    Object.values(company).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );

  return sortedData;
});

// **Dodaj novo podjetje brez osveževanja**
const addCompanyToList = (newCompany: Company) => {
  isAddModalOpen.value = false;
  companies.value.push(newCompany);
  alert("Dodati morate še pogodbo za podjetje: " + newCompany.company_name);
  isContractModalOpen.value = true;
};

// **Odpiranje modala za urejanje**
const openEditModal = (company: Company) => {
  selectedCompany.value = company;
  isEditModalOpen.value = true;
};

// **Odpiranje modala za dodajanje**
const openAddModal = () => {
  isAddModalOpen.value = true;
};
</script>

<template>
  <div v-if="isLoading">
    <p>Nalaganje podjetij...</p>
  </div>

  <div v-if="!isLoading">
    <h3>Podjetja</h3>
    <input type="text" v-model="searchQuery" placeholder="Išči podjetja..." />

    <table>
      <thead>
        <tr>
          <th @click="sortCompanies('company_name')">
            Ime
            <span v-if="sortColumn === 'company_name'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortCompanies('email')">
            Email
            <span v-if="sortColumn === 'email'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortCompanies('phone')">
            Telefon
            <span v-if="sortColumn === 'phone'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortCompanies('city')">
            Mesto
            <span v-if="sortColumn === 'city'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th>Dejanja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in filteredCompanies" :key="company.company_id">
          <td>{{ company.company_name }}</td>
          <td>{{ company.email }}</td>
          <td>{{ company.phone }}</td>
          <td>{{ company.city }}</td>
          <td>
            <button class="btn-edit" @click="openEditModal(company)">Uredi</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novo podjetje</button>

    <EditCompanyModal v-if="isEditModalOpen" :company="selectedCompany" @close="isEditModalOpen = false" />
    <AddCompanyModal v-if="isAddModalOpen" @close="isAddModalOpen = false" @add="addCompanyToList"/>
    <AddContract v-if="isContractModalOpen" @close="isContractModalOpen = false"/>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

th:hover {
  background-color: rgba(0, 176, 190, 0.2);
}

td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
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
