<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

import {
  getTicketStatusStats,
  getTicketPriorityStats,
  getTicketTypeStats,
  getGlobalStatistics,
  getResolverTypeStats,
  getCompaniesTypeStats,
  getMonthlyTicketStats 
} from '@/api/api'

ChartJS.register(
  Title, Tooltip, Legend,
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale
)

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'   

const summaryRef = ref<HTMLElement | null>(null)

const datum = new Date().toLocaleString('sl-SI', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const isLoading = ref(false);

const summaryPrintRef = ref<HTMLElement | null>(null)

const exportSummaryToPDF = async () => {
  const el = summaryPrintRef.value
  if (!el) return

  // začasno pokaži, če je skrito
  el.style.display = 'block'

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`statistika-${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (err) {
    console.error('Napaka pri generiranju PDF:', err)
  } finally {
    el.style.display = 'none'
  }
}

// Slovenski prevodi
const statusLabels = {
  new: 'Nov',
  open: 'Odprt',
  'awaiting info': 'V čakanju',
  resolved: 'Razrešen',
  closed: 'Zaključen',
  cancelled: 'Preklican'
}
const priorityLabels = {
  P1: 'P1 – Kritično',
  P2: 'P2 – Visoko',
  P3: 'P3 – Srednje',
  P4: 'P4 – Nizko'
}
const typeLabels = {
  incident: 'Incident',
  'service request': 'Zahteva'
}

// Utility funkcija za osnovni bar chart
const makeBarChart = (labelsMap: Record<string, string>, dataObj: Record<string, number>) => ({
  data: {
    labels: Object.keys(labelsMap).map(k => labelsMap[k]),
    datasets: [
      {
        label: 'Število zahtevkov',
        data: Object.keys(labelsMap).map(k => dataObj[k] || 0),
        backgroundColor: '#00B0BE'
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { color: '#333' }, grid: { color: '#eee' } },
      x: { ticks: { color: '#333' }, grid: { color: '#eee' } }
    }
  }
})

// Charts
const statusChart = ref()
const priorityChart = ref()
const typeChart = ref()
const topResolversChart = ref()
const topCompaniesChart = ref()
const monthlyChart = ref()
const globalSummary = ref('')

onMounted(async () => {
  isLoading.value = true
  const [status, priority, types, resolvers, companies, monthly]: [
    Record<string, number>,
    Record<string, { total: number; breached: number }>,
    Record<string, number>,
    Array<{ resolver: string; resolved_count: number }>,
    Array<{ company_name: string; total: number }>,
    Array<{ month: string; count: number }>
  ] = await Promise.all([
    getTicketStatusStats(),
    getTicketPriorityStats(),
    getTicketTypeStats(),
    getResolverTypeStats(),
    getCompaniesTypeStats(),
    getMonthlyTicketStats()
  ])

  statusChart.value = makeBarChart(statusLabels, status)

  const priorityKeys = Object.keys(priorityLabels) as Array<keyof typeof priorityLabels>
  priorityChart.value = {
    data: {
      labels: priorityKeys.map(p => priorityLabels[p]),
      datasets: [
        {
          label: 'Skupaj',
          data: priorityKeys.map(p => priority[p]?.total || 0),
          backgroundColor: '#00B0BE'
        },
        {
          label: 'Prekršeni SLA za sprejetje',
          data: priorityKeys.map(p => priority[p]?.breached || 0),
          backgroundColor: '#A63264'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { ticks: { color: '#333' }, grid: { color: '#eee' } },
        x: { ticks: { color: '#333' }, grid: { color: '#eee' } }
      }
    }
  }

  typeChart.value = makeBarChart(typeLabels, types)

  topResolversChart.value = {
    data: {
      labels: resolvers.map(r => r.resolver),
      datasets: [{
        label: 'Število dodeljenih zahtevkov',
        data: resolvers.map(r => r.resolved_count),
        backgroundColor: '#00B0BE'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: '#333' }, grid: { color: '#eee' } },
        x: { ticks: { color: '#333' }, grid: { color: '#eee' } }
      }
    }
  }

  topCompaniesChart.value = {
    data: {
      labels: companies.map(c => c.company_name),
      datasets: [{
        label: 'Število klicanih zahtevkov',
        data: companies.map(c => c.total),
        backgroundColor: '#00B0BE'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: '#333' }, grid: { color: '#eee' } },
        x: { ticks: { color: '#333' }, grid: { color: '#eee' } }
      }
    }
  }

  monthlyChart.value = {
    data: {
      labels: monthly.map(m => m.month),
      datasets: [
        {
          type: 'bar',
          label: 'Zahtevki po mesecih',
          data: monthly.map(m => m.count),
          backgroundColor: '#00B0BE'
        },
        {
          type: 'line',
          label: 'Trend po mesecih',
          data: monthly.map(m => m.count),
          borderColor: '#A63264',
          borderWidth: 2,
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: false,
          text: '',
          color: '#333',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#333' },
          grid: { color: '#eee' }
        },
        x: {
          ticks: { color: '#333' },
          grid: { color: '#eee' }
        }
      }
    }
  }

  const global = await getGlobalStatistics()

globalSummary.value = `
    V sistemu TikIT je trenutno ${global.total_tickets} zahtevkov.
    Sistem uporablja ${global.total_users} uporabnikov.
    Število skupin: ${global.total_groups}

    Zabeleženih je ${global.total_worklogs} vnosov delovnega časa. 
    Skupaj vnešenih ur: ${global.total_hours}, skupaj vnešenih ur ta mesec: ${global.monthly_worklogs}, skupaj vnešenih ur ta teden: ${global.weekly_worklogs}.

    Registriranih je ${global.total_companies} podjetij s skupaj ${global.total_contracts} aktivnimi pogodbami.

    Trenutno stanje zahtevkov:
    – Novi: ${global.new_tickets}
    – Odprti: ${global.open_tickets}
    – Čakajo na informacije: ${global.waiting_tickets}
    – Razrešeni: ${global.resolved_tickets}
    – Zaključeni: ${global.closed_tickets}
    – Preklicani: ${global.cancelled_tickets}

    Razmerje tipov zahtevkov:
    – Incidenti: ${global.total_incidents}
    – Zahteve: ${global.total_requests}

    SLA statistika:
    – Povprečen čas do sprejema: ${Math.floor(global.avg_accept_min / 60)}h ${global.avg_accept_min % 60}min
    – Povprečen čas do razrešitve: ${Math.floor(global.avg_resolve_min / 60)}h ${global.avg_resolve_min % 60}min
    – Prekrški SLA pri sprejemu: ${global.accept_breaches}

    Od vseh zahtevkov je ${global.p1_count} imelo kritično prioriteto (P1).

    Število vzdrževanj v tekočem tednu: ${global.weekly_maintenance_count}
`
  isLoading.value = false

})
</script>


<template>

  <div v-if="isLoading" class="content-wrapper">
    <p>Nalaganje pogleda za statistiko...</p>
  </div>

  <div v-if="!isLoading" class="content-wrapper">
    <h4 class="mb-4">Statistika zahtevkov</h4>

    <div class="chart-grid">
      <div class="chart-card" v-if="statusChart">
        <h5 class="chart-title">Zahtevki po statusu</h5>
        <Bar :data="statusChart.data" :options="statusChart.options" />
      </div>

      <div class="chart-card" v-if="priorityChart">
        <h5 class="chart-title">Zahtevki po prioriteti in SLA</h5>
        <Bar :data="priorityChart.data" :options="priorityChart.options" />
      </div>

      <div class="chart-card" v-if="typeChart">
        <h5 class="chart-title">Zahtevki po tipu</h5>
        <Bar :data="typeChart.data" :options="typeChart.options" />
      </div>

      <div class="chart-card" v-if="topResolversChart">
        <h5 class="chart-title">Top 5 reševalcev</h5>
        <Bar :data="topResolversChart.data" :options="topResolversChart.options" />
      </div>

      <div class="chart-card" v-if="topCompaniesChart">
        <h5 class="chart-title">Top 5 podjetij</h5>
        <Bar :data="topCompaniesChart.data" :options="topCompaniesChart.options" />
      </div>

      <div class="chart-card" v-if="monthlyChart">
        <h5 class="chart-title">Število novih zahtevkov po mesecih</h5>
        <Bar :data="monthlyChart.data" :options="monthlyChart.options" />
      </div>
    </div>

    <!-- Viden del z gumbom -->
    <div class="stat-summary-container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h5 class="stat-summary-title">📌 Podroben statistični povzetek</h5>
        <button class="btn btn-sm btn-success" @click="exportSummaryToPDF">
          Izvozi kot PDF
        </button>
      </div>
      <p class="text-muted mt-2">
        <i class="bi bi-calendar3"></i> Statistika ustvarjena dne {{ datum }}
      </p>
      <p class="stat-summary-text">{{ globalSummary }}</p>
    </div>

    <!-- Skrit del za izvoz -->
    <div ref="summaryPrintRef" class="print-summary">
      <h4 style="color:#00B0BE;">📌 Podroben statistični povzetek</h4>
      <p class="text-muted mt-2"><i class="bi bi-calendar3"></i> Statistika ustvarjena dne {{ datum }}</p>
      <p class="stat-summary-text">{{ globalSummary }}</p>
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

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-weight: bold;
  margin-bottom: 15px;
  color: #00B0BE;
  text-align: center;
}

.stat-summary-container {
  background-color: #f9f9f9;
  padding: 25px;
  border-left: 6px solid #00B0BE;
  border-radius: 6px;
  max-width: 100%;
  box-shadow: 0 0 6px rgba(0,0,0,0.06);
}

.stat-summary-title {
  color: #00B0BE;
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.stat-summary-text {
  white-space: pre-wrap;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.6;
}

button.btn-success {
  background-color: #00B0BE;
  border-color: #00B0BE;
}

.print-summary {
  display: none;
  background-color: #fff;
  color: #000;
  padding: 30px;
  max-width: 100%;
  font-size: 14px;
  line-height: 1.6;
}

@media print {
  .print-summary {
    display: block;
  }
}

</style>
