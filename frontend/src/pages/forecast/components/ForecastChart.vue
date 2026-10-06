<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { Chart as ChartComponent } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { getSaturdaysInCycle, formatDateISO } from '@/lib/date-utils'
import { request } from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const props = defineProps<{
  selectedDate?: string
  cycle?: {
    startDate?: string
    endDate?: string
    label?: string
    cycleMonth?: string
  }
  forecastMain?: any[]
  forecastException?: any[]
  noForecast?: any[]
  username?: string
  group?: string
  all?: boolean
}>()

const targetVal = ref(0)

const allItems = computed<any[]>(() => [
  ...(props.forecastMain || []),
  ...(props.forecastException || []),
  ...(props.noForecast || []),
])

const fetchTarget = async () => {
  const month = props.cycle?.cycleMonth
  if (!month) return
  try {
    // Group/P.KD: KPI = tổng target (group hoặc toàn bộ) trong tháng
    if (props.all || props.group) {
      const q = new URLSearchParams({ month })
      if (props.all) q.append('all', 'true')
      else if (props.group) q.append('group', props.group)
      const res = await request(`/targets/sum?${q.toString()}`)
      if (res.ok) {
        const data = await res.json()
        targetVal.value = Number(data?.target || 0)
      }
      return
    }
    const q = new URLSearchParams({ month })
    if (props.username) q.append('username', props.username)
    const res = await request(`/targets/by-period?${q.toString()}`)
    if (res.ok) {
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      targetVal.value = Number(data?.target || 0)
    }
  } catch { targetVal.value = 0 }
}

onMounted(() => fetchTarget())
watch(() => [props.cycle?.cycleMonth, props.username, props.group, props.all], () => fetchTarget())

const cycleStartISO = computed(() => props.cycle?.startDate?.split(' ')[0] || '')
const cycleEndISO = computed(() => props.cycle?.endDate?.split(' ')[0] || '')
const totalDays = computed(() => {
  if (!cycleStartISO.value || !cycleEndISO.value) return 0
  return Math.round((new Date(cycleEndISO.value).getTime() - new Date(cycleStartISO.value).getTime()) / 86400000) + 1
})

const dayIndexFor = (iso: string) => {
  if (!cycleStartISO.value) return 0
  const s = new Date(cycleStartISO.value).getTime()
  const d = new Date(iso).getTime()
  return Math.round((d - s) / 86400000) + 1
}

const dateColumns = computed(() => {
  return getSaturdaysInCycle(props.selectedDate).map((c) => ({
    iso: formatDateISO(c.date),
    label: `${String(c.date.getDate()).padStart(2, '0')}/${String(c.date.getMonth() + 1).padStart(2, '0')}`,
  }))
})

const cutoffEndMs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}

const chartData = computed(() => {
  const cols = dateColumns.value
  const t = targetVal.value

  const daySums: number[] = []
  for (let i = 1; i <= 7; i++) {
    const key = `day_${i}`
    daySums.push(allItems.value.reduce((a, it) => a + Number(it[key] || 0), 0))
  }

  let perfAcc = 0
  const forecastArr: number[] = []
  const perfArr: number[] = []
  const kpiArr: number[] = []
  const tienDoArr: number[] = []

  cols.forEach((c, idx) => {
    const cutoff = cutoffEndMs(c.iso)
    const dayIdx = dayIndexFor(c.iso)

    forecastArr.push(allItems.value.reduce((a, it) => {
      if (new Date(it.createdAt).getTime() <= cutoff) a += Number(it.forecast || 0)
      return a
    }, 0))

    perfAcc += daySums[idx] || 0
    perfArr.push(perfAcc)
    kpiArr.push(t)
    tienDoArr.push(t && totalDays.value ? Math.round((t * dayIdx) / totalDays.value) : 0)
  })

  return {
    labels: cols.map((c) => c.label),
    datasets: [
      { label: 'Forecast', data: forecastArr, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: 'rgba(16,185,129,1)', borderWidth: 1, order: 2, yAxisID: 'y' },
      { label: 'Performance', data: perfArr, backgroundColor: 'rgba(245,158,11,0.7)', borderColor: 'rgba(245,158,11,1)', borderWidth: 1, order: 2, yAxisID: 'y' },
      { label: 'KPI', data: kpiArr, type: 'line' as const, borderColor: 'rgba(139,92,246,1)', backgroundColor: 'rgba(139,92,246,0.1)', pointRadius: 4, pointBackgroundColor: 'rgba(139,92,246,1)', tension: 0.3, borderWidth: 2, fill: false, order: 1, yAxisID: 'y' },
      { label: 'Tiến độ KPI', data: tienDoArr, type: 'line' as const, borderColor: 'rgba(59,130,246,1)', backgroundColor: 'rgba(59,130,246,0.1)', pointRadius: 4, pointBackgroundColor: 'rgba(59,130,246,1)', tension: 0.3, borderWidth: 2, borderDash: [6, 3], fill: false, order: 1, yAxisID: 'y' },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'bottom' as const, labels: { padding: 12, usePointStyle: true, font: { size: 11 } } },
    tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${Number(ctx.raw || 0).toLocaleString('en-US')}` } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { stepSize: 100000, callback: (v: any) => Number(v).toLocaleString('en-US') }, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
}))
</script>

<template>
  <div class="w-full md:w-1/2 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs p-4 flex flex-col">
    <h3 class="text-sm font-bold text-slate-700 mb-3">Biểu đồ dự báo</h3>
    <div class="flex-1 min-h-[200px]">
      <ChartComponent type="bar" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
