<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTicketDetails, updateTicket, addComment, fetchComments, fetchUsersCreate, fetchCompanyDataCreate, fetchContractsCreate, fetchGroupsCreate } from '@/api/api';
import { io } from 'socket.io-client';
import WorkLogModal from '../components/ticket_components/WorkLogModal.vue';

const route = useRoute();
const ticketId = ref(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id);

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ob ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

let getData: boolean = true;

const comments = ref<any[]>([]);
const newComment = ref('');
const isPublic = ref(true);
const isLoading = ref(false);
const isWorkLogModalOpen = ref(false);
const socket = io(import.meta.env.VITE_SOCKET_URL);

const companies = ref<{id: number, name: string}[]>([]);
const users = ref<{id: number, name: string, email: string, companyid: number, groupid: number}[]>([]);
const contracts = ref<{id: number, name: string, status: string, description: string, companyid: number}[]>([]);
const groups = ref<{id: number, name: string}[]>([]);

// **Izbrane vrednosti**
const selectedCompany = ref<{ id: number; name: string } | null>(null);
const selectedCaller = ref<{ id: number; name: string } | null>(null);
const selectedContract = ref<{ id: number; name: string } | null>(null);
const selectedEngineer = ref<{ id: number; name: string } | null>(null);
const selectedGroup = ref<{ id: number; name: string } | null>(null);
const additionalResolvers = ref<{ id: number; name: string }[]>([]);
const errorMessage = ref('');

// **Polja za iskanje**
const companySearch = ref('');
const callerSearch = ref('');
const contractSearch = ref('');
const engineerSearch = ref('');
const resolverSearch = ref('');
const groupSearch = ref('');

const ticket = ref({ticket:
  {
    accept_sla_breach: '',
    accepted_at: '',
    assignment_group: '',
    caller: '',
    caller_id: 0,
    close_code: '',
    close_notes: '',
    company_id: 0,
    company_name: '',
    contract_id: '',
    contract_name: '',
    created_at: '',
    description: '',
    group_id: 0,
    impact: 0,
    parent_ticket_id: 0,
    priority: '',
    resolved_at: '',
    sla_breach: '',
    state: '',
    ticket_id: 0,
    title: '',
    type: '',
    updated_at: '',
    urgency: 0,
  },
  primary: [{
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  }],
  other: [{
    created_at: '',
    description: '',
    primary_resolver: '',
    resolver: '',
    ticket_id: 0,
    time_worked: '',
    updated_at: '',
    user_id: 0,
  }]
});

const impactOptions = [
  { value: '3', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'High' }
];

const urgencyOptions = [
  { value: '3', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'High' }
];

const typeOptions = [
  { value: 'incident', label: 'Incident' },
  { value: 'service request', label: 'Request' }
];

const getPriority = () => {
    let impact: number = ticket.value.ticket.impact;
    let urgency: number = ticket.value.ticket.urgency;
    let priority: number;

    if (impact == 1 && urgency == 1) {
        priority = 1;
    } else if ((impact == 2 && urgency == 1) || (impact == 1 && urgency == 2)) {
        priority = 2;
    } else if ((impact == 3 && urgency == 1) || (impact == 1 && urgency == 3) || (impact == 2 && urgency == 2)) {
        priority = 3;
    } else if ((impact == 3 && urgency == 2) || (impact == 2 && urgency == 3) || (impact == 3 && urgency == 3)) {
        priority = 4;
    } else {
        priority = 4; // Privzeto P4, če ni ujemanja
    }

    // Vrni tekstualno vrednost priority
    if (priority === 1) {
        ticket.value.ticket.priority = "P1 - Kritična";
    } else if (priority === 2) {
      ticket.value.ticket.priority = "P2 - Visoka";
    } else {
      ticket.value.ticket.priority = `P${priority} - Nizka`;
    }
};

const formattedDate = ref('');

// **Vidnost dropdowna**
const showDropdowns = ref<{ [key in 'company' | 'caller' | 'contract' | 'engineer' | 'resolver' | 'additional' | 'group']: boolean }>({
  company: false,
  caller: false,
  contract: false,
  engineer: false,
  resolver: false,
  additional: false,
  group: false
});

