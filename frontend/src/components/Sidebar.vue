<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(false);

// Pridobimo vlogo uporabnika iz JWT tokena
const userRole = authStore.getUserRole;

// Navigacijske postavke glede na vlogo uporabnika
const menuItems = ref([
    { name: 'Nastavitve', icon: 'bi-gear', path: '/settings', roles: ['user', 'operator', 'admin'] },
    { name: 'Moji zahtevki', icon: 'bi-list-check', path: '/my-tickets', roles: ['user'] },
    { name: 'Ustvari zahtevek', icon: 'bi-plus-circle', path: '/create-ticket', roles: ['user'] },

    { name: 'Ustvari zahtevek po meri', icon: 'bi-pencil-square', path: '/custom-ticket', roles: ['operator', 'admin'] },
    { name: 'Moji dodeljeni zahtevki', icon: 'bi-clipboard-check', path: '/assigned-tickets', roles: ['operator', 'admin'] },
    { name: 'Vsi zahtevki', icon: 'bi-folder', path: '/all-tickets', roles: ['operator', 'admin'] },
    { name: 'Poročila zahtevkov', icon: 'bi-file-earmark-text', path: '/report', roles: ['operator', 'admin'] },
    { name: 'Poročila podjetij', icon: 'bi-building', path: '/companies', roles: ['operator', 'admin'] },
    { name: 'Koledar vzdrževanj', icon: 'bi-calendar', path: '/maintenance-calendar', roles: ['operator', 'admin'] },
    { name: 'Statistike', icon: 'bi-bar-chart-line', path: '/statistics', roles: ['operator', 'admin'] },

    { name: 'Urejanje sistema', icon: 'bi-tools', path: '/admin-panel', roles: ['admin'] },
]);

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
    isSidebarOpen.value = false;
};

const logout = () => {
    authStore.logout();
    router.push('/login');
};

// Expose to template
defineExpose({ menuItems, isSidebarOpen, toggleSidebar, closeSidebar, logout, authStore });
</script>

<template>
    <!-- Navbar zgoraj na mobilnih napravah -->
    <div class="top-bar d-md-none">
        <img class="img-navbar" src="../assets/TikIT-logo.svg" alt="TikIT"/>
        <button class="hamburger-menu" @click="toggleSidebar">
            <i class="bi bi-list"></i>
        </button>
    </div>

    <!-- Overlay, ki zatemni ozadje, ko je sidebar odprt -->
    <div v-if="isSidebarOpen" class="overlay" @click="closeSidebar"></div>

    <!-- Sidebar -->
    <div :class="['sidebar', { 'sidebar-open': isSidebarOpen }]">
        <div class="sidebar-header d-none d-md-flex">
            <img class="img-sidebar" src="../assets/TikIT-logo.svg" alt="TikIT"/>
        </div>
        <ul class="nav flex-column">
            <span v-for="(item, index) in menuItems" :key="index">
                <li v-if="item.roles.includes(userRole)">
                    <router-link :to="item.path" class="nav-link" @click="closeSidebar">
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
/* Sidebar */
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
    z-index: 1050;
}

/* Top bar (mobilna verzija) */
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #00B0BE;
    position: fixed;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 1100;
}

/* Sidebar header (prikazan samo na desktop) */
.sidebar-header {
    padding: 10px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Overlay za zatemnitev ozadja, ko je sidebar odprt */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1049;
}

/* Skrij sidebar na mobilnih napravah, razen če je odprt */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }
    .sidebar.sidebar-open {
        transform: translateX(0);
    }

    .flex-column {
        margin-top: 55px;
    }
}

/* Hamburger menu */
.hamburger-menu {
    background: none;
    border: none;
    font-size: 24px;
    color: white;
    cursor: pointer;
    z-index: 1101;
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

img {
    display: block;
}

.img-navbar {
    width: 100px;
}

.img-sidebar {
    width: 80%;
}

</style>
