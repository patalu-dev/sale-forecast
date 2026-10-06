<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Calendar, TrendingUp, Sparkles, Loader2, Users, Inbox } from 'lucide-vue-next'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'
import ForecastTable from '@/pages/forecast/components/ForecastTable.vue'
import ForecastTargetCard from '@/pages/forecast/components/ForecastTargetCard.vue'
import KpiProgressTable from '@/pages/forecast/components/KpiProgressTable.vue'
import ForecastChart from '@/pages/forecast/components/ForecastChart.vue'

const { setBreadcrumbs } = useBreadcrumb()
setBreadcrumbs([
  { title: 'Reports', href: '#' },
  { title: 'Báo cáo theo nhân viên' },
])

const todayStr = new Date().toISOString().split('T')[0]

const users = ref<any[]>([])
const selectedUser = ref('')
const searchUser = ref('')
const selectedDate = ref(todayStr)
const searchDate = ref('')
const loading = ref(false)
const usersLoading = ref(false)

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
  selectedDate: '',
})

const forecastMain = ref<any[]>([])
const forecastException = ref<any[]>([])
const noForecast = ref<any[]>([])

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

const selectedUserLabel = computed(() => {
  const u = users.value.find((x) => x.username === searchUser.value)
  if (!u) return searchUser.value || '-'
  return u.name ? `${u.username} - ${u.name}` : u.username
})

const fetchUsers = async () => {
  usersLoading.value = true
  try {
    const res = await request('/users?limit=1000&role=staff')
    if (!res.ok) throw new Error('Không thể tải danh sách user')
    const data = await res.json()
    users.value = data.items || []
  } catch (err: any) {
    toast.error('Lỗi tải danh sách user: ' + err.message)
  } finally {
    usersLoading.value = false
  }
}

const fetchReport = async () => {
  if (!searchDate.value || !searchUser.value) return
  loading.value = true
  try {
    const q = new URLSearchParams()
    if (searchDate.value) q.append('selectedDate', searchDate.value)
    q.append('username', searchUser.value)

    const res = await request(`/forecasts?${q.toString()}`)
    if (!res.ok) throw new Error('Không thể tải dữ liệu report')

    const data = await res.json()
    cycleInfo.value = data.cycle || cycleInfo.value
    forecastMain.value = data.forecastMain || []
    forecastException.value = data.forecastException || []
    noForecast.value = data.noForecast || []
    summary.value = data.summary || {}
  } catch (err: any) {
    toast.error('Lỗi khi tải dữ liệu: ' + err.message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchUser.value = selectedUser.value
  searchDate.value = selectedDate.value
  fetchReport()
}

const formattedCycleDate = computed(() => {
  if (!cycleInfo.value.startDate || !cycleInfo.value.endDate) return ''
  const start = cycleInfo.value.startDate.split(' ')[0]
  const end = cycleInfo.value.endDate.split(' ')[0]
  const [sy, sm, sd] = start.split('-')
  const [ey, em, ed] = end.split('-')
  return `Từ ngày ${sd}/${sm}/${sy} đến ngày ${ed}/${em}/${ey}`
})

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-3">
    <!-- Header + Filters -->
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-slate-900">Báo cáo nhân viên</h1>
        </div>
        <p class="text-xs text-slate-500 mt-1">Xem toàn bộ dữ liệu forecast - target - tiến độ của một nhân viên bất kỳ</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <div class="space-y-1">
          <span class="text-[11px] font-medium text-slate-500">Nhân viên</span>
          <Select v-model="selectedUser">
            <SelectTrigger class="w-[220px] h-9 bg-slate-50">
              <Users class="w-4 h-4 text-slate-400 mr-1" />
              <SelectValue :placeholder="usersLoading ? 'Đang tải...' : 'Chọn nhân viên'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="u in users" :key="u.username" :value="u.username">
                {{ u.username }}{{ u.name ? ` - ${u.name}` : '' }}{{ u.group ? ` (${u.group.toUpperCase()})` : '' }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <span class="text-[11px] font-medium text-slate-500">Ngày</span>
          <div class="relative flex items-center">
            <Calendar class="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            <Input type="date" v-model="selectedDate"
              class="pl-9 h-9 w-[180px] bg-slate-50 border-slate-200 focus:bg-white transition-colors" />
          </div>
        </div>
        <Button @click="handleSearch" :disabled="loading" class="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium mt-5">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <Search v-else class="w-4 h-4" />
          <span>Tìm kiếm</span>
        </Button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && !searchUser && !searchDate"
      class="bg-white rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
      <div class="flex flex-col items-center justify-center gap-2">
        <Inbox class="w-10 h-10 text-slate-300 stroke-[1.5]" />
        <span class="text-sm font-medium text-slate-500">Chưa có dữ liệu</span>
        <p class="text-xs text-slate-400">Chọn nhân viên và ngày, sau đó bấm "Tìm kiếm" để xem báo cáo</p>
      </div>
    </div>

    <template v-if="searchUser && searchDate">
      <!-- Cycle Banner & Stat Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div
          class="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
              <Sparkles class="w-3.5 h-3.5 text-emerald-300" />
              Chu kỳ được áp dụng
            </span>
            <div class="text-base font-bold mt-1 text-white tracking-tight">
              {{ cycleInfo.label || 'Đang cập nhật...' }}
            </div>
            <p class="text-xs text-emerald-100/90 mt-0.5 font-medium">
              {{ formattedCycleDate }}
            </p>
          </div>
          <div class="mt-3 pt-2 border-t border-emerald-400/30 flex items-center justify-between text-xs text-emerald-200">
            <span>Nhân viên:</span>
            <span class="font-bold text-white">{{ selectedUserLabel }}</span>
          </div>
        </div>

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
        </div>

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
        </div>

        <div class="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">No Forecast</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {{ summary.totalNoForecast || 0 }} dòng
            </span>
          </div>
          <div class="mt-2">
            <div class="text-2xl font-bold text-purple-700">
              {{ Number(summary.sumNoForecast || 0).toLocaleString() }}
            </div>
            <span class="text-xs text-slate-500">Sản lượng đơn No Forecast</span>
          </div>
        </div>
      </div>

      <!-- Forecast Target Card -->
      <ForecastTargetCard :selected-date="searchDate" :username="searchUser" />

      <!-- Tabs: Forecast Main | Exception | No Forecast -->
      <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-4">
        <Tabs v-model="activeTab" class="w-full">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
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
          </div>

          <TabsContent value="forecast_main" class="pt-3 outline-none">
            <ForecastTable :items="forecastMain" :loading="loading" :selected-date="searchDate" readonly />
          </TabsContent>

          <TabsContent value="forecast_exception" class="pt-3 outline-none">
            <ForecastTable :items="forecastException" :loading="loading" :selected-date="searchDate" readonly />
          </TabsContent>

          <TabsContent value="no_forecast" class="pt-3 outline-none">
            <ForecastTable :items="noForecast" :loading="loading" :selected-date="searchDate" readonly />
          </TabsContent>
        </Tabs>
      </div>

      <!-- KPI / Tiến độ table + Chart -->
      <div class="flex flex-col md:flex-row gap-4">
        <KpiProgressTable :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="forecastMain"
          :forecast-exception="forecastException" :no-forecast="noForecast" :label="selectedUserLabel" :username="searchUser" />
        <ForecastChart :selected-date="searchDate" :cycle="cycleInfo" :forecast-main="forecastMain"
          :forecast-exception="forecastException" :no-forecast="noForecast" :username="searchUser" />
      </div>
    </template>
  </div>
</template>