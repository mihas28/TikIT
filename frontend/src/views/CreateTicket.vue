<script setup lang="ts">
// **Uvozi potrebne stvari**
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore';
import { fetchUserEssentialDataById, createTicket } from '@/api/api';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'vue-router'
const router = useRouter()

// ** Trenutni uporabnik
const currentUserId = ref<string>('');

// **Podatki o uporabniku (klicatelju)**
const callerName = ref('');
const callerCompany = ref('');
const groupList = ref('');
const contract = ref('');

// **Polja za ustvarjanje ticketa**
const title = ref('')
const description = ref('')
const priority = ref('P3') // privzeta prioriteta
const type = ref('incident') // privzeti tip

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

// **Pridobi uporabniške podatke ob prikazu**
onMounted(async () => {
  try {
    currentUserId.value = getUserIdFromJWT() || '';

    const userData = await fetchUserEssentialDataById(currentUserId.value);
    callerName.value = userData.full_name;
    callerCompany.value = userData.company_name;
    contract.value = userData.contract_id;
    groupList.value = userData.group_id;

  } catch (err) {
    console.error('Napaka pri pridobivanju uporabnika:', err);
  }
})

// **Oddaj ticket**
const submitTicket = async () => {
  try {
    const createdTicket = await createTicket({
      title: title.value,
      description: description.value,
      priority: priority.value,
      type: type.value,
      caller_id: currentUserId.value,
      group_id: groupList.value,
      contract_id: contract.value
    })
    router.push({ name: 'TicketUser', params: { id: createdTicket.ticket_id } });
  } catch (err) {
    console.error('Napaka pri oddaji zahtevka:', err)
  }
}
</script>

<template>
  <div class="content-wrapper">
    <h2 class="header">Ustvari nov zahtevek</h2>

    <form @submit.prevent="submitTicket" class="ticket-form">
      <div class="form-row">
        <!-- Klicatelj -->
        <div class="form-group">
          <label>Klicatelj</label>
          <input type="text" class="form-control" :value="callerName" disabled />
        </div>

        <!-- Podjetje -->
        <div class="form-group">
          <label>Podjetje</label>
          <input type="text" class="form-control" :value="callerCompany" disabled />
        </div>
      </div>

      <div class="form-row">
        <!-- Tip zahtevka -->
        <div class="form-group">
          <label>Tip zahtevka</label>
          <select class="form-control" v-model="type">
            <option value="incident">Incident</option>
            <option value="zahteva">Zahteva</option>
          </select>
          <small class="form-text text-muted">
            Incident je nepričakovana motnja, zahteva pa je npr. prošnja za dostop ali spremembo.
          </small>
        </div>

        <!-- Prioriteta -->
        <div class="form-group">
          <label>Prioriteta</label>
          <select class="form-control" v-model="priority">
            <option value="P1">P1 - Kritična (nujna takojšnja reakcija)</option>
            <option value="P2">P2 - Visoka (resna motnja)</option>
            <option value="P3">P3 - Srednja (standardna zahteva)</option>
            <option value="P4">P4 - Nizka (manjše težave ali vprašanja)</option>
          </select>
          <small class="form-text text-muted">
            Izberite prioriteto glede na vpliv in nujnost vaše zahteve. P3 je standardna privzeta vrednost.
          </small>
        </div>
      </div>

      <!-- Naslov (čez celo širino) -->
      <div class="form-group full-width">
        <label>Naslov zahtevka</label>
        <input type="text" class="form-control" v-model="title" placeholder="Opišite vašo zahtevo na kratko..." />
      </div>

      <!-- Opis (čez celo širino) -->
      <div class="form-group full-width">
        <label>Opis</label>
        <textarea class="form-control" rows="5" v-model="description" placeholder="Opišite vašo zahtevo podrobneje..." />
      </div> 

      <button class="submit-btn">Ustvari zahtevek</button>

    </form>
  </div>
</template>

<style scoped>

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

input, textarea, select, button {
  border-radius: 5px;
}

.header {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

/* Postavitev dveh stolpcev */
.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.full-width {
  width: 100%;
}

label {
  display: block;
  font-weight: bold;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border-radius: 5px;
}

/* Gumb */
.submit-btn {
  background-color: #00B0BE;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}

/* Responsive design */
@media (max-width: 1000px) {
  .form-row {
    flex-direction: column;
  }
}

</style>