<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EditUser from './EditUser.vue';
import AddUser from './AddUser.vue';
import ChangePassword1 from './ChangePassword1.vue';
import { fetchUsers } from '@/api/api'; 

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  company_name: string;
  group_name: string;
}

const users = ref<User[]>([]);
const searchQuery = ref('');
const selectedUser = ref<Record<string, any>>({});
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);
const isChangePasswordModalOpen = ref(false);
const sortColumn = ref<string | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');
const isLoading = ref(false);

// **Funkcija za nalaganje uporabnikov**
const loadUsers = async () => {
  try {
    isLoading.value = true;
    users.value = await fetchUsers();
  } catch (error) {
    console.error('Napaka pri nalaganju uporabnikov:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});

// **Filtriranje uporabnikov**
const filteredUsers = computed(() => {
  let sortedUsers = [...users.value];

  if (sortColumn.value) {
    sortedUsers.sort((a: any, b: any) => {
      const valA = a[sortColumn.value!].toString().toLowerCase();
      const valB = b[sortColumn.value!].toString().toLowerCase();

      if (sortDirection.value === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });
  }

  return sortedUsers.filter(user =>
    Object.values(user).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

// **Funkcija za urejanje uporabnikov**
const addUserToList = (newUser: User) => {
  users.value.push(newUser);
  isAddModalOpen.value = false;
};

// **Funkcija za razvrščanje**
const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

const openEditModal = (user: any) => {
  selectedUser.value = user;
  isEditModalOpen.value = true;
};

const openAddModal = () => {
  isAddModalOpen.value = true;
};

const openChangePasswordModal = (user: any) => {
  selectedUser.value = user;
  isChangePasswordModalOpen.value = true;
};
</script>

<template>

  <div v-if="isLoading">
    <p>Nalaganje uporabnikov...</p>
  </div>

  <div v-if="!isLoading">
    <h3>Uporabniki</h3>
    <input type="text" v-model="searchQuery" placeholder="Išči uporabnike..." />

    <table>
      <thead>
        <tr>
          <th @click="sortBy('username')">Uporabniško ime
            <span v-if="sortColumn === 'username'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortBy('email')">Email
            <span v-if="sortColumn === 'email'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortBy('role')">Vloga
            <span v-if="sortColumn === 'role'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortBy('company_name')">Podjetje
            <span v-if="sortColumn === 'company_name'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th @click="sortBy('group_name')">Skupina
            <span v-if="sortColumn === 'group_name'">
              {{ sortDirection === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
          <th>Dejanja</th>
          <th>Spremeni geslo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.user_id">
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.company_name }}</td>
          <td>{{ user.group_name }}</td>
          <td>
            <button class="btn-edit" @click="openEditModal(user)">Uredi</button>
          </td>
          <td>
            <button class="btn-pass" @click="openChangePasswordModal(user)">Spremeni geslo</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novega uporabnika</button>

    <EditUser v-if="isEditModalOpen" :user="selectedUser" @close="isEditModalOpen = false" />
    <AddUser v-if="isAddModalOpen" @close="isAddModalOpen = false" @add="addUserToList"/>
    <ChangePassword1 v-if="isChangePasswordModalOpen" :user="selectedUser" @close="isChangePasswordModalOpen = false" />
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
th:hover {
  background-color: #f0f0f0;
}
.btn-edit {
  background-color: #f0ad4e;
  color: white;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
}
.btn-pass {
  background-color: #5bc0de;
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
