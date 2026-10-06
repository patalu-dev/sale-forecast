<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-vue-next'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'
import { getSaturdaysInCycle, type CycleDate } from '@/lib/date-utils'

const props = defineProps<{
  open: boolean
  item: any
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success'): void
}>()

const loading = ref(false)

const cycleDates = computed<CycleDate[]>(() => {
  return getSaturdaysInCycle(props.item?.month ? `${props.item.month}-01` : undefined)
})

const formData = reactive({
  grade: '',
  buyer: '',
  brand: '',
  yarn_type_1: '',
  yarn_type_2: '',
  yarn_type_3: '',
  yarn_type_4: '',
  yarn_type_5: '',
  yarn_type_6: '',
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

watch(() => props.item, (newVal) => {
  if (newVal) {
    formData.grade = newVal.grade || ''
    formData.buyer = newVal.buyer || ''
    formData.brand = newVal.brand || ''
    formData.yarn_type_1 = newVal.yarn_type_1 || ''
    formData.yarn_type_2 = newVal.yarn_type_2 || ''
    formData.yarn_type_3 = newVal.yarn_type_3 || ''
    formData.yarn_type_4 = newVal.yarn_type_4 || ''
    formData.yarn_type_5 = newVal.yarn_type_5 || ''
    formData.yarn_type_6 = newVal.yarn_type_6 || ''
    formData.stock_quantity = Number(newVal.stock_quantity) || 0
    formData.new_pro_quantity = Number(newVal.new_pro_quantity) || 0
    formData.forecast = Number(newVal.forecast) || 0
    formData.application = newVal.application || ''
    formData.day_1 = Number(newVal.day_1) || 0
    formData.day_2 = Number(newVal.day_2) || 0
    formData.day_3 = Number(newVal.day_3) || 0
    formData.day_4 = Number(newVal.day_4) || 0
    formData.day_5 = Number(newVal.day_5) || 0
    formData.day_6 = Number(newVal.day_6) || 0
    formData.day_7 = Number(newVal.day_7) || 0
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!props.item?.id) return
  loading.value = true
  try {
    const res = await request(`/forecasts/${props.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Lỗi khi cập nhật forecast')
    }

    toast.success('Cập nhật thành công!')
    emit('update:open', false)
    emit('success')
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold">Chỉnh sửa bản ghi Forecast #{{ item?.id }}</DialogTitle>
        <DialogDescription>Cập nhật chi tiết các trường dữ liệu của dự báo bán hàng.</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4 py-2">
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Chi tiết sợi (Yarn Types)</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div class="space-y-1.5"><Label class="text-xs font-medium">Loại sợi 1</Label><Input v-model="formData.yarn_type_1" class="h-8 text-sm" /></div>
            <div class="space-y-1.5"><Label class="text-xs font-medium">Loại sợi 2</Label><Input v-model="formData.yarn_type_2" class="h-8 text-sm" /></div>
            <div class="space-y-1.5"><Label class="text-xs font-medium">Denier</Label><Input v-model="formData.yarn_type_3" class="h-8 text-sm" /></div>
            <div class="space-y-1.5"><Label class="text-xs font-medium">Filament</Label><Input v-model="formData.yarn_type_4" class="h-8 text-sm" /></div>
            <div class="space-y-1.5"><Label class="text-xs font-medium">Loại sợi 5</Label><Input v-model="formData.yarn_type_5" class="h-8 text-sm" /></div>
            <div class="space-y-1.5"><Label class="text-xs font-medium">Loại sợi 6</Label><Input v-model="formData.yarn_type_6" class="h-8 text-sm" /></div>
          </div>
        </div>
        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Grade</Label>
              <Input v-model="formData.grade" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Buyer</Label>
              <Input v-model="formData.buyer" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium">Brand</Label>
              <Input v-model="formData.brand" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5 md:col-span-3">
              <Label class="text-xs font-medium">Application</Label>
              <Input v-model="formData.application" class="h-8 text-sm" />
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-amber-700">Stock Quantity</Label>
              <Input type="number" step="any" v-model="formData.stock_quantity" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-blue-700">New Pro Quantity</Label>
              <Input type="number" step="any" v-model="formData.new_pro_quantity" class="h-8 text-sm" />
            </div>
            <div class="space-y-1.5">
              <Label class="text-xs font-medium text-emerald-700">Forecast Quantity</Label>
              <Input type="number" step="any" v-model="formData.forecast" class="h-8 text-sm" />
            </div>
          </div>
        </div>

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

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">Hủy</Button>
          <Button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
