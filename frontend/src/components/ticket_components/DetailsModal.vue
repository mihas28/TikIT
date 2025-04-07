<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { fetchUserDataById, fetchCompanyDataById, fetchContractDataById, fetchGroupDataById, openContractFile } from '@/api/api';

const props = defineProps<{ type: string; id: string }>();
const emit = defineEmits(['close']);
const details = ref<any>(null);
const isLoading = ref(true);

const text = ref("");

// **Formatiranje datuma**
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// **Funkcija za nalaganje podrobnosti**
const loadDetails = async () => {
  if (!props.type || !props.id) return;
  isLoading.value = true;

  try {
    switch (props.type) {
      case 'caller':
        details.value = await fetchUserDataById(props.id.toString());
        text.value = "klicatelja";
        break;
      case 'assignee':
        details.value = await fetchUserDataById(props.id.toString());
        text.value = "reševalca";
        break;
      case 'additional':
        details.value = await fetchUserDataById(props.id.toString());
        text.value = "pomožnega reševalca";
        break;
      case 'company':
        details.value = await fetchCompanyDataById(props.id.toString());
        text.value = "podjetja";
        break;
      case 'group':
        details.value = await fetchGroupDataById(props.id.toString());
        text.value = "skupine";
        break;
      case 'contract':
        details.value = await fetchContractDataById(props.id.toString());
        text.value = "pogodbe";
        break;
      default:
        console.warn('Neznan tip:', props.type);
        return;
    }
  } catch (error) {
    console.error(`Napaka pri pridobivanju podatkov (${props.type}, ID: ${props.id}):`, error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadDetails);
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Podrobnosti {{ text }}</h3>

      <div v-if="isLoading">Nalaganje...</div>
      <div v-else-if="details">
        <span v-if="props.type === 'caller' || props.type === 'assignee' || props.type === 'additional'">
            <label >Uporabnik:</label>
            <br>
            <input class="form-control" :value="details.first_name + ' ' + details.last_name" disabled />
            <br>
            <label >Uporabniško ime:</label>
            <br>
            <input class="form-control" :value="details.username" disabled />
            <br>
            <label >Vloga:</label>
            <br>
            <input class="form-control" :value="details.role" disabled />
            <br>
            <label >Elektronski naslov:</label>
            <br>
            <input class="form-control" :value="details.email" disabled />
            <br>
            <label >Telefonska številka:</label>
            <br>
            <input class="form-control" :value="details.phone_number" disabled />
        </span>
        <span v-if="props.type === 'company'">
            <label >Ime podjetja:</label>
            <br>
            <input class="form-control" :value="details.company_name" disabled />
            <br>
            <label >Elektronski naslov:</label>
            <br>
            <input class="form-control" :value="details.email" disabled />
            <br>
            <label >Telefonska številka:</label>
            <br>
            <input class="form-control" :value="details.phone" disabled />
            <br>
            <label >Naslov:</label>
            <br>
            <input class="form-control" :value="details.street" disabled />
            <br>
            <label >Poštna številka in mesto:</label>
            <br>
            <input class="form-control" :value="details.post_code + ' ' + details.city" disabled />
            <br>
            <label >Država:</label>
            <br>
            <input class="form-control" :value="details.country" disabled />
            <br>
            <label >Posebnosti:</label>
            <br>
            <textarea class="form-control" disabled>{{ details.notes }}</textarea>
        </span>
        <span v-if="props.type === 'group'">
            <label >Ime skupine:</label>
            <br>
            <input class="form-control" :value="details.group_name" disabled />
            <br>
            <label >Elektronski naslov:</label>
            <br>
            <input class="form-control" :value="details.email" disabled />       
            <br>
            <label >Podrobnosti skupine:</label>
            <br>
            <textarea class="form-control" disabled>{{ details.description }}</textarea>
        </span>
        <span v-if="props.type === 'contract'">
            <label >Kratek opis:</label>
            <br>
            <input class="form-control" :value="details.short_description" disabled />
            <br>
            <label >Status:</label>
            <br>
            <input class="form-control" :value="details.state" disabled />
            <br>
            <label >Začetek veljavnosti:</label>
            <br>
            <input class="form-control" :value="formatDate(details.start_date)" disabled />
            <br>
            <label >Konec veljavnosti:</label>
            <br>
            <input class="form-control" :value="formatDate(details.end_date)" disabled />
            <br>
            <label >Pogodba: </label>
            <i class="bi bi-file-earmark-pdf" @click="openContractFile(parseInt(props.id,10))"></i>
            <br>
            <label >Opis:</label>
            <br>
            <textarea class="form-control" disabled >{{ details.description }}</textarea>
        </span>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="bt-close" @click="emit('close')">Zapri</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}

.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
  border-radius: 5px;
}

textarea {
    width: 100%;
    height: 100px;
}

i:hover {
    cursor: pointer;
}

input {
    width: 100%;
}

</style>
