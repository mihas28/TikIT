<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchTicketDataCreate, addMaintenance } from '@/api/api';

const emit = defineEmits(['close', 'added'])

const title = ref('')
const description = ref('')
const from = ref('')
const to = ref('')
const note = ref('')
const ticketId = ref<number | null>(null)
const tickets = ref<any[]>([])

onMounted(async () => {
  tickets.value = await fetchTicketDataCreate();
})

const submit = async () => {
  if (!title.value || !from.value || !to.value) return
  if (to.value < from.value) {
    alert('Končni datum ne sme biti pred začetnim!')
    return
  }

  const newMaintenance = {
    maintenance_id: null,
    title: title.value,
    description: description.value,
    from_date: from.value,
    to_date: to.value,
    note: note.value,
    ticket_id: ticketId.value || null,
  }

  newMaintenance.maintenance_id = (await addMaintenance(newMaintenance)).maintenance_id;

  emit('added', newMaintenance);
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-window p-4 bg-white rounded">
      <h5 class="mb-3">Dodaj nov vzdrževalni dogodek</h5>

      <div class="mb-2">
        <label>Naslov</label>
        <input v-model="title" type="text" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Opis</label>
        <textarea v-model="description" class="form-control" rows="3" type="text"></textarea>
      </div>
      <div class="mb-2">
        <label>Od</label>
        <input v-model="from" type="datetime-local" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Do</label>
        <input v-model="to" type="datetime-local" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Posebnosti</label>
        <textarea v-model="note" type="text" class="form-control" rows="3"></textarea>
      </div>
      <div class="mb-2">
        <label>Izberi zahtevek</label>
        <select v-model="ticketId" class="form-control">
          <option :value="null">Brez zahtevka</option>
          <option v-for="ticket in tickets" :key="ticket.id" :value="ticket.id">
            [{{ ticket.id }}] {{ ticket.name }}
          </option>
        </select>
      </div>
      <div v-if="ticketId" class="mb-2">
        <a :href="`/ticket/${ticketId}`" target="_blank" class="btn btn-link p-0">
             Odpri povezani zahtevek
        </a>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="bt-close" @click="$emit('close')">Prekliči</button>
        <button class="bt-save" @click="submit">Shrani</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-window {
  width: 500px;
  max-width: 95%;
}
.bt-save {
  background-color: #4DD6AA;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
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
</style>
