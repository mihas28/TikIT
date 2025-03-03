<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { updateUser, fetchCompanyData, fetchGroups } from '../../api/api';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
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

const emit = defineEmits(['close', 'save']);

// **Funkcija za shranjevanje sprememb uporabnika**
const saveUserChanges = async () => {
  if (!props.user.user_id) {
    error.value = 'Manjka ID uporabnika!';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const selectedCompany = companies.value.find(c => c.company_id === props.user.company_id);
    const selectedGroup = groups.value.find(g => g.group_id === props.user.group_id);

    if (selectedCompany) props.user.company_name = selectedCompany.company_name;
    if (selectedGroup) props.user.group_name = selectedGroup.group_name;

    await updateUser(props.user.user_id, props.user);
    emit('save', props.user);
    emit('close');
  } catch (err) {
    console.error('Napaka pri posodabljanju uporabnika:', err);
    error.value = 'Napaka pri posodabljanju uporabnika.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi uporabnika</h3>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <label>Uporabniško ime:</label>
      <input v-model="user.username" type="text" />
      
      <label>Email:</label>
      <input v-model="user.email" type="email" />

      <label>Ime:</label>
      <input v-model="user.first_name" type="email" />

      <label>Priimek:</label>
      <input v-model="user.last_name" type="email" />

      <label>Telefon:</label>
      <input v-model="user.phone_number" type="email" />
      
      <label>Vloga:</label>
      <select v-model="user.role">
        <option value="user">Uporabnik</option>
        <option value="operator">Operater</option>
        <option value="admin">Skrbnik</option>
      </select>

      <label>Podjetje:</label>
      <select v-model="user.company_id">
          <option v-for="company in companies" :key="company.company_id" :value="company.company_id">{{ company.company_name }}</option>
      </select>

      <label>Skupina:</label>
      <select v-model="user.group_id">
          <option v-for="group in groups" :key="group.group_id" :value="group.group_id">{{ group.group_name }}</option>   
      </select>

      <button class="bt-save" @click="saveUserChanges" :disabled="isLoading">
        {{ isLoading ? 'Shranjevanje...' : 'Shrani' }}
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

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
}
</style>