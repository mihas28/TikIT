<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { loadMaAssignedTickets } from '@/api/api';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../stores/authStore';

// ** Trenutni uporabnik
const currentUserId = ref<string>('');

const getUserIdFromJWT = () => {
  const authStore = useAuthStore();
  const token = authStore.accessToken; // Pridobi JWT iz Pinia

  if (!token) {
    console.error("JWT ni na voljo");
    return null;
  }

  try {
    const decoded: { userId?: string } = jwtDecode(token); // Dekodiraj JWT
    return decoded.userId || null; // Vrni `userId`
  } catch (error) {
    console.error("Napaka pri dekodiranju JWT:", error);
    return null;
  }
};

// **Definicija podatkov**
interface Ticket {
  ticket_id: string;
  title: string;
  created_at: string;
  caller: string;
  company_name: string;
  priority: string;
  state: string;
  assignment_group: string;
  role: string;
  type: string;
}

const tickets = ref<Ticket[]>([]);
const searchQuery = ref('');
const router = useRouter();
const sortColumn = ref<string | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');
const currentPage = ref(1);
const ticketsPerPage = 15;
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  currentUserId.value = getUserIdFromJWT() || '';
  tickets.value = await loadMaAssignedTickets(currentUserId.value);  
  isLoading.value = false;
});

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// **Preslikava prioritet**
const priorityMap: { [key: string]: { text: string; color: string } } = {
  "1": { text: "P1 - kritična", color: "red" },
  "2": { text: "P2 - visoka", color: "orange" },
  "3": { text: "P3 - srednja", color: "green" },
  "4": { text: "P4 - nizka", color: "green" }
};

const stateMap: { [key: string]: { text: string; icon: string } } = {
  "new": { text: "Novo", icon: "bi bi-circle text-secondary" }, // Siva kroglica
  "open": { text: "Odprto", icon: "bi bi-arrow-repeat text-primary" }, // Modra ponovitev
  "awaiting info": { text: "V čakanju", icon: "bi bi-hourglass-split text-warning" }, // Rumena ura
  "resolved": { text: "Rešeno", icon: "bi bi-check-circle text-success" }, // Zelena kljukica
  "closed": { text: "Zaključeno", icon: "bi bi-check-circle-fill text-secondary" }, // Siva polna kljukica
  "cancelled": { text: "Preklicano", icon: "bi bi-x-circle text-danger" } // Rdeč križec
};

const typeLabels: Record<string, string> = {
  incident: 'Incident',
  'service request': 'Zahteva'
}

const filteredTickets = computed(() => {
  let sortedTickets = [...tickets.value];

  if (sortColumn.value) {
    sortedTickets.sort((a, b) => {
      let valA = a[sortColumn.value as keyof Ticket];
      let valB = b[sortColumn.value as keyof Ticket];

      // Če je stolpec "created_at", sortiraj kot datum
      if (sortColumn.value === "created_at") {
        return sortDirection.value === "asc"
          ? new Date(valA).getTime() - new Date(valB).getTime()
          : new Date(valB).getTime() - new Date(valA).getTime();
      }

      // Če je stolpec "priority" ali "id", pretvori v številko in sortiraj
      if (sortColumn.value === "priority" || sortColumn.value === "ticket_id") {
        return sortDirection.value === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }

      // Če ni število (npr. string), uporabi localeCompare
      return sortDirection.value === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  return sortedTickets.filter(ticket => {
    const formattedDate = formatDate(ticket.created_at);
    const priorityText = priorityMap[ticket.priority]?.text || ticket.priority;
    const stateText = stateMap[ticket.state]?.text || ticket.state;

    return (
      Object.values(ticket).some(value =>
        String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      ) ||
      formattedDate.includes(searchQuery.value) ||
      priorityText.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      stateText.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
});

// **Paginacija**
const totalPages = computed(() => Math.ceil(filteredTickets.value.length / ticketsPerPage));
const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * ticketsPerPage;
  return filteredTickets.value.slice(start, start + ticketsPerPage);
});

const changePage = (page: number) => {
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// **Sortiranje**
const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

// **Preusmeritev na podrobnosti ticketov**
const openTicket = (ticketId: number) => {
  router.push({ name: 'TicketDetails', params: { id: ticketId } });
};

// **Skrajšanje dolžine besedila**
const shortenText = (text: string, maxLength: number = 70) =>
  text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

</script>

<template>

    <div v-if="isLoading" class="content-wrapper">
      <p>Nalaganje pogleda za pogled vseh mojih dodeljenih zahtevkov...</p>
    </div>

    <div v-if="!isLoading" class="content-wrapper">
      <h3>Seznam zahtevkov, ki so dodeljeni name</h3>
      <input type="text" v-model="searchQuery" placeholder="Išči zahtevke..." class="search-box" />
  
      <table>
        <thead>
          <tr>
            <th @click="sortBy('ticket_id')">
              ID <span v-if="sortColumn === 'ticket_id'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('title')">
              Naziv <span v-if="sortColumn === 'title'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('created_at')">
              Datum odprtja <span v-if="sortColumn === 'created_at'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('caller')">
              Klicatelj <span v-if="sortColumn === 'caller'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('company_name')">
              Podjetje <span v-if="sortColumn === 'company_name'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('priority')">
              Prioriteta <span v-if="sortColumn === 'priority'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('state')">
              Stanje <span v-if="sortColumn === 'state'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('assignment_group')">
              Skupina <span v-if="sortColumn === 'assignment_group'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('type')">
              Tip <span v-if="sortColumn === 'type'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th @click="sortBy('role')">
              Vloga reševalca <span v-if="sortColumn === 'role'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in paginatedTickets" :key="ticket.ticket_id" @click="openTicket(Number(ticket.ticket_id))">
            <td>{{ shortenText(ticket.ticket_id) }}</td>
            <td>{{ shortenText(ticket.title) }}</td>
            <td>{{ formatDate(ticket.created_at) }}</td>
            <td>{{ shortenText(ticket.caller) }}</td>
            <td>{{ shortenText(ticket.company_name) }}</td>
            <td>
              <span :style="{ color: priorityMap[ticket.priority]?.color || 'black' }">
                {{ priorityMap[ticket.priority]?.text || ticket.priority }}
              </span>
            </td>
            <td>
              <span>
                <i :class="stateMap[ticket.state]?.icon || 'bi bi-question-circle text-secondary'"></i>
                {{ stateMap[ticket.state]?.text || ticket.state }}
              </span>
            </td>
            <td>{{ shortenText(ticket.assignment_group) }}</td>
            <td>{{ typeLabels[ticket.type] || ticket.type }}</td>
            <td>{{ shortenText(ticket.role) }}</td>       
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
