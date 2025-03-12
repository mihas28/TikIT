<script setup lang="ts">
import { se } from 'date-fns/locale';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { fetchUsersCreate, fetchCompanyDataCreate, fetchContractsCreate, fetchGroupsCreate, createCustomTicket, assignTicket } from '@/api/api'; 

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

const ticket = ref({
  title: '',
  description: '',
  impact: '',
  urgency: '',
  type: '',
  parentTicket: '',
  state: '',
  caller_id: 0,
  group_id: 0,
  contract_id: 0
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

// **Odstrani dodatnega reševalca**
const removeResolver = (user: any) => {
  additionalResolvers.value = additionalResolvers.value.filter(r => r.id !== user.id);
};

// **Zunanja klik funkcija za zapiranje dropdownov**
const closeDropdowns = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest(".content-wrapper")) {
    Object.keys(showDropdowns.value).forEach(key => (showDropdowns.value[key as keyof typeof showDropdowns.value] = false));
  }
};

// **Shrani podatke**
const saveData = async () => {
  if (!selectedEngineer.value) {
    errorMessage.value = "Reševalec je obvezno polje!";
    return;
  }

  ticket.value.caller_id = selectedCaller.value?.id ?? 0;
  ticket.value.group_id = selectedGroup.value?.id ?? 0;
  ticket.value.contract_id = selectedContract.value?.id ?? 0;
  ticket.value.state = 'open';

  try {
    const createdUser = await createCustomTicket(ticket.value);
    await assignTicket({user_id: selectedEngineer.value.id, ticket_id: createdUser.ticket_id})
    
    additionalResolvers.value.forEach(async user => {
      await assignTicket({user_id: user.id, ticket_id: createdUser.ticket_id})
  });

    errorMessage.value = "Podatki uspešno shranjeni!";
  } catch (err) {
    console.error('Napaka pri ustvarjanju zahtevka:', err);
  } 
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

onMounted(() => {
  loadUsers();
  loadCompanies();
  loadContracts();
  loadGroups();

  document.addEventListener("click", closeDropdowns);
  document.removeEventListener("click", closeDropdowns)
});


</script>

<template>
  <div class="content-wrapper">
    <h2 class="header">Ustvari zahtevek po meri - NI PRAVA!!!!!</h2>

    <form @submit.prevent="saveData" class="ticket-form">
      <!-- Naslov (čez celo širino) -->
      <div class="form-group full-width">
        <label for="title">Naslov zahtevka</label>
        <input type="text" id="title" v-model="ticket.title" required />
      </div>

      <!-- Opis (čez celo širino) -->
      <div class="form-group full-width">
        <label for="description">Opis</label>
        <textarea id="description" v-model="ticket.description" required></textarea>
      </div>

      <div class="form-row">
        <!-- Klicatelj -->
        <div class="form-group">
          <label for="caller">Klicatelj</label>
            <input v-model="callerSearch" id="caller" @focus="showDropdowns.caller = true" required />
            <ul v-if="showDropdowns.caller">
              <li v-for="user in filteredUsers" :key="user.id" @click="selectCaller(user)">
                {{ user.name }}
            </li>
          </ul>
        </div>

        <!-- Podjetje -->
        <div class="form-group">
          <label for="company">Podjetje</label>
            <input v-model="companySearch" id="company" @focus="showDropdowns.company = true" required />
            <ul v-if="showDropdowns.company">
              <li v-for="company in filteredCompanies" :key="company.id" @click="selectCompany(company)">
                {{ company.name }}
              </li>
            </ul>
        </div>
      </div>

      <div class="form-row">
        <!-- Pogodba -->
        <div class="form-group">
          <label for="contract">Pogodba</label>
          <div class="dropdown-container">
          <input v-model="contractSearch" id="contract" @focus="showDropdowns.contract = true" type="text" placeholder="Iskanje pogodbe" required />
          <ul v-if="showDropdowns.contract">
            <li v-for="contract in filteredContracts" :key="contract.id" @click="selectContract(contract)">
              {{ contract.name }} - {{ contract.status }} | {{ contract.description }}
            </li>
          </ul>
        </div>
      </div>

        <!-- Inženir -->
        <div class="form-group">
          <label for="engineer">Reševalec</label>
          <input id="engineer" v-model="engineerSearch" @focus="showDropdowns.engineer = true" required/>
          <ul v-if="showDropdowns.engineer">
            <li v-for="user in filteredEngineers" :key="user.id" @click="selectEngineer(user)">
              {{ user.name }}
            </li>
          </ul>
        </div>
      </div>

      <div class="form-row">
        <!-- Impact -->
        <div class="form-group">
          <label for="impact">Vpliv</label>
          <select id="impact" v-model="ticket.impact">
            <option v-for="option in impactOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Urgency -->
        <div class="form-group">
          <label for="urgency">Nujnost</label>
          <select id="urgency" v-model="ticket.urgency">
            <option v-for="option in urgencyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="type">Tip zahtevka</label>
            <select id="type" v-model="ticket.type">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="group">Assigment group</label>
            <div class="dropdown-container">
            <input id="group" v-model="groupSearch" @focus="showDropdowns.group = true" type="text" placeholder="Iskanje skupine" required />
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
          <input type="text" id="parentTicket" v-model="ticket.parentTicket" />
        </div>
        <div class="form-group">
          <label>Dodatni reševalci</label>
            <div class="dropdown-container">
            <input v-model="resolverSearch" @focus="showDropdowns.additional = true" type="text" placeholder="Dodaj reševalca" />
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

      <button type="submit" class="submit-btn">Ustvari zahtevek</button>

    </form>
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

.header {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 20px;
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

/* Gumb */
.submit-btn {
  background-color: #00B0BE;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

/* Responsive design */
@media (max-width: 1000px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
