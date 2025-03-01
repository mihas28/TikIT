<script setup lang="ts">
import { ref, computed } from 'vue';
import EditGroupModal from './EditGroupModal.vue';
import AddGroupModal from './AddGroupModal.vue';

const groups = ref([
  {
    group_id: 1,
    name: 'Skupina 1',
    description: 'Opis skupine 1',
    email: 'skupina1@example.com',
    leader: 'Vodja 1'
  },
  // Dodaj več skupin po potrebi
]);

const searchQuery = ref('');
const selectedGroup = ref<Record<string, any> | undefined>({});
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);

// Filtriraj skupine glede na iskalni niz
const filteredGroups = computed(() =>
  groups.value.filter(group =>
    Object.values(group).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  )
);

const openEditModal = (group: any) => {
  selectedGroup.value = group;
  isEditModalOpen.value = true;
};

const openAddModal = () => {
  isAddModalOpen.value = true;
};
</script>

<template>
  <div>
    <h3>Skupine</h3>
    <input type="text" v-model="searchQuery" placeholder="Išči skupine..." />

    <table>
      <thead>
        <tr>
          <th>Ime</th>
          <th>Opis</th>
          <th>Email</th>
          <th>Vodja</th>
          <th>Dejanja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in filteredGroups" :key="group.group_id">
          <td>{{ group.name }}</td>
          <td>{{ group.description }}</td>
          <td>{{ group.email }}</td>
          <td>{{ group.leader }}</td>
          <td>
            <button class="btn-edit" @click="openEditModal(group)">Uredi</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novo skupino</button>

    <EditGroupModal v-if="isEditModalOpen" :group="selectedGroup" @close="isEditModalOpen = false" />
    <AddGroupModal v-if="isAddModalOpen" @close="isAddModalOpen = false" />
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
