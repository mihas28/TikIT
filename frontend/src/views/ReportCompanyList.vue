<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchCompanyData } from '@/api/api';

// **Definicija podatkov**
interface Company {
  company_id: number;
  company_name: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  post_code: string;
  street: string;
}

const companies = ref<Company[]>([])
const currentPage = ref(1)
const itemsPerPage = 15
const searchQuery = ref('')
const sortColumn = ref<keyof Company>('company_id')
const sortDirection = ref<'asc' | 'desc'>('asc')
const isLoading = ref(false);
const router = useRouter();

onMounted(async () => {
  isLoading.value = true;
  companies.value = await fetchCompanyData();
  isLoading.value = false;
});

// **Filtriraj in sortiraj**
const filteredCompanies = computed(() => {
  let filtered = companies.value.filter(company =>
    company.company_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.street.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.city.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.country.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.phone.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    company.company_id.toString().includes(searchQuery.value.toLowerCase())
  )

  return filtered.sort((a, b) => {
    const valA = a[sortColumn.value]
    const valB = b[sortColumn.value]
    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// **Paginacija**
const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredCompanies.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(filteredCompanies.value.length / itemsPerPage)
)

const changePage = (page: number) => {
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const sortBy = (key: keyof Company) => {
  if (sortColumn.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = key
    sortDirection.value = 'asc'
  }
}

const openReport = (ticketId: number) => {
  router.push({ name: 'CompanyReport', params: { id: ticketId } });
};

// **Skrajšanje dolžine besedila**
const shortenText = (text: string | undefined | null, maxLength: number = 70) =>
  text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';


</script>

<template>

    <div v-if="isLoading" class="content-wrapper">
      <p>Nalaganje pogleda za podjetja...</p>
    </div>

    <div v-if="!isLoading" class="content-wrapper">
      <h3>Seznam podjetij</h3>
      <input type="text" v-model="searchQuery" placeholder="Išči podjetja..." class="search-box" />
  
      <table>
        <thead>
          <tr>
            <th @click="sortBy('company_id')">
              ID <span v-if="sortColumn === 'company_id'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('company_name')">
              Ime podjetja <span v-if="sortColumn === 'company_name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('email')">
              Email <span v-if="sortColumn === 'email'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('phone')">
              Telefon <span v-if="sortColumn === 'phone'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('street')">
              Ulica <span v-if="sortColumn === 'street'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('post_code')">
              Poštna številka <span v-if="sortColumn === 'post_code'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('city')">
               Mesto <span v-if="sortColumn === 'city'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('country')">
              Država <span v-if="sortColumn === 'country'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in paginatedCompanies" :key="company.company_id" @click="openReport(Number(company.company_id))">
            <td>{{ company.company_id }}</td>
            <td>{{ shortenText(company.company_name) }}</td>
            <td>{{ company.email }}</td>
            <td>{{ company.phone }}</td>
            <td>{{ shortenText(company.street) }}</td>
            <td>{{ company.post_code }}</td>
            <td>{{ company.city }}</td>
            <td>{{ company.country }}</td>
          </tr>
        </tbody>
      </table>
  
      <!-- Paginacija -->
      <div class="pagination">
        <button @click="changePage(1)" :disabled="currentPage === 1">&laquo;&laquo;</button>
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">&laquo;</button>
        <span>Stran {{ currentPage }} od {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">&raquo;</button>
        <button @click="changePage(totalPages)" :disabled="currentPage === totalPages">&raquo;&raquo;</button>
      </div>
    </div>
  </template>    

<style scoped>
/* Poskrbi, da vsebina ni prekrita s sidebarjem */
.content-wrapper {
    margin-left: 250px; /* Enako širini sidebarja */
    padding: 20px;
    width: calc(100% - 250px);
}

@media (max-width: 768px) {
    .content-wrapper {
        margin-top: 50px;
        margin-left: 0; /* Če je sidebar skrit */
        width: 100%;
    }
}

.search-box {
  width: 20%;
  padding: 8px;
  margin-bottom: 10px;
  border-radius: 5px;
}

/* Stil za tabelo */
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
th:hover {
  background-color: #f0f0f0;
}

/* Paginacija */
.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.pagination button {
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  background-color: #00B0BE;
  color: white;
  cursor: pointer;
}
.pagination button:disabled {
  background-color: #ccc;
  cursor: default;
}
</style>
