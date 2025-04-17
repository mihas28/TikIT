<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted } from 'vue';
import { fetchWorkLog, saveWorkLog, createWorkLog } from '@/api/api';
import { de } from 'date-fns/locale';

const props = defineProps<{ ticketId: string; userId: string }>();
const emit = defineEmits(["close"]);

const numberOfHours = ref(0);
const description = ref('');
const error = ref<string | null>(null);

const newEntry = ref(false);

// **Funkcija za pridobitev obstoječih podatkov iz API-ja**
const loadWorkLog = async () => {
  try {
    const data = await fetchWorkLog(props.ticketId, props.userId);
    if (data.length === 0) 
    {
      newEntry.value = true;
      return;
    }

    numberOfHours.value = data[0].time_worked;
    description.value = data[0].description;
  
  } catch (err) {
    console.error("Napaka pri pridobivanju delovnega časa:", err);
  } 
};

// **Funkcija za shranjevanje delovnega časa**
const submitWorkLog = async () => {
  if (newEntry.value)
  {
    try {
      await createWorkLog({ticket_id: props.ticketId, user_id: props.userId, primary: null});
      newEntry.value = false;
    } catch (err) {
      error.value = "Napaka pri shranjevanju delovnega časa.";
      console.error(error.value, err);
    }
  }

  try {
    await saveWorkLog(props.ticketId, props.userId, {time_worked: numberOfHours.value, description: description.value});
    alert("Delovni čas uspešno posodobljen!");      
    emit("close");
  } catch (err) {
    error.value = "Napaka pri shranjevanju delovnega časa.";
    console.error(error.value, err);
  }
};

// **Ob nalaganju pridobi podatke iz API-ja**
onMounted(loadWorkLog);
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Vpiši število opravljenih ur za zahtevek ID: {{ ticketId }}</h3>
      <label>Trenutno število ur:</label>
      <input class="form-control" v-model="numberOfHours" type="number" placeholder="Vpiši ure..." />

      <label>Opis aktivnosti:</label>
      <textarea class="form-control" v-model="description" type="text" placeholder="Opiši podrobno kaj je bilo narejeno..." ></textarea>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="bt-close" @click="$emit('close')">Prekliči</button>
        <button class="bt-save" @click="submitWorkLog()">Shrani</button>
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

.bt-save {
  background-color: #4DD6AA;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px;
  cursor: pointer;
}

button, input, form, option, textarea { border-radius: 5px;}

textarea {
  width: 100%;
  height: 100px;
}

.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}
</style>
