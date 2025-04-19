<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import html2pdf from 'html2pdf.js'

import {
  fetchCompanyDataById,
  getCompanyTicketsWithinPeriod,
  getTimeWorkedForCompanyTickets
} from '@/api/api'

const route = useRoute()
const companyId = Number(route.params.id)

const reportRef = ref<HTMLElement | null>(null)

const company = ref<any>({})
const tickets = ref<{ ticket_id: number; title: string; description: string; type: string; priority: string; state: keyof typeof statusLabels; created_at: string; resolved_at: string }[]>([])
const timeEntries = ref<any[]>([])
    const isLoading = ref(false);

const today = dayjs()
const oneMonthAgo = dayjs().subtract(1, 'month')

const totalHours = computed(() => {
  return timeEntries.value.reduce((acc, entry) => acc + (entry.hours || 0), 0)
})

const statusLabels = {
  new: 'Novo',
  open: 'Odprto',
  'awaiting info': 'V čakanju',
  resolved: 'Razrešeno',
  closed: 'Zaključeno',
  cancelled: 'Preklicano'
}

onMounted(async () => {
  isLoading.value = true;
  company.value = await fetchCompanyDataById(String(companyId))
  tickets.value = await getCompanyTicketsWithinPeriod(companyId, oneMonthAgo.format('YYYY-MM-DD'), today.format('YYYY-MM-DD'))
  timeEntries.value = await getTimeWorkedForCompanyTickets(companyId, oneMonthAgo.format('YYYY-MM-DD'), today.format('YYYY-MM-DD'))
  isLoading.value = false;
})

const getTicketTimeLogs = (ticketId: number) => {
  return timeEntries.value.filter(entry => entry.ticket_id === ticketId)
}

const formatDate = (date: string) => {
  if (!date) 
    return 'Zahtevek še ni bil razrešen';

  return dayjs(date).format('DD. MM. YYYY')
}

const exportToPDF = () => {
  const element = reportRef.value

  const opt = {
    margin:       0.3,
    filename:     `porocilo-podjetja-${company.value.company_name}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  {
      scale: 2,
      scrollX: 0,
      scrollY: -window.scrollY,
      useCORS: true
    },
    jsPDF:        {
      unit: 'cm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  html2pdf().from(element).set(opt).save()
}

</script>

<template>

  <div v-if="isLoading" class="content-wrapper">
      <p>Nalaganje poročila...</p>
  </div>

  <div class="content-wrapper">

    <div class="text-end mb-3">
        <button class="btn btn-success" @click="exportToPDF">Generiraj PDF poročilo</button>
    </div>

    <div class="report-box" ref="reportRef">
      <div class="report-header text-center mb-4">
        <img src="@/assets/logo.svg" class="logo mb-2" />
        <h2>Mesečno poročilo podjetja</h2>
        <h4 class="text-muted">{{ company.company_name }}</h4>
        <p class="text-secondary">Obdobje: {{ formatDate(oneMonthAgo.toISOString()) }} – {{ formatDate(today.toISOString()) }}</p>
      </div>

      <div class="section">
        <h5>Osnovni podatki</h5>
        <p><strong>Email:</strong> {{ company.email }}</p>
        <p><strong>Telefon:</strong> {{ company.phone }}</p>
        <p><strong>Naslov:</strong> {{ company.street }}, {{ company.post_code }}, {{ company.city }}</p>
        <p><strong>Država:</strong> {{ company.country }}</p>
      </div>

      <div class="section mt-4">
        <h5>Razrešeni zahtevki v obdobju</h5>
        <div v-if="tickets.length === 0">
          <p>V izbranem obdobju ni bilo razrešenih zahtevkov.</p>
        </div>
        <div v-else>
          <div v-for="ticket in tickets" :key="ticket.ticket_id" class="ticket-block mb-4 page-break-avoid">
            <p><strong>#{{ ticket.ticket_id }}</strong> – {{ ticket.title }}</p>
            <p><strong>Opis:</strong> {{ ticket.description }}</p>
            <p><strong>Tip:</strong> {{ ticket.type }} | <strong>Prioriteta:</strong> {{ ticket.priority }} | <strong>Stanje:</strong> {{ statusLabels[ticket.state] }}</p>
            <p><strong>Ustvarjen:</strong> {{ formatDate(ticket.created_at) }} | <strong>Razrešen:</strong> {{ formatDate(ticket.resolved_at) }}</p>

            <p class="mt-2" v-if="ticket.state != 'new'"><strong>Poraba ur:</strong></p>
            <ul>
              <li v-for="log in getTicketTimeLogs(ticket.ticket_id)" :key="log.time_worked_id">
                {{ log.resolver }} <span v-if="log.primary_resolver">(primarni reševalec)</span><span v-else-if="!log.primary_resolver">(sekundarni reševalec)</span> – {{ log.hours }} ur – <i>{{ log.description || 'Brez opisa' }}</i>
              </li>
            </ul>
            <p><strong>Skupaj ur za ta zahtevek:</strong> {{ getTicketTimeLogs(ticket.ticket_id).reduce((acc, l) => acc + (l.hours || 0), 0) }} ur</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h5>Skupno število ur v obdobju: {{ totalHours }} ur</h5>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 20px;
  background-color: #f9f9f9;
}
.report-box {
  max-width: 1000px;
  margin: auto;
  padding: 30px;
  background-color: white;
  border-left: 5px solid #00B0BE;
  border-radius: 8px;
}
.report-header img.logo {
  height: 80px;
}
.section {
  margin-top: 30px;
}
.ticket-block {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  background: #f5f5f5;
}
button.btn-success {
  background-color: #00B0BE;
  border-color: #00B0BE;
}
.page-break-avoid {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}


</style>
