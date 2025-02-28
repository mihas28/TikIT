<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(false);

// Navigacijske postavke glede na vlogo uporabnika
const menuItems = ref([
    // **Meni za vse uporabnike**
    { name: 'Nastavitve', icon: 'bi-gear', path: '/settings', roles: ['user', 'operator', 'admin'] },
    { name: 'Moji zahtevki', icon: 'bi-list-check', path: '/my-tickets', roles: ['user', 'operator', 'admin'] },
    { name: 'Ustvari zahtevek', icon: 'bi-plus-circle', path: '/create-ticket', roles: ['user', 'operator', 'admin'] },

    // **Operatorji in admini**
    { name: 'Ustvari zahtevek po meri', icon: 'bi-pencil-square', path: '/custom-ticket', roles: ['operator', 'admin'] },
    { name: 'Moji dodeljeni zahtevki', icon: 'bi-clipboard-check', path: '/assigned-tickets', roles: ['operator', 'admin'] },
    { name: 'Vsi zahtevki', icon: 'bi-folder', path: '/all-tickets', roles: ['operator', 'admin'] },
    { name: 'Podjetja', icon: 'bi-building', path: '/companies', roles: ['operator', 'admin'] },
    { name: 'Pogodbe', icon: 'bi-file-earmark-text', path: '/contracts', roles: ['operator', 'admin'] },
    { name: 'Koledar vzdrževanj', icon: 'bi-calendar', path: '/maintenance-calendar', roles: ['operator', 'admin'] },
    { name: 'Statistike', icon: 'bi-bar-chart-line', path: '/statistics', roles: ['operator', 'admin'] },

    // **Samo admini**
    { name: 'Urejanje sistema', icon: 'bi-tools', path: '/admin-panel', roles: ['admin'] },
]);

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};

// Expose to template
defineExpose({ menuItems, isSidebarOpen, toggleSidebar, logout, authStore });
</script>

<template>
    <!-- Hamburger menu (viden samo na mobilnih napravah) -->
    <button class="hamburger-menu d-md-none" @click="toggleSidebar">
        <i class="bi bi-list"></i>
    </button>

    <!-- Sidebar -->
    <div :class="['sidebar', { 'sidebar-open': isSidebarOpen }]">
        <div class="sidebar-header">
            <h3 class="text-white">TikIT</h3>
        </div>
        <ul class="nav flex-column">
            <span v-for="(item, index) in menuItems" :key="index">
                <li v-if="item.roles.includes(authStore.userRole)">
                    <router-link :to="item.path" class="nav-link" @click="isSidebarOpen = false">
                        <i :class="`bi ${item.icon}`"></i>
                        <span>{{ item.name }}</span>
                    </router-link>
                </li>
            </span>
        </ul>
        <div class="logout">
            <button class="btn btn-danger w-100" @click="logout">
                <i class="bi bi-box-arrow-right"></i> Odjava
            </button>
        </div>
    </div>
</template>

<style scoped>
/* Stranska navigacija (sidebar) */
.sidebar {
    width: 250px;
    background-color: #00B0BE;
    color: white;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 10px;
    position: fixed;
    left: 0;
    top: 0;
    transition: transform 0.3s ease-in-out;
}

/* Skrij sidebar na mobilnih napravah, razen če je odprt */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }
    .sidebar.sidebar-open {
        transform: translateX(0);
    }
}

/* Hamburger menu */
.hamburger-menu {
    position: fixed;
    top: 15px;
    left: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: white;
    z-index: 1000;
    cursor: pointer;
}

/* Navigacijske povezave */
.nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
    text-decoration: none;
    padding: 10px;
}
.nav-link:hover {
    background-color: #11C4B9;
    border-radius: 5px;
}

/* Gumb za odjavo */
.logout {
    margin-top: auto;
    padding: 10px;
}
</style>
