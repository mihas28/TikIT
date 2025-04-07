<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { fetchTicketDataCreate, updateMaintenance } from '@/api/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'

const TIMEZONE = import.meta.env.TIMEZONE || 'Europe/Ljubljana';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Ljubljana');

const props = defineProps<{
  maintenance: any
}>()

const emit = defineEmits(['close', 'updated'])

const title = ref('')
const description = ref('')
const fromDate = ref('')
const toDate = ref('')
const note = ref('')
const ticketId = ref<number | undefined>(undefined);
const tickets = ref<any[]>([])

onMounted(async () => {
  tickets.value = await fetchTicketDataCreate();
})

watch(
  () => props.maintenance,
  () => {
    title.value = props.maintenance.title
    description.value = props.maintenance.description
    note.value = props.maintenance.note
    fromDate.value = dayjs(props.maintenance.from_date).format('YYYY-MM-DDTHH:mm')
    toDate.value = dayjs(props.maintenance.to_date).format('YYYY-MM-DDTHH:mm')
    ticketId.value = props.maintenance.ticket_id ?? undefined
  },
  { immediate: true }
)

const submit = async () => {
  if (!title.value || !fromDate.value || !toDate.value) return
  if (toDate.value < fromDate.value) {
    alert('Končni datum ne sme biti pred začetnim!')
    return
  }

  await updateMaintenance(props.maintenance.maintenance_id, {
    title: title.value,
    description: description.value,
    from_date: fromDate.value,
    to_date: toDate.value,
    note: note.value,
    ticket_id: ticketId.value ?? null,
  })

  emit('updated')
  emit('close')
}
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal-content">
      <h5>Uredi vzdrževalni dogodek</h5>

      <div class="form-group">
        <label>ID dogodka</label>
        <input disabled v-model="props.maintenance.maintenance_id" class="form-control" />
      </div>

      <div class="form-group">
        <label>Naslov</label>
        <input v-model="title" class="form-control" />
      </div>

      <div class="form-group">
        <label>Opis</label>
        <textarea v-model="description" class="form-control" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Začetek</label>
        <input type="datetime-local" v-model="fromDate" class="form-control" />
      </div>

      <div class="form-group">
        <label>Konec</label>
        <input type="datetime-local" v-model="toDate" class="form-control" />
      </div>

      <div class="form-group">
        <label>Posebnosti</label>
        <textarea v-model="note" class="form-control" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Izberi zahtevek</label>
        <select v-model.number="ticketId" class="form-control">
            <option :value="undefined">Brez zahtevka</option>
            <option
                v-for="ticket in tickets"
                :key="ticket.id"
                :value="ticket.id"
            >
                [{{ ticket.id }}] {{ ticket.name }}
            </option>
        </select>
      </div>
      <div v-if="ticketId" class="form-group">
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
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
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
