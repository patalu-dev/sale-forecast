<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Calendar,
  Download,
  TrendingUp,
  Sparkles,
} from 'lucide-vue-next'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'
import CreateForecastDialog from './components/CreateForecastDialog.vue'
import ImportForecastDialog from './components/ImportForecastDialog.vue'
import ForecastTable from './components/ForecastTable.vue'
import ForecastTargetCard from './components/ForecastTargetCard.vue'
import KpiProgressTable from './components/KpiProgressTable.vue'
import ForecastChart from './components/ForecastChart.vue'
import { exportForecastToExcel } from './lib/excelHelper'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const { setBreadcrumbs } = useBreadcrumb()

setBreadcrumbs([
  { title: 'Dự báo bán hàng', href: '#' },
  { title: 'Quản lý Forecast' },
])

// Today as default YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0]
const selectedDate = ref(todayStr)
const searchDate = ref(todayStr)
const loading = ref(false)

const activeTab = ref<'forecast_main' | 'forecast_exception' | 'no_forecast'>('forecast_main')

const cycleInfo = ref<{
  startDate: string
  endDate: string
  label: string
  selectedDate: string
  cycleMonth?: string
}>({
  startDate: '',
  endDate: '',
  label: '',
  selectedDate: todayStr,
})

const forecastMain = ref<any[]>([])
const forecastException = ref<any[]>([])
const noForecast = ref<any[]>([])

const groupForecastMain = ref<any[]>([])
const groupForecastException = ref<any[]>([])
const groupNoForecast = ref<any[]>([])

const allForecastMain = ref<any[]>([])
const allForecastException = ref<any[]>([])
const allNoForecast = ref<any[]>([])

const summary = ref<any>({
  totalMain: 0,
  totalException: 0,
  totalNoForecast: 0,
  totalItems: 0,
  sumMainForecast: 0,
  sumExceptionForecast: 0,
  sumNoForecast: 0,
  sumTotalForecast: 0,
})

