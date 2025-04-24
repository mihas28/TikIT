<script setup lang="ts">
import { ref, defineEmits, onMounted } from 'vue';
import { fetchCompanyData, fetchGroups, createUser } from '@/api/api';

const emit = defineEmits(['close', 'add']);

const newUser = ref({
  username: '',
  email: '',
  role: '',
  company_id: '',
  group_id: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  password: '',
  password2: '',
  user_id: '',
  company_name: '',
  group_name: ''
});

const isLoading = ref(false);
const error = ref<string | null>(null);

interface Group {
  group_id: number;
  group_name: string;
}

const groups = ref<Group[]>([]);
interface Company {
  company_id: number;
  company_name: string;
}

const companies = ref<Company[]>([]);

// **Funkcija za nalaganje skupin**
const loadGroups = async () => {
  try {
    groups.value = await fetchGroups();
  } catch (error) {
    console.error('Napaka pri nalaganju skupin:', error);
  }
};

// **Funkcija za nalaganje podjetij**
const loadCompanies = async () => {
  try {
    companies.value = await fetchCompanyData();
  } catch (error) {
    console.error('Napaka pri nalaganju podjetij:', error);
  }
};

onMounted(() => {
  loadGroups();
  loadCompanies();
});

// **Funkcija za dodajanje uporabnika**
const handleAddUser = async () => {
  if (!newUser.value.username || !newUser.value.email || !newUser.value.first_name || !newUser.value.last_name || !newUser.value.phone_number || !newUser.value.role || !newUser.value.company_id || !newUser.value.group_id || !newUser.value.password || !newUser.value.password2) {
    error.value = 'Vsa polja so obvezna!';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newUser.value.email)) {
    error.value = 'Neveljaven email uporabnika';
    return;
  }

  if (newUser.value.password !== newUser.value.password2) {
    error.value = 'Gesli se ne ujemata!';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Poišči podjetje in skupino glede na ID in shrani imena
    const selectedCompany = companies.value.find(c => c.company_id === Number(newUser.value.company_id));
    const selectedGroup = groups.value.find(g => g.group_id === Number(newUser.value.group_id));

    newUser.value.company_name = selectedCompany ? selectedCompany.company_name : '';
    newUser.value.group_name = selectedGroup ? selectedGroup.group_name : '';

    const createdUser = await createUser(newUser.value);
    newUser.value.user_id = createdUser.newUser.user_id;
    
    emit('add', newUser.value);
    emit('close');
  } catch (err) {
    console.error('Napaka pri dodajanju uporabnika:', err);
    error.value = 'Napaka pri dodajanju uporabnika.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Dodaj uporabnika</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Uporabniško ime:</label>
      <input type="text" v-model="newUser.username" />
      
      <label>Email:</label>
      <input type="text" v-model="newUser.email" />

      <label>Ime:</label>
      <input type="text" v-model="newUser.first_name" />

      <label>Priimek:</label>
      <input type="text" v-model="newUser.last_name" />

      <label>Telefon:</label>
      <input type="text" v-model="newUser.phone_number" />

      <label>Vloga:</label>
      <select v-model="newUser.role">
        <option value="user">Uporabnik</option>
        <option value="operator">Operater</option>
        <option value="admin">Skrbnik</option>
      </select>

      <label>Podjetje:</label>
      <select v-model="newUser.company_id">
          <option v-for="company in companies" :key="company.company_id" :value="company.company_id">{{ company.company_name }}</option>
      </select>

      <label>Skupina:</label>
      <select v-model="newUser.group_id">
          <option v-for="group in groups" :key="group.group_id" :value="group.group_id">{{ group.group_name }}</option>   
      </select>

      <label>Geslo:</label>
      <input type="password" v-model="newUser.password" />

      <label>Ponovi geslo:</label>
      <input type="password" v-model="newUser.password2" />

      <button class="bt-save" @click="handleAddUser" :disabled="isLoading">
        {{ isLoading ? 'Dodajanje...' : 'Dodaj' }}
      </button>
      <button class="bt-close" @click="$emit('close')">Zapri</button>
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