// **Pridobivanje podatkov o ticketu**
const loadTicket = async () => {
  try {
    isLoading.value = true;
    ticket.value = await fetchTicketDetails(ticketId.value);
    companySearch.value = ticket.value.ticket.company_name;
    callerSearch.value = ticket.value.ticket.caller;
    contractSearch.value = ticket.value.ticket.contract_name;
    engineerSearch.value = ticket.value.primary[0].resolver;
    ticket.value.other.forEach(data => {
      addResolver({ id: data.user_id, name: data.resolver });
    }); 
    groupSearch.value = ticket.value.ticket.assignment_group;
    formattedDate.value = formatDate(ticket.value.ticket.created_at);
    getPriority();

  } catch (error) {
    console.error("Napaka pri nalaganju ticket podrobnosti:", error);
  } finally {
    isLoading.value = false;
  }
};

// **Validacija podatkov (kot CreateCustom.vue)**
/*watch(ticket, (newVal) => {
  if (!newVal.title /*|| !newVal.priority || !newVal.state) {
    loadTicket();
  }
});*/

// **Pridobivanje komentarjev**
const loadComments = async () => {
  try {
    comments.value = await fetchComments(Number(ticketId.value));
  } catch (error) {
    console.error("Napaka pri nalaganju komentarjev:", error);
  }
};

// **Shranjevanje sprememb ticketov**
const saveChanges = async () => {
  try {
    await updateTicket(String(ticketId.value), ticket.value);
    alert("Spremembe shranjene!");
  } catch (error) {
    console.error("Napaka pri shranjevanju:", error);
  }
};

// **Dodajanje komentarja**
const sendComment = async () => {
  if (!newComment.value.trim()) return;
  const commentData = {
    ticket_id: ticketId.value,
    text: newComment.value,
    public: isPublic.value,
  };

  try {
    await addComment(commentData);
    socket.emit("newComment", commentData);
    newComment.value = "";
  } catch (error) {
    console.error("Napaka pri dodajanju komentarja:", error);
  }
};

// **Filtriranje glede na vnos**
const filteredCompanies = computed(() =>
  companies.value.filter(c => c.name.toLowerCase().includes(companySearch.value.toLowerCase()))
);

const filteredUsers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(callerSearch.value.toLowerCase()) &&
    (!selectedCompany.value || u.companyid === selectedCompany.value.id) &&
    (!selectedEngineer.value || u.id !== selectedEngineer.value.id) && // Ne sme biti isti kot reševalec
    (!additionalResolvers.value.some(r => r.id === u.id)) // Ne sme biti že dodan kot dodatni reševalec
  )
);

const filteredContracts = computed(() =>
  contracts.value.filter(c =>
    c.name.toLowerCase().includes(contractSearch.value.toLowerCase()) &&
    (!selectedCompany.value || c.companyid === selectedCompany.value.id)
  )
);

const filteredGroups = computed(() =>
    groups.value.filter(c => c.name.toLowerCase().includes(groupSearch.value.toLowerCase()) &&
    (!selectedEngineer.value || c.id === selectedEngineer.value.id)
 )
);

const filteredEngineers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(engineerSearch.value.toLowerCase()) &&
    (!selectedGroup.value || u.groupid === selectedGroup.value.id) &&
    (!selectedCaller.value || u.id !== selectedCaller.value.id) && // Ne sme biti isti kot klicatelj
    (!additionalResolvers.value.some(r => r.id === u.id)) // Ne sme biti že dodan kot dodatni reševalec
  )
);

const filteredResolvers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(resolverSearch.value.toLowerCase()) &&
    !additionalResolvers.value.some(r => r.id === u.id) && // Ne sme biti že dodan kot dodatni reševalec
    (!selectedEngineer.value || u.id !== selectedEngineer.value.id) && // Ne sme biti isti kot glavni reševalec
    (!selectedCaller.value || u.id !== selectedCaller.value.id) // Ne sme biti isti kot klicatelj
  )
);

// **Funkcija za čiščenje polj pri napačni izbiri**
const resetAllFields = () => {
  selectedCaller.value = null;
  selectedContract.value = null;
  selectedEngineer.value = null;
  selectedGroup.value = null;
  selectedCompany.value = null;
  additionalResolvers.value = [];
  callerSearch.value = '';
  contractSearch.value = '';
  engineerSearch.value = '';
  resolverSearch.value = '';
  errorMessage.value = '';
};

// **Nastavi podjetje ob izbiri**
const selectCompany = (company: any) => {
  if (selectedCaller.value || selectedContract.value || selectedEngineer.value) {
    resetAllFields();
  }
  selectedCompany.value = company;
  companySearch.value = company.name;
  showDropdowns.value.company = false;
};

