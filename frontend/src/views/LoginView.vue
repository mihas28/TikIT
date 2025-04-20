<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const errorMessage = ref('');

onMounted(() => {
  if (authStore.accessToken && authStore.isAccessTokenValid()) {
    router.push('/dashboard');
  }
})

const login = async () => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            username: username.value,
            password: password.value
        });

        const { accessToken, refreshToken } = response.data;

        authStore.login(accessToken, refreshToken);
        router.push('/dashboard');
    } catch (error) {
        errorMessage.value = 'Napaka pri prijavi. Preverite uporabniško ime in geslo.';
    }
};

</script>

<template>
    <div class="login-container d-flex align-items-center justify-content-center vh-100">
        <div class="card p-4 shadow-lg">
            <div class="card-body">
                <h2 class="text-center mb-4">Prijava v TikIT</h2>
                <form @submit.prevent="login">
                    <div class="mb-3">
                        <label for="username" class="form-label">Uporabniško ime</label>
                        <input type="text" id="username" class="form-control" v-model="username" required />
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Geslo</label>
                        <input type="password" id="password" class="form-control" v-model="password" required />
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Prijava</button>
                </form>
                <p v-if="errorMessage" class="text-danger text-center mt-3">{{ errorMessage }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    background: linear-gradient(135deg, #00B0BE, #4DD6AA);
    width: 100%;
    height: 100vh;
}
.card {
    width: 350px;
    background-color: white;
    border-radius: 10px;
}
.btn-primary {
    background-color: #746EBC;
    border: none;
}
.btn-primary:hover {
    background-color: #994F97;
}
</style>
