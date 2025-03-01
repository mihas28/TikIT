<script setup lang="ts">
import { ref, computed } from 'vue';
import EditModal from '@/components/EditModal.vue';
import AddModal from '@/components/AddModal.vue';

const users = ref([
  { user_id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
  { user_id: 2, username: 'user1', email: 'user1@example.com', role: 'user' }
]);

const searchQuery = ref('');
const selectedUser = ref(null);
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);

// Filtriraj uporabnike glede na iskanje
const filteredUsers = computed(() =>
  users.value.filter(user =>
    Object.values(user).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  )
);

const openEditModal = (user: any) => {
  selectedUser.value = user;
  isEditModalOpen.value = true;
};

const openAddModal = () => {
  isAddModalOpen.value = true;
};
</script>

<template>
  <div>
    <h3>Uporabniki</h3>
    <input type="text" v-model="searchQuery" placeholder="Išči uporabnike..." />

    <table>
      <thead>
        <tr>
          <th>Uporabniško ime</th>
          <th>Email</th>
          <th>Vloga</th>
          <th>Dejanja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.user_id">
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>
            <button class="btn-edit" @click="openEditModal(user)">Uredi</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novega</button>
    
    <EditModal v-if="isEditModalOpen" :item="selectedUser" @close="isEditModalOpen = false" />
    <AddModal v-if="isAddModalOpen" @close="isAddModalOpen = false" />
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
}

button, input {
  border-radius: 5px;
}

.btn-edit {
  background-color: #f0ad4e;
  color: white;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
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
