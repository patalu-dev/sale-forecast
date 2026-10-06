<script setup lang="ts">
import { computed } from 'vue'
import { getSaturdaysInCycle, formatDateISO } from '@/lib/date-utils'

const props = defineProps<{
  selectedDate?: string
  label?: string
  forecasts?: any[]
}>()

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

const cutoffEndMs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}

const items = computed<any[]>(() => props.forecasts || [])

const rowForecast = computed(() => {
  return dateColumns.value.map((c) => {
    const cutoff = cutoffEndMs(c.iso)
    const sum = items.value.reduce((acc, item) => {
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
    sums.push(items.value.reduce((acc, item) => acc + Number(item[key] || 0), 0))
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
  <div class="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
        <thead class="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
          <tr>
            <th class="px-3 py-2 border-b whitespace-nowrap min-w-[120px]"></th>
            <th v-for="c in dateColumns" :key="c.iso"
              class="px-3 py-2 border-b whitespace-nowrap text-center">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">Forecast</td>
            <td v-for="(v, idx) in rowForecast" :key="idx" class="px-3 py-3 text-center font-medium text-emerald-700 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
          <tr>
            <td class="px-3 py-2 font-semibold text-slate-700">Performance</td>
            <td v-for="(v, idx) in rowPerformance" :key="idx" class="px-3 py-3 text-center font-medium text-amber-700 whitespace-nowrap">
              {{ v }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
