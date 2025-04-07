<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CSSProperties } from 'vue'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isToday from 'dayjs/plugin/isToday'
import { getMaintenancesForWeek } from '@/api/api'
import AddMaintenanceModal from '../components/maintanance_components/AddMaintenanceModal.vue'
import EditMaintenanceModal from '../components/maintanance_components/EditMaintenanceModal.vue'
import 'dayjs/locale/sl'
dayjs.locale('sl')

dayjs.extend(weekday)
dayjs.extend(isToday)

const currentWeekStart = ref(dayjs().weekday(0))
const events = ref<any[]>([])
const showAddModal = ref(false)

const selectedMaintenance = ref<any>(null)
const showEditModal = ref(false)

const openEditModal = (maintenance: any) => {
  selectedMaintenance.value = maintenance
  showEditModal.value = true
}

const refreshAfterEdit = async () => {
  await fetchEvents()
}

const fetchEvents = async () => {
  try {
    const data = await getMaintenancesForWeek(currentWeekStart.value.toISOString())
    events.value = data
  } catch (error) {
    console.error('Napaka pri nalaganju vzdrževanj:', error)
  }
}

onMounted(fetchEvents)

const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => currentWeekStart.value.add(i, 'day'))
)

const nextWeek = () => {
  currentWeekStart.value = currentWeekStart.value.add(7, 'day')
  fetchEvents()
}
const prevWeek = () => {
  currentWeekStart.value = currentWeekStart.value.subtract(7, 'day')
  fetchEvents()
}
const goToToday = () => {
  currentWeekStart.value = dayjs().weekday(0)
  fetchEvents()
}
const openAddModal = () => {
  showAddModal.value = true
}
const addNewMaintenance = (newItem: any) => {
  events.value.push(newItem)
  showAddModal.value = false
}

const getEventStyle = (event: any, index: number, groupSize: number, day: dayjs.Dayjs) => {
  const start = event.from.isAfter(day.startOf('day')) ? event.from : day.startOf('day')
  const end = dayjs(Math.min(event.to.valueOf(), day.endOf('day').valueOf()))

  const top = (start.hour() + start.minute() / 60) * 50
  const height = Math.max((end.diff(start, 'minute') / 60) * 50, 25)

  const width = groupSize === 1 ? 100 : 100 / groupSize
  const left = groupSize === 1 ? 0 : index * width

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `${left}%`,
    width: `${width}%`,
    position: 'absolute' as const,
    zIndex: 2,
  }
}

const getMultiDayStyle = (event: any) => {
  const from = dayjs(event.from_date)
  const to = dayjs(event.to_date)

  const dayWidth = 100 / 7

  const startOffset = Math.max(from.startOf('day').diff(currentWeekStart.value.startOf('day'), 'day'), 0)

  const endOffset = Math.min(to.startOf('day').diff(currentWeekStart.value.startOf('day'), 'day'), 6)

  const span = endOffset - startOffset + 1

  return {
    left: `${startOffset * dayWidth}%`,
    width: `${span * dayWidth}%`,
    position: 'absolute' as const,
  }
}

const getGroupedEventsForDay = (day: dayjs.Dayjs) => {
  const allEvents = events.value
    .filter(e =>
      dayjs(e.from_date).isBefore(day.endOf('day')) &&
      dayjs(e.to_date).isAfter(day.startOf('day')) &&
      dayjs(e.to_date).diff(dayjs(e.from_date), 'day') < 1
    )

    .map(e => {
      const from = dayjs(e.from_date)
      const to = dayjs(e.to_date)
      const height = Math.max((to.diff(from, 'minute') / 60) * 50, 25) // višina v px

      return {
        ...e,
        from,
        to,
        height
      }
    })
    .sort((a, b) => a.from.unix() - b.from.unix())

  const result: any[] = []

  while (allEvents.length > 0) {
    const currentGroup = [allEvents.shift()]

    let i = 0
    while (i < allEvents.length) {
      const next = allEvents[i]
      const overlaps = currentGroup.some(ev =>
        next.from.isBefore(ev.to) && next.to.isAfter(ev.from)
      )

      if (overlaps) {
        currentGroup.push(allEvents.splice(i, 1)[0])
      } else {
        i++
      }
    }

    result.push(currentGroup)
  }

  return result
}

const groupedMultiDayEvents = computed(() => {
  const filtered = events.value.filter(e =>
    dayjs(e.to_date).diff(dayjs(e.from_date), 'day') >= 1 &&
    // prikazuj le dogodke, ki se dotikajo tega tedna
    dayjs(e.from_date).isBefore(currentWeekStart.value.add(7, 'day')) &&
    dayjs(e.to_date).isAfter(currentWeekStart.value.startOf('day'))
  )

  const groups: any[][] = []

  filtered.sort((a, b) => dayjs(a.from_date).diff(dayjs(b.from_date)))

  filtered.forEach(event => {
    let placed = false
    for (const group of groups) {
      if (group.every(existing =>
        dayjs(event.from_date).isAfter(dayjs(existing.to_date)) ||
        dayjs(event.to_date).isBefore(dayjs(existing.from_date))
      )) {
        group.push(event)
        placed = true
        break
      }
    }
    if (!placed) groups.push([event])
  })

  return groups
})

</script>