// **Nastavi klicatelja in avtomatsko podjetje**
const selectCaller = (user: any) => {
  if (selectedEngineer.value && user.id === selectedEngineer.value.id) {
    resetAllFields();
    return;
  }
  selectedCaller.value = user;
  callerSearch.value = user.name;
  selectedCompany.value = companies.value.find(c => c.id === user.companyid) || null;
  companySearch.value = selectedCompany.value ? selectedCompany.value.name : '';
  showDropdowns.value.caller = false;
};

// **Nastavi skupino**
const selectGroup = (group: any) => {
    if (group.id !== selectedEngineer.value?.id) {
        resetAllFields();
    }
  selectedGroup.value = group;
  groupSearch.value = group.name;
  //selectedEngineer.value = users.value.find(u => u.id === group.id) || null;
  //engineerSearch.value = selectedEngineer.value ? selectedEngineer.value.name : '';
  showDropdowns.value.group = false;
};

// **Nastavi pogodbo**
const selectContract = (contract: any) => {
  selectedContract.value = contract;
  contractSearch.value = contract.name;
  showDropdowns.value.contract = false;
};

// **Nastavi reševalca**
const selectEngineer = (user: any) => {
  if (selectedCaller.value && user.id === selectedCaller.value.id) {
    resetAllFields();
    return;
  }
  selectedEngineer.value = user;
  engineerSearch.value = user.name;
  selectedGroup.value = groups.value.find(g => g.id === (users.value.find(h => h.id === user.id))?.groupid) || null;
  groupSearch.value = selectedGroup.value ? selectedGroup.value.name : '';
  showDropdowns.value.engineer = false;
};

// **Dodaj dodatnega reševalca**
const addResolver = (user: any) => {
  additionalResolvers.value.push(user);
  resolverSearch.value = '';
  showDropdowns.value.additional = false;
};

// **Zunanja klik funkcija za zapiranje dropdownov**
const closeDropdowns = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest(".content-wrapper")) {
    Object.keys(showDropdowns.value).forEach(key => (showDropdowns.value[key as keyof typeof showDropdowns.value] = false));
  }
};

// **Odstrani dodatnega reševalca**
const removeResolver = (user: any) => {
  if (getData)
  {
    loadUsers();
    loadCompanies();
    loadContracts();
    loadGroups();
    document.addEventListener("click", closeDropdowns);
    //document.removeEventListener("click", closeDropdowns)
    getData = !getData;
  }
  additionalResolvers.value = additionalResolvers.value.filter(r => r.id !== user.id);
};



// **Shrani podatke**
const saveData = async () => {
  /*if (!selectedEngineer.value) {
    errorMessage.value = "Reševalec je obvezno polje!";
    return;
  }

  ticket.value.caller_id = selectedCaller.value?.id ?? 0;
  ticket.value.group_id = selectedGroup.value?.id ?? 0;
  ticket.value.contract_id = selectedContract.value?.id ?? 0;
  ticket.value.state = 'open';

  try {
    const createdTicket = await createCustomTicket(ticket.value);
    await assignTicket({user_id: selectedEngineer.value.id, ticket_id: createdTicket.ticket_id, primary: true})
    
    additionalResolvers.value.forEach(async user => {
      await assignTicket({user_id: user.id, ticket_id: createdTicket.ticket_id, primary: false})
    });

    errorMessage.value = "Podatki uspešno shranjeni!";
    router.push({ name: 'TicketDetails', params: { id: createdTicket.ticket_id } });
  } catch (err) {
    console.error('Napaka pri ustvarjanju zahtevka:', err);
  } */
};

// **Funkcija za nalaganje uporabnikov**
const loadUsers = async () => {
  try {
    users.value = await fetchUsersCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju uporabnikov:', error);
  }
};

// **Funkcija za nalaganje podjetij**
const loadCompanies = async () => {
  try {
    companies.value = await fetchCompanyDataCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju podjetij:', error);
  }
};

// **Funkcija za nalaganje pogodb**
const loadContracts = async () => {
  try {
    contracts.value = await fetchContractsCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju pogodb:', error);
  }
};

// **Funkcija za nalaganje skupin**
const loadGroups = async () => {
  try {
    groups.value = await fetchGroupsCreate();
  } catch (error) {
    console.error('Napaka pri nalaganju skupin:', error);
  }
};

onMounted(async () => {
  await loadTicket();
  //await loadComments();
  /*socket.on(`ticket:${ticketId.value}`, (message: any) => {
    comments.value.unshift(message);
  });*/
});

