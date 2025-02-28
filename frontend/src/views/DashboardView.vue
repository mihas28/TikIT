<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const logout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<template>
    <div>
        <h1>Dashboard</h1>
        <button @click="logout">Odjava</button>
    </div>
</template>
