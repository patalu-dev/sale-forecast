<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getSaturdaysInCycle, formatDateISO } from '@/lib/date-utils'
import { request } from '@/lib/api'
import { user } from '@/composables/authState'

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
  label?: string
  username?: string
  group?: string
  all?: boolean
}>()

const targetVal = ref(0)

const displayName = computed(() => props.label || user.value?.username || '-')

const allItems = computed<any[]>(() => [
  ...(props.forecastMain || []),
  ...(props.forecastException || []),
  ...(props.noForecast || []),
])

const fmt = (val: any) => {
  const num = Number(val || 0)
  return num === 0 ? '-' : new Intl.NumberFormat('en-US').format(num)
}

const dateColumns = computed(() => {
  const base = getSaturdaysInCycle(props.selectedDate)
  return base.map((c) => ({
    iso: formatDateISO(c.date),
    label: `${String(c.date.getDate()).padStart(2, '0')}/${String(c.date.getMonth() + 1).padStart(2, '0')}`,
  }))
})

const cycleStartISO = computed(() => props.cycle?.startDate?.split(' ')[0] || '')
const cycleEndISO = computed(() => props.cycle?.endDate?.split(' ')[0] || '')

const totalDays = computed(() => {
  if (!cycleStartISO.value || !cycleEndISO.value) return 0
  const s = new Date(cycleStartISO.value).getTime()
  const e = new Date(cycleEndISO.value).getTime()
  return Math.round((e - s) / 86400000) + 1
})

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
  } catch (err) {
    targetVal.value = 0
  }
}

onMounted(() => {
  fetchTarget()
})

watch(
  () => [props.cycle?.cycleMonth, props.username, props.group, props.all],
  () => {
    fetchTarget()
  },
)

const dayIndexFor = (iso: string) => {
  if (!cycleStartISO.value) return 0
  const s = new Date(cycleStartISO.value).getTime()
  const d = new Date(iso).getTime()
  return Math.round((d - s) / 86400000) + 1
}

const cutoffEndMs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}

const rowKpi = computed(() => dateColumns.value.map(() => fmt(targetVal.value)))

const rowTienDo = computed(() => {
  const t = targetVal.value
  return dateColumns.value.map((c) => {
    if (!t || !totalDays.value) return '-'
    const dayIdx = dayIndexFor(c.iso)
    return fmt(Math.round((t * dayIdx) / totalDays.value))
  })
})

const rowForecast = computed(() => {
  return dateColumns.value.map((c) => {
    const cutoff = cutoffEndMs(c.iso)
    const sum = allItems.value.reduce((acc, item) => {
      const created = new Date(item.createdAt).getTime()
      if (created <= cutoff) acc += Number(item.forecast || 0)
      return acc
    }, 0)
    return fmt(sum)
  })
})

const daySums = computed(() => {
  const sums: number[] = []
  for (let i = 1; i <= 7; i++) {
    const key = `day_${i}`
    sums.push(allItems.value.reduce((acc, item) => acc + Number(item[key] || 0), 0))
  }
  return sums
})

const rowPerformance = computed(() => {
  let acc = 0
  return dateColumns.value.map((_, colIdx) => {
    acc += daySums.value[colIdx] || 0
    return fmt(acc)
  })
})
</script>

<template>
  <div class="w-full md:w-1/2 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
        <thead class="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
          <tr>
            <th class="px-3 py-2 border-b whitespace-nowrap min-w-[120px]">{{ displayName }}</th>
            <th v-for="(c, i) in dateColumns" :key="c.iso"
              class="px-3 py-2 border-b whitespace-nowrap text-center">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">KPI</td>
            <td v-for="(v, i) in rowKpi" :key="i" class="px-3 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">Tiến độ KPI</td>
            <td v-for="(v, i) in rowTienDo" :key="i" class="px-3 py-3 text-center font-medium text-blue-700 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">Forecast</td>
            <td v-for="(v, i) in rowForecast" :key="i" class="px-3 py-3 text-center font-medium text-emerald-700 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">Performance</td>
            <td v-for="(v, i) in rowPerformance" :key="i" class="px-3 py-3 text-center font-medium text-amber-700 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>