const getDataFunction = () => {
  if (getData)
  {
    loadUsers();
    loadCompanies();
    loadContracts();
    loadGroups();
    document.addEventListener("click", closeDropdowns);
    document.removeEventListener("click", closeDropdowns)
    getData = !getData;
  }
};

/*onMounted(() => {
  loadUsers();
  loadCompanies();
  loadContracts();
  loadGroups();

  document.addEventListener("click", closeDropdowns);
  document.removeEventListener("click", closeDropdowns)
});*/
</script>

<template>
  <div class="content-wrapper">
    <!-- Navigacija z gumbi -->
    <nav class="ticket-nav">
      <button @click="saveChanges" class="btn-primary">Shrani</button>
      <button @click="isWorkLogModalOpen = true" class="btn-secondary">Vpiši čas</button>
      <button class="btn-danger">Prekliči zahtevek</button>
    </nav>

    <!-- SLA indikator -->
    <div class="sla-indicator" v-if="ticket.ticket.accept_sla_breach">
      {{ ticket.ticket.accept_sla_breach }}
    </div>

    <form @submit.prevent="saveData" class="ticket-form">
      <div class="form-row">
        <!-- ID -->
        <div class="form-group">
          <label for="caller">ID zahtevka</label>
            <input v-model="ticket.ticket.ticket_id" id="ticket_id" disabled />
        </div>

        <!-- Odprto dne -->
        <div class="form-group">
          <label for="date">Odprto</label>
            <input v-model="formattedDate" id="date" disabled />
        </div>
      </div>
        
      <div class="form-row">
        <!-- status -->
        <div class="form-group">
          <label for="status">Status</label>
            <input v-model="ticket.ticket.state" id="status" disabled />
        </div>
        <!-- Priority -->
        <div class="form-group">
          <label for="priority">Prioriteta</label>
          <input v-model="ticket.ticket.priority" id="priority" disabled />
        </div>
      </div>

      <div class="form-row">
        <!-- tip -->
        <div class="form-group">
          <label for="type">Tip zahtevka</label>
            <select id="type" v-model="ticket.ticket.type">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <!-- Impact -->
        <div class="form-group">
          <label for="impact">Vpliv</label>
          <select id="impact" v-model="ticket.ticket.impact" @change="getPriority">
            <option v-for="option in impactOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>  
      </div>

      <div class="form-row">
        <!-- Klicatelj -->
        <div class="form-group">
          <label for="caller">Klicatelj</label>
            <input v-model="callerSearch" id="caller" @focus="showDropdowns.caller = true" @input="getDataFunction" required />
            <ul v-if="showDropdowns.caller">
              <li v-for="user in filteredUsers" :key="user.id" @click="selectCaller(user)">
                {{ user.name }}
            </li>
          </ul>
        </div>
        <!-- Urgency -->
        <div class="form-group">
          <label for="urgency">Nujnost</label>
          <select id="urgency" v-model="ticket.ticket.urgency" @change="getPriority">
            <option v-for="option in urgencyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div> 
      </div>

      <div class="form-row">
        <!-- Podjetje -->
        <div class="form-group">
          <label for="company">Podjetje</label>
            <input v-model="companySearch" id="company" @focus="showDropdowns.company = true" @input="getDataFunction" required />
            <ul v-if="showDropdowns.company">
              <li v-for="company in filteredCompanies" :key="company.id" @click="selectCompany(company)">
                {{ company.name }}
              </li>
            </ul>
        </div>
        <!-- Skupina -->
        <div class="form-group">
          <label for="group">Assigment group</label>
            <div class="dropdown-container">
            <input id="group" v-model="groupSearch" @focus="showDropdowns.group = true" type="text" placeholder="Iskanje skupine" @input="getDataFunction" required />
            <ul v-if="showDropdowns.group">
              <li v-for="group in filteredGroups" :key="group.id" @click="selectGroup(group)">
                {{ group.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="form-row">
        <!-- Parent ticket -->
        <div class="form-group">
          <label for="parentTicket">Nadrejeni zahtevek</label>
          <input type="text" id="parentTicket" v-model="ticket.ticket.parent_ticket_id" />
        </div>
        <!-- Inženir -->
        <div class="form-group">
          <label for="engineer">Reševalec</label>
          <input id="engineer" v-model="engineerSearch" @focus="showDropdowns.engineer = true" @input="getDataFunction" required/>
          <ul v-if="showDropdowns.engineer">
            <li v-for="user in filteredEngineers" :key="user.id" @click="selectEngineer(user)">
              {{ user.name }}
            </li>
          </ul>
        </div>
      </div>  

      <div class="form-row">
        <!-- Pogodba -->
        <div class="form-group">
          <label for="contract">Pogodba</label>
          <div class="dropdown-container">
            <input v-model="contractSearch" id="contract" @focus="showDropdowns.contract = true" type="text" placeholder="Iskanje pogodbe" @input="getDataFunction" required />
            <ul v-if="showDropdowns.contract">
              <li v-for="contract in filteredContracts" :key="contract.id" @click="selectContract(contract)">
                {{ contract.name }} - {{ contract.status }} | {{ contract.description }}
              </li>
            </ul>
          </div>
        </div>
        <div class="form-group">
          <label>Dodatni reševalci</label>
            <div class="dropdown-container">
            <input v-model="resolverSearch" @focus="showDropdowns.additional = true" type="text" placeholder="Dodaj reševalca" @input="getDataFunction" />
            <ul v-if="showDropdowns.additional">
              <li v-for="user in filteredResolvers" :key="user.id" @click="addResolver(user)">
                {{ user.name }}
              </li>
            </ul>
          </div>
          <div v-if="additionalResolvers.length">
            <span v-for="resolver in additionalResolvers" :key="resolver.id" class="resolver">
              {{ resolver.name }}
              <i class="fa-regular fa-circle-xmark remove-icon" @click="removeResolver(resolver)"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- Naslov (čez celo širino) -->
      <div class="form-group full-width">
        <label for="title">Naslov zahtevka</label>
        <input type="text" id="title" v-model="ticket.ticket.title" required />
      </div>

      <!-- Opis (čez celo širino) -->
      <div class="form-group full-width">
        <label for="description">Opis</label>
        <textarea id="description" v-model="ticket.ticket.description" required></textarea>
      </div>

      <button type="submit" class="submit-btn">Ustvari zahtevek</button>

    </form>

    <!-- Komentarji -->
    <div class="ticket-comments">
      <h3>Komunikacija</h3>
      <textarea v-model="newComment" placeholder="Vnesi komentar..." class="input-field"></textarea>
      <label>
        <input type="checkbox" v-model="isPublic" />
        Javno sporočilo
      </label>
      <button @click="sendComment" class="btn-primary">Pošlji</button>

      <ul class="comment-list">
        <li v-for="comment in comments" :key="comment.id">
          <strong>{{ comment.public ? "🟢 Javno" : "🔒 Zasebno" }}:</strong>
          {{ comment.text }}
        </li>
      </ul>
    </div>

    <!-- Modal za beleženje časa -->
    <WorkLogModal v-if="isWorkLogModalOpen" @close="isWorkLogModalOpen = false" :ticketId="ticketId" />
  </div>
</template>

<style scoped>
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

.ticket-nav {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 15px;
}

.sla-indicator {
  background: red;
  color: white;
  padding: 10px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
}

.dropdown-container ul {
  max-height: 200px; /* Nastavi maksimalno višino dropdowna */
  overflow-y: auto; /* Omogoči vertikalni scroll, če vsebina preseže višino */
  border: 1px solid #ccc; /* Doda rob za vizualno ločitev */
  background: white; /* Ozadje */
  padding: 0;
  margin: 0;
  position: absolute;
  width: auto;
  z-index: 1000; /* Poskrbi, da je dropdown nad ostalimi elementi */
}

.dropdown-container li {
  padding: 10px;
  cursor: pointer;
}

.dropdown-container li:hover {
  background: #f0f0f0;
}

/* Postavitev dveh stolpcev */
.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.full-width {
  width: 100%;
}

label {
  display: block;
  font-weight: bold;
}

input, select, textarea, ul, li {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border-radius: 5px;
}

ul {
  list-style: none;
  background: white;
  border: 1px solid #ccc;
  padding: 0;
  margin: 0;
  position: absolute;
  width: auto;
}

li {
  padding: 10px;
  cursor: pointer;
}

li:hover {
  background: #f0f0f0;
}

.resolver {
  display: inline-flex;
  align-items: center;
  background: #4DD6AA;
  color: white;
  border: none;
  margin: 5px;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.remove-icon {
  margin-left: 8px;
  color: red;
  cursor: pointer;
}

/* Responsive design */
@media (max-width: 1000px) {
  .form-row {
    flex-direction: column;
  }
}

.input-field {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.btn-primary {
  background-color: #00B0BE;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #746EBC;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-danger {
  background-color: #A63264;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-btn {
  background-color: #00B0BE;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

.comment-list {
  list-style-type: none;
  padding: 0;
}

.comment-list li {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}
</style>