<template>
  <div class="content-wrapper">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn day_buttons" @click="openAddModal">Dodaj dogodek</button>
      <div class="text-center">
        <h5 class="mb-0">Vzdrževalna dela</h5>
        <small>{{ currentWeekStart.format('D. MMM') }} – {{ currentWeekStart.add(6, 'day').format('D. MMM YYYY') }}</small>
      </div>
      <div>
        <button class="btn me-1 day_buttons" @click="goToToday">Danes</button>
        <button class="btn me-1 day_buttons" @click="prevWeek">&laquo;</button>
        <button class="btn day_buttons" @click="nextWeek">&raquo;</button>
      </div>
    </div>

    <!-- Koledar -->
    <div class="calendar">
      <!-- Glava z dnevi -->
      <div class="calendar-row header-row">
        <div class="time-col"></div>
        <div
          v-for="day in weekDays"
          :key="day.format('YYYY-MM-DD')"
          class="day-header"
          :class="{ today: day.isToday() }"
        >
          {{ day.format('ddd D') }}
        </div>
      </div>

      <!-- Večdnevni dogodki -->
      <div class="calendar-row multi-day-row" :style="{ height: `${groupedMultiDayEvents.length * 28}px` }">
        <div class="time-col">cel dan</div>
        <div class="multi-day-track">
        <div class="multi-day-background">
          <div v-for="(day, index) in weekDays" :key="index"
              class="multi-day-background-cell"
              :class="{ today: day.isToday() }">
          </div>
        </div>

        <div v-for="(group, groupIndex) in groupedMultiDayEvents" :key="groupIndex">
          <div
            v-for="event in group"
            :key="event.maintenance_id"
            class="multi-day-block"
            :style="{ ...getMultiDayStyle(event), top: `${groupIndex * 28}px` }"
            @click="openEditModal(event)"
          >
            {{ dayjs(event.from_date).format('DD.MM.YY') }} – {{ dayjs(event.to_date).format('DD.MM.YY') }}
            &nbsp;|&nbsp; {{ event.title }}
          </div>
        </div>
      </div>

      </div>


      <!-- Telo -->
      <div class="calendar-body">
        <div class="time-col">
          <div v-for="h in 24" :key="h" class="hour-cell">
            {{ String(h - 1).padStart(2, '0') }}:00
          </div>
        </div>

        <div class="days-grid">
          <div
            v-for="day in weekDays"
            :key="day.format()"
            class="day-col"
            :class="{ today: day.isToday() }"
            style="position: relative; min-height: 1200px;"
          >
            <div v-for="h in 24" :key="h" class="hour-cell"></div>

            <!-- Dogodki v dnevu -->
            <div
              v-for="(group, groupIndex) in getGroupedEventsForDay(day)"
              :key="`group-${groupIndex}`"
            >
              <div
                v-for="(event, i) in group"
                :key="event.maintenance_id"
                class="event-block"
                :style="getEventStyle(event, i, group.length, day)"
                :title="event.description"
                @click="openEditModal(event)"
              >
                <div v-if="event.height >= 40">
                  <strong>{{ event.from.format('HH:mm') }} – {{ event.to.format('HH:mm') }}</strong><br />
                </div>
                <div class="event-title">
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddMaintenanceModal v-if="showAddModal" @close="showAddModal = false" @added="addNewMaintenance" />
    <EditMaintenanceModal v-if="showEditModal" :maintenance="selectedMaintenance" @close="showEditModal = false" @updated="refreshAfterEdit" />

  </div>
</template>

<style scoped>
.content-wrapper {
  margin-left: 250px;
  padding: 20px;
  width: calc(100% - 250px);
  background-color: #fff;
}
@media (max-width: 768px) {
  .content-wrapper {
    margin-left: 0;
    width: 100%;
  }
}
.calendar {
  border: 1px solid #ccc;
  overflow-x: auto;
}
.calendar-row {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}
.header-row .day-header {
  background-color: #BCF180;
  font-weight: bold;
  padding: 6px;
  text-align: center;
  border-left: 1px solid #eee;
}
.header-row .today {
  background-color: #F9F871 !important;
}
.multi-day-row {
  height: 32px;
  position: relative;
}
.multi-day-block {
  position: absolute;
  background-color: #746EBC;
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 5px;
  top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid #fff;
}
.multi-day-block:hover {
  background-color: #5E5A8D;
  cursor: pointer;
}
.calendar-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}
.time-col {
  background: #f7f7f7;
  text-align: center;
}
.hour-cell {
  height: 50px;
  border-bottom: 1px solid #eee;
  font-size: 0.75rem;
  text-align: right;
  padding-right: 4px;
}
.days-grid {
  display: contents;
}
.day-col {
  position: relative;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
}
.event-block {
  background-color: #4DD6AA;
  color: black;
  font-size: 0.75rem;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid #fff;
  text-align: center;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
}
.event-block:hover {
  background-color: #3BBFA5;
  cursor: pointer;
}
.day-col.today {
  background-color: rgba(249, 248, 113, 0.15);
}
.multi-day-track {
  grid-column: span 7;
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  height: 100;
}

.event-time {
  font-weight: bold;
  font-size: 0.7rem;
  margin-bottom: 2px;
  overflow-wrap: break-word;
  white-space: normal;
}

.event-title {
  font-size: 0.75rem;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-word;
  display: block;
  line-height: 1.1;
}

.day_buttons {
  border-radius: 5px;
  border: none;
  background-color: #00B0BE;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}
.multi-day-background {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  height: 100%;
  width: 100%;
  z-index: 0; /* spodaj pod dogodki */
}

.multi-day-background-cell {
  background-color: transparent;
  border-left: 1px solid #eee;
  height: 100%;
}

.multi-day-background-cell.today {
  background-color: rgba(249, 248, 113, 0.15); /* svetlo rumena prosojna */
}

</style>
