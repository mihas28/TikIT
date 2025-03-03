<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EditGroup from './EditGroup.vue';
import AddGroup from './AddGroup.vue';
import { fetchGroups } from '@/api/api';

interface Group {
  group_id: number;
  group_name: string;
  description: string;
  email: string;
}

const groups = ref<Group[]>([]);
const searchQuery = ref('');
const selectedGroup = ref<Record<string, any>>({});
const isEditModalOpen = ref(false);
const isAddModalOpen = ref(false);
const sortKey = ref<keyof Group | null>(null);
const sortOrder = ref<'asc' | 'desc'>('asc');

// **Funkcija za nalaganje skupin**
const loadGroups = async () => {
  try {
    groups.value = await fetchGroups();
  } catch (error) {
    console.error('Napaka pri nalaganju skupin:', error);
  }
};

onMounted(() => {
  loadGroups();
});

// **Filtriranje skupin**
const filteredGroups = computed(() => {
  return groups.value.filter(group =>
    Object.values(group).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

// **Sortiranje skupin**
const sortedGroups = computed(() => {
  if (!sortKey.value) return filteredGroups.value;
  return [...filteredGroups.value].sort((a, b) => {
    if (!sortKey.value) return 0;
    const valueA = a[sortKey.value] as string;
    const valueB = b[sortKey.value] as string;
    return (sortOrder.value === 'asc' ? 1 : -1) * valueA.localeCompare(valueB);
  });
});

const sortBy = (key: keyof Group) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const addGroupToList = (newGroup: Group) => {
  groups.value.push(newGroup);
  isAddModalOpen.value = false;
};

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
          <th @click="sortBy('group_name')">Ime skupine {{ sortKey === 'group_name' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('description')">Opis {{ sortKey === 'description' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th @click="sortBy('email')">Email {{ sortKey === 'email' ? (sortOrder === 'asc' ? '▲' : '▼') : '' }}</th>
          <th>Dejanja</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in sortedGroups" :key="group.group_id">
          <td>{{ group.group_name }}</td>
          <td>{{ group.description }}</td>
          <td>{{ group.email }}</td>
          <td>
            <button class="btn-edit" @click="openEditModal(group)">Uredi</button>
          </td>
        </tr>
      </tbody>
    </table>

    <button class="btn-add" @click="openAddModal">Dodaj novo skupino</button>

    <EditGroup v-if="isEditModalOpen" :group="selectedGroup" @close="isEditModalOpen = false" />
    <AddGroup v-if="isAddModalOpen" @close="isAddModalOpen = false" @add="addGroupToList" />
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
