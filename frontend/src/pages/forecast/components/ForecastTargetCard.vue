<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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
import { Pencil, Save, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { request } from '@/lib/api'
import { user } from '@/composables/authState'

const props = defineProps<{
  selectedDate?: string
  username?: string
}>()

const emit = defineEmits<{
  (e: 'update', data: Target): void
}>()

export interface Target {
  id?: number
  month: string
  target: number
  buyer_network: number
  buyer: number
}

const isOpen = ref(false)
const loading = ref(false)

const target = ref<Target>({
  month: '',
  target: 0,
  buyer_network: 0,
  buyer: 0,
})

const editForm = ref<Target>({
  month: '',
  target: 0,
  buyer_network: 0,
  buyer: 0,
})

const username = computed(() => props.username || user.value?.username || '-')

const todayStr = new Date().toISOString().split('T')[0]

const resolvedDate = computed(() => props.selectedDate || todayStr)

const formatNumber = (val: any) => {
  if (val === null || val === undefined || val === '') return '0'
  const num = Number(val)
  if (isNaN(num)) return val
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)
}

const getCycleMonth = (dateStr: string): string => {
  const parts = dateStr.split('-').map(Number)
  const year = parts[0]
  const month = parts[1] - 1
  const day = parts[2]
  let targetMonth = month
  let targetYear = year
  if (day >= 21) {
    targetMonth = month + 1
    if (targetMonth > 11) {
      targetMonth = 0
      targetYear = year + 1
    }
  }
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`
}

const monthLabel = computed(() => {
  const month = getCycleMonth(resolvedDate.value)
  if (!month) return ''
  const [year, m] = month.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} Forecast`
})

const fetchTarget = async () => {
  const month = getCycleMonth(resolvedDate.value)
  try {
    const q = new URLSearchParams({ month })
    if (props.username) q.append('username', props.username)
    const res = await request(`/targets/by-period?${q.toString()}`)
    if (res.ok) {
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (data && data.id) {
        target.value = data
        editForm.value = { ...data }
      } else {
        target.value = { month, target: 0, buyer_network: 0, buyer: 0 }
        editForm.value = { ...target.value }
      }
    }
  } catch (err) {
    console.error('Failed to fetch target:', err)
  }
}

watch(() => [props.selectedDate, props.username], () => {
  fetchTarget()
})

onMounted(() => {
  fetchTarget()
})

const handleOpenEdit = () => {
  editForm.value = { ...target.value }
  isOpen.value = true
}

const handleSave = async () => {
  loading.value = true
  try {
    const payload = {
      month: editForm.value.month,
      target: Number(editForm.value.target) || 0,
      buyer_network: Number(editForm.value.buyer_network) || 0,
      buyer: Number(editForm.value.buyer) || 0,
    }

    let res
    if (target.value.id) {
      res = await request(`/targets/${target.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await request('/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    if (!res.ok) throw new Error('Lỗi khi lưu')

    const saved = await res.json()
    target.value = saved
    emit('update', target.value)
    isOpen.value = false
    toast.success('Đã cập nhật thông tin target!')
  } catch (err: any) {
    toast.error(err.message)
  } finally {
    loading.value = false
  }
}

defineExpose({ fetchTarget })
</script>

<template>
  <div
    class="bg-white rounded-xl border border-slate-200/80 shadow-xs px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <!-- Left: Month & Sale Name -->
    <div class="flex items-center gap-6">
      <div>
        <span class="text-lg font-bold text-slate-900">{{ monthLabel }}</span>
      </div>
      <div class="h-8 w-px bg-slate-200"></div>
      <div>
        <span class="text-xs text-slate-500">Sale name:</span>
        <span class="ml-1.5 font-semibold text-slate-700">{{ username }}</span>
      </div>
    </div>

    <!-- Right: Target, Buyer Network, Buyer -->
    <div class="flex items-center gap-6">
      <div>
        <span class="text-xs text-slate-500">Target:</span>
        <span class="ml-1.5 font-bold text-blue-700">{{ target.target/1000 }} ts</span>
      </div>
      <div>
        <span class="text-xs text-slate-500">Buyer Network:</span>
        <span class="ml-1.5 font-semibold text-emerald-700">{{ formatNumber(target.buyer_network) }} KG</span>
      </div>
      <div>
        <span class="text-xs text-slate-500">Buyer:</span>
        <span class="ml-1.5 font-semibold text-slate-700">{{ formatNumber(target.buyer) }}</span>
      </div>

      <!-- Edit Button -->
      <Dialog v-model:open="isOpen">
        <DialogTrigger as-child>
          <Button variant="outline" size="sm" class="gap-1.5 ml-2" @click="handleOpenEdit">
            <Pencil class="w-3.5 h-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin Target</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin target, buyer network và số lượng buyer cho tháng hiện tại.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div class="flex flex-col gap-2">
              <Label for="target">Target (ts)</Label>
              <Input
                id="target"
                v-model.number="editForm.target"
                type="number"
              />
            </div>
            <div class="flex flex-col gap-2">
              <Label for="buyerNetwork">Buyer Network</Label>
              <Input
                id="buyerNetwork"
                v-model.number="editForm.buyer_network"
                type="number"
              />
            </div>
            <div class="flex flex-col gap-2">
              <Label for="buyerCount">Buyer</Label>
              <Input
                id="buyerCount"
                v-model.number="editForm.buyer"
                type="number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="isOpen = false" :disabled="loading">Hủy</Button>
            <Button class="bg-blue-600 hover:bg-blue-700 text-white gap-2" @click="handleSave" :disabled="loading">
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>