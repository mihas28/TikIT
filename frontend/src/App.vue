<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore';
import Sidebar from './components/Sidebar.vue';
import { useRoute, useRouter } from 'vue-router';
import { onMounted } from 'vue'

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

onMounted(() => { // Če je stran ponovno naložena
  router.isReady().then(() => {
    const isReload = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'reload'
    const path = router.currentRoute.value.path

    if (isReload && path !== '/login') {
      authStore.startAutoRefresh();
      authStore.startInactivityTracking();
    }
  })
})
</script>

<template>
    <div class="app-container d-flex">
        <!-- Sidebar je prikazan samo, če uporabnik NI na login strani -->
        <Sidebar v-if="authStore.isAuthenticated && route.path !== '/login'" />
        
        <!-- Glavni vsebinski del -->
        <div class="content flex-grow-1">
            <!-- Spremennjeno 21.3 za parent ticket id -->
            <router-view :key="Array.isArray($route.params.id) ? $route.params.id.join('-') : $route.params.id"></router-view>
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
