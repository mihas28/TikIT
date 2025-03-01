<script setup lang="ts">
import { ref, computed } from 'vue';
import UserList from '@/components/UserList.vue';
import CompanyList from '../components/CompanyList.vue';
import GroupList from '../components/GroupList.vue';

const activeTab = ref('users');

// Preklop med zavihki
const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div class="admin-panel content-wrapper">
    <h2>Urejanje sistema</h2>
    <nav class="nav-tabs">
      <button @click="setActiveTab('users')" :class="{ active: activeTab === 'users' }">Uporabniki</button>
      <button @click="setActiveTab('companies')" :class="{ active: activeTab === 'companies' }">Podjetja</button>
      <button @click="setActiveTab('groups')" :class="{ active: activeTab === 'groups' }">Skupine</button>
    </nav>

    <div class="tab-content">
      <UserList v-if="activeTab === 'users'" />
      <CompanyList v-if="activeTab === 'companies'" />
      <GroupList v-if="activeTab === 'groups'" />
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

.admin-panel {
  padding: 20px;
}

.nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.nav-tabs button {
  padding: 10px;
  border: none;
  background: #00B0BE;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.nav-tabs .active {
  background: #4DD6AA;
}
</style>
