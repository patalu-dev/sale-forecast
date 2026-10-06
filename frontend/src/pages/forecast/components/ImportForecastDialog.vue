<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Upload, Download, Loader2, CheckCircle2 } from 'lucide-vue-next'
import { parseExcelFile, downloadSampleTemplate, getDayColumnLabels } from '../lib/excelHelper'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'

const props = defineProps<{
  forecastType: 'forecast_main' | 'forecast_exception' | 'no_forecast'
  defaultDate?: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = ref(false)
const loading = ref(false)
const parsing = ref(false)
const parsedRows = ref<any[]>([])
const selectedFileName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const getTypeName = (type: string) => {
  switch (type) {
    case 'forecast_main':
      return 'Forecast Main'
    case 'forecast_exception':
      return 'Forecast Exception'
    case 'no_forecast':
      return 'No Forecast'
    default:
      return type
  }
}

const dayLabels = computed(() => {
  return getDayColumnLabels(props.defaultDate)
})

const handleDownloadTemplate = () => {
  downloadSampleTemplate(props.forecastType, props.defaultDate)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  selectedFileName.value = file.name
  parsing.value = true
  try {
    const items = await parseExcelFile(file, props.forecastType)
    // Add month and record_date from selectedDate
    const selectedDate = props.defaultDate || new Date().toISOString().split('T')[0]
    parsedRows.value = items.map((row) => ({
      ...row,
      month: selectedDate.slice(0, 7),
      record_date: selectedDate,
    }))
    toast.success(`Đã đọc ${parsedRows.value.length} dòng dữ liệu từ file!`)
  } catch (err: any) {
    toast.error('Lỗi khi đọc file: ' + err.message)
    parsedRows.value = []
  } finally {
    parsing.value = false
    target.value = ''
  }
}

const handleConfirmImport = async () => {
  if (parsedRows.value.length === 0) return

  loading.value = true
  try {
    const res = await request('/forecasts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: parsedRows.value }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Lỗi khi nhập dữ liệu')
    }

    const result = await res.json()
    toast.success(`Đã nhập thành công ${result.count || parsedRows.value.length} dòng dữ liệu!`)
    isOpen.value = false
    parsedRows.value = []
    selectedFileName.value = ''
    emit('success')
  } catch (err: any) {
    toast.error('Lỗi import: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="sm" class="gap-1.5 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 shadow-sm font-medium">
        <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
        Thêm file
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-4xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span>Nhập hàng loạt file Excel / CSV:</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {{ getTypeName(props.forecastType) }}
            </span>
          </div>
          <Button variant="outline" size="sm" class="mr-5 gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" @click="handleDownloadTemplate">
            <Download class="w-3.5 h-3.5" />
            Tải file mẫu (.xlsx)
          </Button>
        </DialogTitle>
        <DialogDescription>
          Tải lên file Excel (.xlsx, .xls) hoặc CSV chứa các dòng dự báo. Bạn có thể xem trước bảng dữ liệu trước khi bấm xác nhận lưu.
        </DialogDescription>
      </DialogHeader>

      <input
        ref="fileInput"
        type="file"
        accept=".xlsx, .xls, .csv"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Dropzone / Upload area -->
      <div
        @click="triggerFileInput"
        class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/70 hover:bg-slate-100/80 border-slate-300 flex flex-col items-center justify-center gap-2"
      >
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <Upload class="w-6 h-6" />
        </div>
        <div class="text-sm font-medium text-slate-800">
          <span v-if="selectedFileName" class="text-emerald-600 font-semibold">{{ selectedFileName }}</span>
          <span v-else>Bấm vào đây để chọn file Excel/CSV từ máy tính</span>
        </div>
        <p class="text-xs text-slate-500">Hỗ trợ định dạng .xlsx, .xls, .csv theo mẫu chuẩn</p>
      </div>

      <!-- Preview Section -->
      <div v-if="parsing" class="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 class="w-6 h-6 animate-spin text-emerald-600" />
        <span class="text-sm">Đang phân tích dữ liệu file...</span>
      </div>

      <div v-else-if="parsedRows.length > 0" class="flex-1 min-h-0 flex flex-col gap-2 mt-2">
        <div class="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span class="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 class="w-4 h-4" />
            Tìm thấy {{ parsedRows.length }} dòng dữ liệu sẵn sàng import
          </span>
          <span>Hiển thị tối đa 20 dòng xem trước</span>
        </div>

        <div class="border rounded-lg overflow-x-auto max-h-[300px] text-xs">
          <table class="min-w-full divide-y divide-slate-200 text-left">
            <thead class="bg-slate-100 text-slate-700 sticky top-0">
              <tr>
                <th class="px-2.5 py-1.5 whitespace-nowrap">STT</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Tháng</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Sợi 1</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Sợi 2</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Grade</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Buyer</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap">Brand</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap text-right">Tồn kho</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap text-right">SX Mới</th>
                <th class="px-2.5 py-1.5 whitespace-nowrap text-right">Forecast</th>
                <th v-for="(label, idx) in dayLabels" :key="idx" class="px-2.5 py-1.5 whitespace-nowrap text-right">{{ label }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr v-for="(r, idx) in parsedRows.slice(0, 20)" :key="idx" class="hover:bg-slate-50">
                <td class="px-2.5 py-1 text-slate-500">{{ idx + 1 }}</td>
                <td class="px-2.5 py-1 font-medium">{{ r.month }}</td>
                <td class="px-2.5 py-1">{{ r.yarn_type_1 }}</td>
                <td class="px-2.5 py-1">{{ r.yarn_type_2 }}</td>
                <td class="px-2.5 py-1">{{ r.grade }}</td>
                <td class="px-2.5 py-1">{{ r.buyer }}</td>
                <td class="px-2.5 py-1">{{ r.brand }}</td>
                <td class="px-2.5 py-1 text-right text-amber-700 font-medium">{{ Number(r.stock_quantity || 0).toLocaleString() }}</td>
                <td class="px-2.5 py-1 text-right text-blue-700 font-medium">{{ Number(r.new_pro_quantity || 0).toLocaleString() }}</td>
                <td class="px-2.5 py-1 text-right text-emerald-700 font-bold">{{ Number(r.forecast || 0).toLocaleString() }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_1 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_2 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_3 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_4 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_5 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_6 }}</td>
                <td class="px-2 py-1 text-right text-slate-600">{{ r.day_7 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DialogFooter class="pt-4 mt-auto">
        <Button variant="outline" @click="isOpen = false" :disabled="loading">Hủy</Button>
        <Button
          class="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          :disabled="loading || parsedRows.length === 0"
          @click="handleConfirmImport"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span>Xác nhận nhập ({{ parsedRows.length }} dòng)</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
