<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Inbox } from 'lucide-vue-next'
import { getSaturdaysInCycle } from '@/lib/date-utils'
import EditForecastDialog from './EditForecastDialog.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'

const props = defineProps<{
  items: any[]
  loading?: boolean
  selectedDate?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const editItem = ref<any>(null)
const isEditDialogOpen = ref(false)

const deleteItem = ref<any>(null)
const isDeleteDialogOpen = ref(false)
const deleteLoading = ref(false)

const handleEdit = (item: any) => {
  editItem.value = item
  isEditDialogOpen.value = true
}

const confirmDelete = (item: any) => {
  deleteItem.value = item
  isDeleteDialogOpen.value = true
}

const handleDelete = async () => {
  if (!deleteItem.value?.id) return
  deleteLoading.value = true
  try {
    const res = await request(`/forecasts/${deleteItem.value.id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Không thể xóa bản ghi')

    toast.success(`Đã xóa thành công bản ghi #${deleteItem.value.id}`)
    isDeleteDialogOpen.value = false
    deleteItem.value = null
    emit('refresh')
  } catch (err: any) {
    toast.error('Lỗi khi xóa: ' + err.message)
  } finally {
    deleteLoading.value = false
  }
}

const formatNumber = (val: any) => {
  const num = Number(val || 0)
  return num === 0 ? '-' : num.toLocaleString('en-US')
}

const dayHeaders = computed(() => {
  const cycleDates = getSaturdaysInCycle(props.selectedDate)
  return cycleDates.map((cd) => {
    const day = String(cd.date.getDate()).padStart(2, '0')
    const month = String(cd.date.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}`
  })
})

const totalColumns = computed(() => 10 + dayHeaders.value.length + (props.readonly ? 0 : 1))
</script>

<template>
  <div class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
        <thead class="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
          <tr>
            <th class="px-3 py-2 text-center w-12 border-b">STT</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Month</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Grade</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Buyer</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Brand</th>
            <th class="px-3 py-2 border-b whitespace-nowrap min-w-[180px]">Yarn Types</th>
            <th class="px-3 py-2 border-b whitespace-nowrap text-right text-amber-800">Stock</th>
            <th class="px-3 py-2 border-b whitespace-nowrap text-right text-blue-800">New Products</th>
            <th class="px-3 py-2 border-b whitespace-nowrap text-right text-emerald-800 font-bold">
              Forecast</th>
            <th v-for="header in dayHeaders" :key="header"
              class="px-2 py-2 border-b whitespace-nowrap text-right text-slate-600">{{ header }}</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Application</th>
            <!-- <th class="px-3 py-2 border-b whitespace-nowrap">Created by</th>
            <th class="px-3 py-2 border-b whitespace-nowrap">Created at</th> -->
            <th
              v-if="!props.readonly"
              class="px-3 py-2 border-b whitespace-nowrap text-center sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr v-if="loading">
            <td :colspan="totalColumns" class="py-12 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>Đang tải dữ liệu forecast...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="items.length === 0">
            <td :colspan="totalColumns" class="py-12 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <Inbox class="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <span class="text-sm font-medium text-slate-500">Chưa có dữ liệu forecast trong chu kỳ này</span>
                <p v-if="!props.readonly" class="text-xs text-slate-400">Bấm "Thêm một" hoặc "Thêm file" để đưa dữ liệu vào hệ thống</p>
              </div>
            </td>
          </tr>

          <tr v-for="(item, idx) in items" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="px-3 py-2 text-center text-slate-400 font-medium">{{ idx + 1 }}</td>
            <td class="px-3 py-2 whitespace-nowrap font-medium text-slate-900">
              {{ item.month || '-' }}
            </td>
            <td class="px-3 py-2 whitespace-nowrap font-medium text-slate-900">
              {{ item.grade || '-' }}
            </td>
            <td class="px-3 py-2 whitespace-nowrap font-medium text-slate-900">
              {{ item.buyer || '-' }}
            </td>
            <td class="px-3 py-2 whitespace-nowrap font-medium text-slate-900">
              {{ item.brand || '-' }}
            </td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-1 max-w-[280px]">
                <span v-if="item.yarn_type_1"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_1 }}
                </span>
                <span v-if="item.yarn_type_2"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_2 }}
                </span>
                <span v-if="item.yarn_type_3"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_3 }}
                </span>
                <span v-if="item.yarn_type_4"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_4 }}
                </span>
                <span v-if="item.yarn_type_5"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_5 }}
                </span>
                <span v-if="item.yarn_type_6"
                  class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                  {{ item.yarn_type_6 }}
                </span>
                <span v-if="!item.yarn_type_1 && !item.yarn_type_2 && !item.yarn_type_3" class="text-slate-400 italic">
                  -
                </span>
              </div>
            </td>
            <td class="px-3 py-2 text-right text-amber-700 font-semibold whitespace-nowrap">
              {{ formatNumber(item.stock_quantity) }}
            </td>
            <td class="px-3 py-2 text-right text-blue-700 font-semibold whitespace-nowrap">
              {{ formatNumber(item.new_pro_quantity) }}
            </td>
            <td class="px-3 py-2 text-right text-emerald-700 font-bold whitespace-nowrap text-sm">
              {{ formatNumber(item.forecast) }}
            </td>
            <td v-for="(_, i) in dayHeaders" :key="i"
              class="px-2 py-2 text-right text-slate-600 whitespace-nowrap">{{ formatNumber((item as any)[`day_${i + 1}`]) }}</td>
            <td class="px-3 py-2 whitespace-nowrap text-slate-600">{{ item.application }}</td>
            <!-- <td class="px-3 py-2 whitespace-nowrap text-slate-500 font-medium">
              <span class="inline-flex items-center gap-1">
                <User class="w-3 h-3 text-slate-400" />
                {{ item.created_by || '-' }}
              </span>
            </td>
            <td class="px-3 py-2 whitespace-nowrap text-slate-500">
              <span class="inline-flex items-center gap-1">
                <Calendar class="w-3 h-3 text-slate-400" />
                {{ formatDate(item.createdAt) }}
              </span>
            </td> -->
            <td v-if="!props.readonly"
              class="px-3 py-2 text-center whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-xs shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
              <div class="flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon" class="h-7 w-7 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  @click="handleEdit(item)">
                  <Edit2 class="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" class="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50"
                  @click="confirmDelete(item)">
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <EditForecastDialog v-model:open="isEditDialogOpen" :item="editItem" @success="emit('refresh')" />

  <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Xác nhận xóa bản ghi forecast?</AlertDialogTitle>
        <AlertDialogDescription>
          Hành động này sẽ xóa vĩnh viễn dòng dự báo #{{ deleteItem?.id }} (Buyer: {{ deleteItem?.buyer || 'N/A' }}).
          Bạn có chắc chắn muốn tiếp tục?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleteLoading">Hủy</AlertDialogCancel>
        <AlertDialogAction class="bg-red-600 hover:bg-red-700 text-white" :disabled="deleteLoading"
          @click="handleDelete">
          {{ deleteLoading ? 'Đang xóa...' : 'Xóa bản ghi' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