const fetchForecastData = async () => {
  loading.value = true
  try {
    const q = new URLSearchParams()
    if (searchDate.value) {
      q.append('selectedDate', searchDate.value)
    }

    const res = await request(`/forecasts?${q.toString()}`)
    if (!res.ok) throw new Error('Không thể tải dữ liệu dự báo bán hàng')

    const data = await res.json()
    cycleInfo.value = data.cycle
    forecastMain.value = data.forecastMain || []
    forecastException.value = data.forecastException || []
    noForecast.value = data.noForecast || []
    summary.value = data.summary || {}

    if (user.value?.group) {
      const gq = new URLSearchParams()
      if (searchDate.value) gq.append('selectedDate', searchDate.value)
      gq.append('group', user.value.group)
      const gRes = await request(`/forecasts?${gq.toString()}`)
      if (gRes.ok) {
        const gData = await gRes.json()
        groupForecastMain.value = gData.forecastMain || []
        groupForecastException.value = gData.forecastException || []
        groupNoForecast.value = gData.noForecast || []
      }
    }

    const aq = new URLSearchParams()
    if (searchDate.value) aq.append('selectedDate', searchDate.value)
    aq.append('all', 'true')
    const aRes = await request(`/forecasts?${aq.toString()}`)
    if (aRes.ok) {
      const aData = await aRes.json()
      allForecastMain.value = aData.forecastMain || []
      allForecastException.value = aData.forecastException || []
      allNoForecast.value = aData.noForecast || []
    }
  } catch (err: any) {
    toast.error('Lỗi khi tải dữ liệu: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchForecastData()
})

const handleSearch = () => {
  searchDate.value = selectedDate.value
  fetchForecastData()
}

const handleExportCurrentTab = (type: string) => {
  let items: any[] = []
  let name = ''
  if (type === 'forecast_main') {
    items = forecastMain.value
    name = 'Forecast-Main'
  } else if (type === 'forecast_exception') {
    items = forecastException.value
    name = 'Forecast-Exception'
  } else {
    items = noForecast.value
    name = 'No-Forecast'
  }

  if (items.length === 0) {
    toast.error('Không có dữ liệu trong tab này để xuất Excel')
    return
  }

  exportForecastToExcel(items, name)
  toast.success(`Đã xuất file Excel cho tab ${name}!`)
}

// Format date range display
const formattedCycleDate = computed(() => {
  if (!cycleInfo.value.startDate || !cycleInfo.value.endDate) return ''
  const start = cycleInfo.value.startDate.split(' ')[0]
  const end = cycleInfo.value.endDate.split(' ')[0]
  const [sy, sm, sd] = start.split('-')
  const [ey, em, ed] = end.split('-')
  return `Từ ngày ${sd}/${sm}/${sy} đến ngày ${ed}/${em}/${ey}`
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-3">
    <!-- Header Page & Date Filter -->
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-slate-900">Quản lý Dự báo bán hàng</h1>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Lọc dữ liệu theo quy tắc chu kỳ ngày 21 (trước 21: từ 21 tháng trước đến 20 tháng này; từ 21: từ 21 tháng này
          đến 20 tháng sau)
        </p>
      </div>

      <!-- Date Search Bar -->
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <div class="relative flex items-center">
          <Calendar class="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
          <Input type="date" v-model="selectedDate"
            class="pl-9 h-9 w-[180px] bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
        </div>
        <Button @click="handleSearch" :disabled="loading"
          class="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-medium">
          <Search class="w-4 h-4" />
          <span>Tìm kiếm</span>
        </Button>
      </div>
    </div>

    <!-- Cycle Banner & Stat Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <!-- Cycle info card -->
      <div
        class="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            <Sparkles class="w-3.5 h-3.5 text-blue-300" />
            Chu kỳ được áp dụng
          </span>
          <div class="text-base font-bold mt-1 text-white tracking-tight">
            {{ cycleInfo.label || 'Đang cập nhật...' }}
          </div>
          <p class="text-xs text-blue-100/90 mt-0.5 font-medium">
            {{ formattedCycleDate }}
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-blue-400/30 flex items-center justify-between text-xs text-blue-200">
          <span>Ngày tra cứu:</span>
          <span class="font-bold text-white">{{ searchDate }}</span>
        </div>
      </div>

      <!-- Forecast Main Stat -->
      <div class="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Forecast Main</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {{ summary.totalMain || 0 }} dòng
          </span>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-slate-900">
            {{ Number(summary.sumMainForecast || 0).toLocaleString() }}
          </div>
          <span class="text-xs text-slate-500">Tổng sản lượng dự báo</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3">
          <div class="bg-blue-600 h-1.5 rounded-full"
            :style="{ width: summary.totalItems ? `${(summary.totalMain / summary.totalItems) * 100}%` : '0%' }"></div>
        </div>
      </div>

      <!-- Forecast Exception Stat -->
      <div class="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Forecast Exception</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {{ summary.totalException || 0 }} dòng
          </span>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-amber-600">
            {{ Number(summary.sumExceptionForecast || 0).toLocaleString() }}
          </div>
          <span class="text-xs text-slate-500">Tổng sản lượng ngoại lệ</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3">
          <div class="bg-amber-500 h-1.5 rounded-full"
            :style="{ width: summary.totalItems ? `${(summary.totalException / summary.totalItems) * 100}%` : '0%' }">
          </div>
        </div>
      </div>

      <!-- No Forecast Stat -->
      <div class="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">No Forecast</span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            {{ summary.totalNoForecast || 0 }} dòng
          </span>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-purple-700">
            {{ Number(summary.sumNoForecast || 0).toLocaleString() }}
          </div>
          <span class="text-xs text-slate-500">Sản lượng đơn No Forecast</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3">
          <div class="bg-purple-600 h-1.5 rounded-full"
            :style="{ width: summary.totalItems ? `${(summary.totalNoForecast / summary.totalItems) * 100}%` : '0%' }">
          </div>
        </div>
      </div>
    </div>

    <!-- Forecast Target Card -->
    <ForecastTargetCard :selected-date="searchDate" />

    <!-- Shadcn Tabs: Forecast Main | Forecast Exception | No Forecast -->
    <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-4">
      <Tabs v-model="activeTab" class="w-full">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <!-- Tabs List -->
          <TabsList class="grid grid-cols-3 w-full sm:w-[540px] h-10 p-1 bg-slate-100/90 rounded-lg">
            <TabsTrigger value="forecast_main"
              class="font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs rounded-md transition-all">
              <span>Forecast Main</span>
              <span class="px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-800">
                {{ forecastMain.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger value="forecast_exception"
              class="font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-xs rounded-md transition-all">
              <span>Forecast Exception</span>
              <span class="px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800">
                {{ forecastException.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger value="no_forecast"
              class="font-semibold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs rounded-md transition-all">
              <span>No Forecast</span>
              <span class="px-1.5 py-0.2 rounded-full font-bold bg-purple-100 text-purple-800">
                {{ noForecast.length }}
              </span>
            </TabsTrigger>
          </TabsList>

          <!-- Current Active Tab Info & Export Button -->
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm"
              class="gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
              @click="handleExportCurrentTab(activeTab)">
              <Download class="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất Excel</span>
            </Button>
          </div>
        </div>

        <!-- TAB 1: Forecast Main -->
        <TabsContent value="forecast_main" class="pt-3 space-y-3 outline-none">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Dữ liệu Forecast Main</h3>
              <p class="text-xs text-slate-500">Hiển thị các dòng dự báo bán hàng chính thức theo chu kỳ</p>
            </div>
            <div class="flex items-center gap-2">
              <CreateForecastDialog forecast-type="forecast_main" :default-date="searchDate"
                @success="fetchForecastData" />
              <ImportForecastDialog forecast-type="forecast_main" :default-date="searchDate"
                @success="fetchForecastData" />
            </div>
          </div>
          <ForecastTable :items="forecastMain" :loading="loading" :selected-date="searchDate" @refresh="fetchForecastData" />
        </TabsContent>

        <!-- TAB 2: Forecast Exception -->
        <TabsContent value="forecast_exception" class="pt-3 space-y-3 outline-none">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Dữ liệu Forecast Exception</h3>
              <p class="text-xs text-slate-500">Hiển thị các dòng dự báo ngoại lệ hoặc điều chỉnh đặc biệt</p>
            </div>
            <div class="flex items-center gap-2">
              <CreateForecastDialog forecast-type="forecast_exception" :default-date="searchDate"
                @success="fetchForecastData" />
              <ImportForecastDialog forecast-type="forecast_exception" :default-date="searchDate"
                @success="fetchForecastData" />
            </div>
          </div>
          <ForecastTable :items="forecastException" :loading="loading" :selected-date="searchDate" @refresh="fetchForecastData" />
        </TabsContent>

        <!-- TAB 3: No Forecast -->
        <TabsContent value="no_forecast" class="pt-3 space-y-3 outline-none">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-sm font-bold text-slate-800">Dữ liệu No Forecast</h3>
              <p class="text-xs text-slate-500">Hiển thị các đơn hàng hoặc sản lượng không nằm trong danh mục dự báo</p>
            </div>
            <div class="flex items-center gap-2">
              <CreateForecastDialog forecast-type="no_forecast" :default-date="searchDate"
                @success="fetchForecastData" />
              <ImportForecastDialog forecast-type="no_forecast" :default-date="searchDate"
                @success="fetchForecastData" />
            </div>
          </div>
          <ForecastTable :items="noForecast" :loading="loading" :selected-date="searchDate" @refresh="fetchForecastData" />
        </TabsContent>
      </Tabs>
    </div>
    <!-- KPI / Tiến độ table + Chart -->
    <div class="mt-2 flex flex-col md:flex-row gap-4">
      <KpiProgressTable :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="forecastMain"
        :forecast-exception="forecastException" :no-forecast="noForecast" />
      <ForecastChart :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="forecastMain"
        :forecast-exception="forecastException" :no-forecast="noForecast" />
    </div>
    <!-- Group KPI / Tiến độ table + Chart -->
    <div v-if="user?.group" class="mt-2">
      <div class="flex flex-col md:flex-row gap-4">
        <KpiProgressTable :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="groupForecastMain"
          :forecast-exception="groupForecastException" :no-forecast="groupNoForecast" :label="user.group"
          :group="user.group" />
        <ForecastChart :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="groupForecastMain"
          :forecast-exception="groupForecastException" :no-forecast="groupNoForecast" :group="user.group" />
      </div>
    </div>
    <!-- All KPI / Tiến độ table + Chart -->
    <div class="mt-2">
      <div class="flex flex-col md:flex-row gap-4">
        <KpiProgressTable :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="allForecastMain"
          :forecast-exception="allForecastException" :no-forecast="allNoForecast" label="P.KD" :all="true" />
        <ForecastChart :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="allForecastMain"
          :forecast-exception="allForecastException" :no-forecast="allNoForecast" :all="true" />
      </div>
    </div>
  </div>
</template>
