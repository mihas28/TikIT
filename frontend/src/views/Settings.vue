<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { fetchCurrentUserInfo, changePassword } from '@/api/api'
import { jwtDecode } from 'jwt-decode';

const user = ref<any>(null)
const authStore = useAuthStore()

const old_password = ref('')
const new_password = ref('')
const new_confirm_password = ref('')
const userId = ref();

const isLoading = ref(true);

const message = ref('')
const error = ref('')

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getUserIdFromJWT = () => {
  const authStore = useAuthStore();
  const token = authStore.accessToken; // Pridobi JWT iz Pinia

  if (!token) {
    console.error("JWT ni na voljo");
    return null;
  }

  try {
    const decoded: { userId?: string } = jwtDecode(token); // Dekodiraj JWT
    return decoded.userId || null; // Vrni `userId`
  } catch (error) {
    console.error("Napaka pri dekodiranju JWT:", error);
    return null;
  }
};

onMounted(async () => {
    isLoading.value = true;
    userId.value = getUserIdFromJWT() || ''
    user.value = await fetchCurrentUserInfo(Number(userId.value));
    isLoading.value = false;
})

const handlePasswordChange = async () => {
  message.value = ''
  error.value = ''

  if (!old_password.value || !new_password.value || !new_confirm_password.value) {
    error.value = 'Vsa polja morajo biti izpolnjena.'
    return
  }

  if (new_password.value !== new_confirm_password.value) {
    error.value = 'Novi gesli se ne ujemata.'
    return
  }

  try {
    const result = await changePassword(userId.value, old_password.value, new_password.value)

    message.value = 'Geslo je bilo uspešno posodobljeno, preusmerjeni boste na prijavno stran.'
    old_password.value = '';
    new_password.value = '';
    new_confirm_password.value = '';

    setTimeout(() => {
      authStore.logout();
    }, 5000)

  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Napaka pri menjavi gesla.'
    console.error(err)
  }
}

</script>

<template>
  <div v-if="isLoading" class="content-wrapper">
      <p>Nalaganje informacij o uporabniku...</p>
  </div>

  <div v-if="!isLoading" class="content-wrapper">
    <h2 class="mb-4">Informacije o uporabniku</h2>

    <div class="row">
      <div class="col-lg-6 mb-3">
        <label>Uporabniško ime</label>
        <input type="text" class="form-control" :value="user?.username" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Elektronski naslov</label>
        <input type="email" class="form-control" :value="user?.email" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Ime</label>
        <input type="text" class="form-control" :value="user?.first_name" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Priimek</label>
        <input type="text" class="form-control" :value="user?.last_name" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Elektronski naslov</label>
        <input type="text" class="form-control" :value="user?.email" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Telefonska številka</label>
        <input type="text" class="form-control" :value="user?.phone_number" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Vloga</label>
        <input type="text" class="form-control" :value="user?.role" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Datum ustvarjanja računa</label>
        <input type="text" class="form-control" :value="formatDate(user?.created_at)" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Podjetje</label>
        <input type="text" class="form-control" :value="user?.company_name" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Naslov podjetja</label>
        <input type="text" class="form-control" :value="user?.company_location" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Skupina</label>
        <input type="text" class="form-control" :value="user?.group_name" disabled />
      </div>
      <div class="col-lg-6 mb-3">
        <label>Elektronski naslov skupine</label>
        <input type="text" class="form-control" :value="user?.group_email" disabled />
      </div>
    </div>

    <hr class="my-4" />

    <div class="row">
      <div class="col-lg-4 mb-3"></div>
      <div class="col-lg-4">
        <h5 class="mb-3">Sprememba gesla</h5>
      </div>
      <div class="col-lg-4 mb-3"></div>
    </div>
    <div class="row">
        <div class="col-lg-4 mb-3"></div>
        <div v-if="message" class="alert alert-success mt-3 col-lg-4">{{ message }}</div>
        <div v-if="error" class="alert alert-danger mt-3 col-lg-4">{{ error }}</div>
        <div class="col-lg-4 mb-3"></div>
    </div>
    <div class="row">
      <div class="col-lg-4 mb-3"></div>
      <div class="col-lg-4 mb-3">
        <label>Trenutno geslo</label>
        <input placeholder="Vnesi trenutno geslo" type="password" class="form-control" v-model="old_password" />
      </div>
      <div class="col-lg-4 mb-3"></div>
    </div>
    <div class="row">
      <div class="col-lg-4 mb-3"></div>
      <div class="col-lg-4 mb-3">
        <label>Novo geslo</label>
        <input placeholder="Vnesi novo geslo" type="password" class="form-control" v-model="new_password" />
      </div>
      <div class="col-lg-4 mb-3"></div>
    </div>
    <div class="row">
     <div class="col-lg-4 mb-3"></div>
      <div class="col-lg-4 mb-3">
        <label>Ponovi novo geslo</label>
        <input placeholder="Ponovno vnesi novo geslo" type="password" class="form-control" v-model="new_confirm_password" />
      </div>
      <div class="col-lg-4 mb-3"></div>
    </div>

    <div class="row">
      <div class="col-lg-4 mb-3"></div>
      <div class="col-lg-4 mb-3 text-end">
        <button class="btn save_password" @click="handlePasswordChange">Shrani spremembe</button>
      </div>
      <div class="col-lg-4 mb-3"></div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 20px;
  width: calc(100% - 250px);
}
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: 50px;
    margin-left: 0;
    width: 100%;
  }
}
input, button {
  border-radius: 5px;
}
.save_password {
  border-radius: 5px;
  border: none;
  background-color: #00B0BE;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}
</style>
