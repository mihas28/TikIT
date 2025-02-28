<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import Sidebar from './components/Sidebar.vue';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
</script>

<template>
    <div class="app-container d-flex">
        <!-- Sidebar je prikazan samo, če uporabnik NI na login strani -->
        <Sidebar v-if="authStore.isAuthenticated && route.path !== '/login'" />
        
        <!-- Glavni vsebinski del -->
        <div class="content flex-grow-1">
            <router-view />
        </div>
    </div>
</template>

<style scoped>
.app-container {
    display: flex;
    height: 100vh;
}
/*.content {
    flex-grow: 1;
    padding: 20px;
    overflow-y: auto;
}*/
</style>
