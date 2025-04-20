<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { onMounted } from 'vue';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.getUserRole === 'user') {
    router.replace('/my-tickets');
  }
  else if (authStore.getUserRole === 'operator') {
    router.replace('/assigned-tickets');
  } else if (authStore.getUserRole === 'admin') {
    router.replace('/all-tickets');
  } else {
    router.replace('/login');
  }
});

</script>

<template>

</template>
