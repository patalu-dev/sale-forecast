<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Info } from 'lucide-vue-next'
import { request } from '@/lib/api'
import { getCycleMonth } from '@/lib/date-utils'
import { toast } from 'vue-sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import SummaryProgressTable from './SummaryProgressTable.vue'
import SummaryChart from './SummaryChart.vue'

const { setBreadcrumbs } = useBreadcrumb()
setBreadcrumbs([
  { title: 'Summary', href: '#' },
  { title: 'Tổng hợp' },
])

const todayStr = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayStr)
const searchDate = ref('')
const loading = ref(false)

const summaryLocal = ref<any>(null)
const summaryExport = ref<any>(null)
const summaryPKD = ref<any>(null)
const summaryPerUser = ref<any[]>([])

const month = computed(() => getCycleMonth(searchDate.value))

const fmt = (val: any) => {
  const num = Number(val || 0)
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

const fmtPct = (val: any) => {
  const num = Number(val || 0)
  return (num * 100).toFixed(0) + '%'
}

const fetchData = async () => {
  if (!searchDate.value) return
  loading.value = true
  try {
    const q = new URLSearchParams({ month: month.value })
    const res = await request(`/summaries?${q.toString()}`)
    if (!res.ok) throw new Error('Không thể tải dữ liệu summary')
    const data = await res.json()
    summaryLocal.value = data.summaryLocal
    summaryExport.value = data.summaryExport
    summaryPKD.value = data.summaryPKD
    summaryPerUser.value = data.summaryPerUser || []
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchDate.value = selectedDate.value
  fetchData()
}

const displayGroups = computed(() => {
  const groups: { label: string; data: any }[] = []
  if (summaryPKD.value) groups.push({ label: 'PKD', data: summaryPKD.value })
  if (summaryLocal.value) groups.push({ label: 'LOCAL', data: summaryLocal.value })
  if (summaryExport.value) groups.push({ label: 'EXPORT', data: summaryExport.value })
  return groups
})
</script>

<template>
  <div class="p-4 space-y-4">
    <div class="flex items-end gap-3">
      <div class="space-y-1.5">
        <Label class="text-xs font-medium text-slate-600">Tháng</Label>
        <Input type="date" v-model="selectedDate" class="h-9 w-[180px] bg-white" />
      </div>
      <Button @click="handleSearch" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 text-white h-9">
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        <Search v-else class="w-4 h-4 mr-2" />
        Tìm kiếm
      </Button>
    </div>

        <!-- Per user -->
    <div v-if="summaryPerUser.length > 0">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Chi tiết theo nhân viên</h3>
      <div v-for="user in summaryPerUser" :key="user.user"
        class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden mb-4">
        <!-- Header -->
        <div class="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wider">{{ user.user }}</h3>
        </div>
        <!-- Horizontal layout -->
        <div class="flex flex-col md:flex-row">
          <!-- Left: Info + Detail -->
          <div class="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-slate-200 space-y-3">
            <table class="w-full text-xs">
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">Buyer N.W</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.buyernetwork) }}</td>
                </tr>
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">KPIS</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.kpis) }}</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-slate-700">% Realized vs buyer network</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmtPct(user.percent_vs_buyer_network) }}</td>
                </tr>
              </tbody>
            </table>
            <table class="w-full text-xs">
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">Forecast</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.forecast) }}</td>
                  <td class="py-1.5 text-right text-slate-600">{{ fmtPct(user.percent_forecast) }} of KPI</td>
                </tr>
                <tr>
                  <td class="py-1.5 text-slate-700">New prod</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.new_prod) }}</td>
                  <td></td>
                </tr>
                <tr>
                  <td class="py-1.5 text-slate-700">Stock</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.stockqty) }}</td>
                  <td></td>
                </tr>
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-600 cursor-pointer">
                            Realized <Info class="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent class="text-xs" side="right">
                          <p>Realized (New prod): {{ fmt(user.realized_new_prod) }} - {{ fmtPct(user.percent_realized_new_prod) }}</p>
                          <p>Realized (Stock): 0 - 0</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.realized) }}</td>
                  <td class="py-1.5 text-right text-red-600 font-medium">{{ fmtPct(user.percent_realized) }} of Forecast</td>
                </tr>
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-600 cursor-pointer">
                            Realized No Forecast <Info class="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent class="text-xs" side="right">
                          <p>Out DK (New prod): {{ fmt(user.out_dk_new_prod) }} - {{ fmtPct(user.percent_out_dk_new_prod) }}</p>
                          <p>Out DK (Stock): 0 - 0</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.realized_out_dk) }}</td>
                  <td class="py-1.5 text-right text-red-600 font-medium">{{ fmtPct(user.percent_realized_out_dk) }}</td>
                </tr>
                <tr>
                  <td class="py-1.5 font-bold text-slate-700">Total realized</td>
                  <td class="py-1.5 text-right text-slate-900">{{ fmt(user.total_realized) }}</td>
                  <td></td>
                </tr>
                <tr>
                  <td class="py-1.5 font-bold text-red-600">Total realized vs KPI</td>
                  <td class="py-1.5 text-right font-bold text-red-600">{{ fmtPct(user.percent_total_realized_vs_kpi) }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Right: Progress + Chart -->
          <div class="w-full md:w-1/2 p-4 space-y-4">
            <SummaryProgressTable :selected-date="searchDate" :label="user.user" :forecasts="user.forecasts" />
            <SummaryChart :selected-date="searchDate" :label="user.user" :forecasts="user.forecasts" :kpi-target="user.kpis" />
          </div>
        </div>
      </div>
    </div>

    <!-- Group summaries -->
    <div v-for="group in displayGroups" :key="group.label"
      class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-3 bg-amber-50 border-b border-amber-200">
        <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wider">{{ group.label }}</h3>
      </div>
      <!-- Horizontal layout -->
      <div class="flex flex-col md:flex-row">
        <!-- Left: Info + Detail -->
        <div class="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-slate-200 space-y-3">
          <!-- Info -->
          <table class="w-full text-xs">
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-1.5 font-bold text-slate-700">Buyer N.W</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmt(group.data.buyernetwork) }}</td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold text-slate-700">KPIS</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmt(group.data.kpis) }}</td>
              </tr>
              <tr>
                <td class="py-1.5 text-slate-700">% Realized vs buyer network</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmtPct(group.data.percent_vs_buyer_network) }}</td>
              </tr>
            </tbody>
          </table>
          <!-- Detail -->
          <table class="w-full text-xs">
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-1.5 font-bold text-slate-700">Forecast</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmt(group.data.forecast) }}</td>
                <td class="py-1.5 text-right text-slate-600">{{ fmtPct(group.data.percent_forecast) }} of KPI</td>
              </tr>
              <tr>
                <td class="py-1.5 text-slate-700">New prod</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmt(group.data.new_prod) }}</td>
                <td></td>
              </tr>
              <tr>
                <td class="py-1.5 text-slate-700">Stock</td>
                <td class="py-1.5 text-right text-slate-900">{{ fmt(group.data.stockqty) }}</td>
                <td></td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold text-slate-700">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-600 cursor-pointer">
                          Realized <Info class="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent class="text-xs" side="right">
                        <p>Realized (New prod): {{ fmt(group.data.realized_new_prod) }} - {{ fmtPct(group.data.percent_realized_new_prod) }}</p>
                        <p>Realized (Stock): 0 - 0</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td class="py-1.5 text-right font-mono text-slate-900">{{ fmt(group.data.realized) }}</td>
                <td class="py-1.5 text-right text-red-600 font-medium">{{ fmtPct(group.data.percent_realized) }} of Forecast</td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold text-slate-700">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button class="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-600 cursor-pointer">
                          Realized No Forecast <Info class="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent class="text-xs" side="right">
                        <p>Out DK (New prod): {{ fmt(group.data.out_dk_new_prod) }} - {{ fmtPct(group.data.percent_out_dk_new_prod) }}</p>
                        <p>Out DK (Stock): 0 - 0</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td class="py-1.5 text-right font-mono text-slate-900">{{ fmt(group.data.realized_out_dk) }}</td>
                <td class="py-1.5 text-right text-red-600 font-medium">{{ fmtPct(group.data.percent_realized_out_dk) }}</td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold text-slate-700">Total realized</td>
                <td class="py-1.5 text-right font-mono text-slate-900">{{ fmt(group.data.total_realized) }}</td>
                <td></td>
              </tr>
              <tr>
                <td class="py-1.5 font-bold text-red-600">Total realized vs KPI</td>
                <td class="py-1.5 text-right font-mono font-bold text-red-600">{{ fmtPct(group.data.percent_total_realized_vs_kpi) }}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Right: Progress + Chart -->
        <div class="w-full md:w-1/2 p-4 space-y-4">
          <SummaryProgressTable :selected-date="searchDate" :label="group.label" :forecasts="group.data.forecasts" />
          <SummaryChart :selected-date="searchDate" :label="group.label" :forecasts="group.data.forecasts" :kpi-target="group.data.kpis" />
        </div>
      </div>
    </div>

    <div v-if="!loading && displayGroups.length === 0 && summaryPerUser.length === 0"
      class="text-center py-12 text-slate-500 text-sm">
      Chọn tháng và nhấn Tìm kiếm để xem dữ liệu
    </div>
  </div>
</template>
