<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-vue-next'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'
import { getSaturdaysInCycle, type CycleDate } from '@/lib/date-utils'

const props = defineProps<{
  forecastType: 'forecast_main' | 'forecast_exception' | 'no_forecast'
  defaultDate?: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const isOpen = ref(false)
const loading = ref(false)

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

const getSelectedMonth = () => {
  if (props.defaultDate) {
    return props.defaultDate.slice(0, 7)
  }
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const cycleDates = computed<CycleDate[]>(() => {
  return getSaturdaysInCycle(props.defaultDate)
})

const formData = reactive({
  forecast_type: props.forecastType,
  yarn_type_1: '',
  yarn_type_2: '',
  yarn_type_3: '',
  yarn_type_4: '',
  yarn_type_5: '',
  yarn_type_6: '',
  grade: '',
  buyer: '',
  brand: '',
  stock_quantity: 0,
  new_pro_quantity: 0,
  forecast: 0,
  application: '',
  day_1: 0,
  day_2: 0,
  day_3: 0,
  day_4: 0,
  day_5: 0,
  day_6: 0,
  day_7: 0,
})

watch(() => props.forecastType, (newVal) => {
  formData.forecast_type = newVal
})

const resetForm = () => {
  formData.yarn_type_1 = ''
  formData.yarn_type_2 = ''
  formData.yarn_type_3 = ''
  formData.yarn_type_4 = ''
  formData.yarn_type_5 = ''
  formData.yarn_type_6 = ''
  formData.grade = ''
  formData.buyer = ''
  formData.brand = ''
  formData.stock_quantity = 0
  formData.new_pro_quantity = 0
  formData.forecast = 0
  formData.application = ''
  for (let i = 1; i <= 7; i++) {
    (formData as any)[`day_${i}`] = 0
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const payload: any = {
      ...formData,
      month: getSelectedMonth(),
      stock_quantity: Number(formData.stock_quantity) || 0,
      new_pro_quantity: Number(formData.new_pro_quantity) || 0,
      forecast: Number(formData.forecast) || 0,
    }

    // Set day values based on cycleDates
    for (let i = 1; i <= 7; i++) {
      payload[`day_${i}`] = Number((formData as any)[`day_${i}`]) || 0
    }

    const res = await request('/forecasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Lỗi khi lưu forecast')
    }

    toast.success(`Đã thêm thành công dòng ${getTypeName(props.forecastType)}!`)
    isOpen.value = false
    resetForm()
    emit('success')
  } catch (error: any) {
    toast.error('Lỗi: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="default" size="sm"
        class="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium">
        <Plus class="w-4 h-4" />
        Thêm một
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold flex items-center gap-2">
          <span>Thêm dòng dữ liệu:</span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {{ getTypeName(props.forecastType) }}
          </span>
        </DialogTitle>
        <DialogDescription>
          Điền các thông số chi tiết cho bản ghi dự báo bán hàng. Bấm Lưu để cập nhật vào cơ sở dữ liệu.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 py-2">
        <!-- Các loại sợi (Yarn Types 1 - 6) -->
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Chi tiết loại sợi (Yarn Types)</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">(1)</Label>
              <Input v-model="formData.yarn_type_1" placeholder="Yarn Type 1" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">(2)</Label>
              <Input v-model="formData.yarn_type_2" placeholder="Yarn Type 2" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Denier</Label>
              <Input v-model="formData.yarn_type_3" placeholder="Denier" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Filament</Label>
              <Input v-model="formData.yarn_type_4" placeholder="Filament" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">(5)</Label>
              <Input v-model="formData.yarn_type_5" placeholder="Yarn Type 5" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">(6)</Label>
              <Input v-model="formData.yarn_type_6" placeholder="Yarn Type 6" />
            </div>
          </div>
        </div>

        <!-- Thông tin cơ bản -->
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Thông tin đối tác & Cấp hàng</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Grade</Label>
              <Input v-model="formData.grade" placeholder="Cấp / Grade" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Buyer</Label>
              <Input v-model="formData.buyer" placeholder="Tên Buyer" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Brand</Label>
              <Input v-model="formData.brand" placeholder="Nhãn hiệu" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5 md:col-span-3">
              <Label class="text-xs font-medium">Application</Label>
              <Input v-model="formData.application" placeholder="Ví dụ: Dệt thoi, dệt kim tròn..."
                class="h-8 text-sm" />
            </div>
          </div>
        </div>

        <!-- Sản lượng & Dự báo -->
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Sản lượng tổng & Tồn kho</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-amber-700">Stock Quantity</Label>
              <Input type="number" step="any" v-model="formData.stock_quantity" class="h-8 text-sm font-semibold" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-blue-700">New Pro Quantity</Label>
              <Input type="number" step="any" v-model="formData.new_pro_quantity" class="h-8 text-sm font-semibold" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-emerald-700">Forecast Quantity</Label>
              <Input type="number" step="any" v-model="formData.forecast" class="h-8 text-sm font-semibold" />
            </div>
          </div>
        </div>

        <!-- Dự báo theo ngày trong chu kỳ (Day 1 - Day N) -->
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Phân bổ theo ngày (Day 1 - Day {{ cycleDates.length }})</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-3 gap-2">
            <div v-for="(cycleDate, index) in cycleDates" :key="index" class="space-y-1">
              <Label class="text-xs text-slate-600">
                Day {{ index + 1 }}
                <span class="text-slate-500 font-normal">({{ cycleDate.label }})</span>
              </Label>
              <Input
                type="number"
                step="any"
                v-model="formData[`day_${index + 1}` as keyof typeof formData]"
                class="h-8 text-xs text-center"
              />
            </div>
          </div>
        </div>

        <DialogFooter class="pt-2">
          <Button type="button" variant="outline" @click="isOpen = false" :disabled="loading">
            Hủy
          </Button>
          <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            Lưu bản ghi
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
