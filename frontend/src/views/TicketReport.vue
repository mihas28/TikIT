<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTicketDetails, fetchComments, getAssignees } from '@/api/api'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const route = useRoute()
const ticketId = Number(route.params.id)

const ticket = ref<any>({})
const comments = ref<any[]>([])
const resolvers = ref<any[]>([])
const isLoading = ref(false);

const reportContent = ref<HTMLElement | null>(null)

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('sl-SI')
}

const formatSLADuration = (start: string, end: string) => {
  if (!start || !end) return 'Ni na voljo'

  const startDate = new Date(start)
  const endDate = new Date(end)

  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs < 0) return 'Ni na voljo'

  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  let result = ''
  if (days > 0) result += `${days} dni `
  if (hours > 0) result += `${hours} ur `
  if (minutes > 0) result += `${minutes} min`
  return result.trim()
}

onMounted(async () => {
  isLoading.value = true
  ticket.value = await fetchTicketDetails(ticketId.toString())
  comments.value = await fetchComments(ticketId)
  ticket.value = ticket.value.ticket;
  resolvers.value = await getAssignees(ticketId)
  isLoading.value = false
})

const generatePDF = async () => {
  if (!reportContent.value) return

  const element = reportContent.value

  const opt = {
    margin: [20, 15], // zgoraj/spodaj, levo/desno v mm
    filename: `porocilo-ticket-${ticket.value.ticket_id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  }

  const html2pdf = (await import('html2pdf.js')).default
  html2pdf().set(opt).from(element).save()
}

const totalHours = () => {
  return resolvers.value.reduce((total, resolver) => {
    return total + (resolver.time_worked || 0)
  }, 0)
}
</script>

<template>
  <div v-if="isLoading" class="content-wrapper">
    <p>Nalaganje poročila...</p>
  </div>

  <div v-if="!isLoading" class="content-wrapper">
    <div class="text-end mb-3 generate-button">
    <button class="btn btn-success" @click="generatePDF">Generiraj PDF poročilo</button>
  </div>

    <div ref="reportContent" id="report-content" class="report-box bg-white shadow-sm report-body">
      <!-- Glava z logotipom -->
      <div class="report-header text-center">
        <img src="./../assets/logo.svg" alt="TikIT logo" class="logo" />
        <h1 class="mb-1">Poročilo zahtevka</h1>
        <h4 class="text-muted">#{{ ticketId }}</h4>
      </div>

      <!-- Osnovne informacije -->
      <div class="section">
        <h3>Osnovne informacije</h3>
        <p class="comment-text"><strong>Naslov:</strong> {{ ticket.title }}</p>
        <p class="comment-text"><strong>Opis:</strong> {{ ticket.description }}</p>
        <p><strong>Vrsta:</strong> <span v-if="ticket.type = 'service request'">zahtevek</span><span v-else>{{ ticket.type }}</span></p>
        <p><strong>Vpliv:</strong> {{ ticket.impact }}</p>
        <p><strong>Nujnost:</strong> {{ ticket.urgency }}</p>
        <p v-if="ticket.parent_ticket_id"><strong>Starševski zahtevek:</strong> #{{ ticket.parent_ticket_id }}</p>
        <p><strong>Ustvarjen:</strong> {{ formatDate(ticket.created_at) }}</p>
        <p><strong>Zaključen:</strong> {{ formatDate(ticket.resolved_at) }}</p>
      </div>

      <!-- SLA -->
      <div class="section">
        <h3>SLA</h3>
        <p><strong>Čas do sprejema:</strong> {{ formatSLADuration(ticket.created_at, ticket.accepted_at) }}  </p>
        <p><strong>Čas do rešitve:</strong> {{ formatSLADuration(ticket.created_at, ticket.resolved_at) }} </p>
        <p v-if="ticket.accept_sla_breach">
          <strong>Kršitev sprejemnega SLA:</strong> {{ ticket.accept_sla_breach }}
        </p>
        <p v-if="ticket.sla_breach">
          <strong>Razlog:</strong> {{ ticket.sla_breach }}
        </p>
      </div>

      <!-- Reševalci -->
      <div class="section">
        <h3>Reševalci</h3>
        <ul>
          <li v-for="r in resolvers" :key="r.user_id">
            {{ r.resolver }} ({{ r.email }}) - <span v-if="r.primary_resolver">Primarni reševalec - </span><span v-else-if="!r.primary_resolver">Sekundarni reševalec - </span>Vpisanih {{ r.time_worked }} ur
          </li>
        </ul>
        <p><strong>Skupaj ur:</strong> {{ totalHours() }}</p>
      </div>

      <!-- Razrešitev -->
      <div class="section">
        <h3>Razrešitev</h3>
        <p><strong>Koda:</strong> {{ ticket.close_code || 'Ni navedena' }}</p>
        <p class="comment-text"><strong>Opombe:</strong> {{ ticket.close_notes || 'Ni opomb' }}</p>
      </div>

      <!-- Komunikacija -->
      <div class="section" v-if="comments.length">
        <h3>Komunikacija</h3>
        <!-- Seznam komentarjev -->
        <ul class="comment-list">
            <li v-for="comment in comments" :key="comment.created_at" :class="{
                'public-comment': comment.private === false,
                'private-comment': comment.private === true
            }">
            <strong>
                <i class="bi" :class="comment.private === false ? 'bi-globe' : 'bi-lock'"></i>
                {{ comment.name }}
                <span class="date">{{ formatDate(comment.created_at) }}</span>
            </strong>

            <br><br>

            <p v-if="comment.message && comment.message.type === 'text'" class="comment-text">
                {{ comment.message.content }}
            </p>

            <img v-else-if="comment.message.type === 'image'" :src="comment.message.content" style="max-width: 40%; border-radius: 5px;" />

            <a v-else class="file-link">
                <i class="bi bi-file-earmark-pdf"></i> {{ comment.message.filename || "Odpri dokument" }}
            </a>
            </li>
        </ul>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 20px;
  background-color: #f3f3f3;
}
.generate-button {
    position: fixed;
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    padding: 10px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    z-index: 1000; 
}
.report-body {
    position: relative;
    top: 40px;
}
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: 50px;
    margin-left: 0;
    width: 100%;
  }

  .generate-button {
      position: relative;
  }
  .report-body {
        position: relative;
        top: 0;
  }
}
.report-box {
  max-width: 850px;
  margin: 0 auto;
  padding: 30px;
  border-radius: 10px;
  background-color: #fff;
}
.report-header img.logo {
  width: 100px;
  margin-bottom: 10px;
}
.report-header h1 {
  font-size: 24px;
  margin-bottom: 4px;
}
.report-header h4 {
  font-weight: normal;
  color: #666;
}
.section {
  margin-top: 30px;
  page-break-inside: avoid;
}
.report-box {
  border-left: 5px solid #00B0BE;
}

.section h3 {
  border-left: 4px solid #00B0BE;
  padding-left: 10px;
  color: #00B0BE;
}

.section .comment-list {
    padding-left: 14px;
}

button.btn-success {
  background-color: #00B0BE;
  border-color: #00B0BE;
}

button.btn-success:hover {
  background-color: #0090a1;
}

.comment-list {
    list-style-type: none;
    padding: 0;
    margin-left: 0px;
    margin-right: 0px;
}
.public-comment {
  background-color: #e6f7ff;
  border-radius: 5px;
}

.private-comment {
  background-color: #fff3e6;
  border-radius: 5px;
}
.comment-text {
  white-space: pre-line; /* ohrani nove vrstice in omogoči prelom */
  word-break: break-word;
}
.file-link {
  display: block;
  margin-top: 5px;
  color: #00B0BE;
  text-decoration: none;
}
</style>
