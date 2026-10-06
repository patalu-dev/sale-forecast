<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Target as TargetIcon, Edit2, Calendar, User, Inbox, Loader2 } from 'lucide-vue-next'
import { request } from '@/lib/api'
import { toast } from 'vue-sonner'

const { setBreadcrumbs } = useBreadcrumb()

setBreadcrumbs([
  { title: 'Chỉ tiêu bán hàng', href: '#' },
  { title: 'Quản lý Targets' },
])

const targets = ref<any[]>([])
const loading = ref(false)
const filterMonth = ref('')

const isCreateOpen = ref(false)
const createLoading = ref(false)
const createForm = reactive({
  month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  target: 0,
  buyer_network: '',
  buyer: '',
})

const isEditOpen = ref(false)
const editLoading = ref(false)
const editItem = ref<any>(null)
const editForm = reactive({
  month: '',
  target: 0,
  buyer_network: '',
  buyer: '',
})

const isDeleteOpen = ref(false)
const deleteLoading = ref(false)
const deleteItem = ref<any>(null)

const fetchTargets = async () => {
  loading.value = true
  try {
    const q = new URLSearchParams()
    if (filterMonth.value) {
      q.append('month', filterMonth.value)
    }

    const res = await request(`/targets?${q.toString()}`)
    if (!res.ok) throw new Error('Không thể tải danh sách chỉ tiêu')

    targets.value = await res.json()
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTargets()
})

const handleCreate = async () => {
  if (!createForm.month) {
    toast.error('Vui lòng nhập tháng chỉ tiêu!')
    return
  }

  createLoading.value = true
  try {
    const res = await request('/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...createForm,
        target: Number(createForm.target) || 0,
        buyer_network: Number(createForm.buyer_network) || 0,
        buyer: Number(createForm.buyer) || 0,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Lỗi khi tạo chỉ tiêu')
    }

    toast.success('Đã thêm chỉ tiêu tháng thành công!')
    isCreateOpen.value = false
    fetchTargets()
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    createLoading.value = false
  }
}

const openEdit = (item: any) => {
  editItem.value = item
  editForm.month = item.month
  editForm.target = Number(item.target) || 0
  editForm.buyer_network = item.buyer_network || ''
  editForm.buyer = item.buyer || ''
  isEditOpen.value = true
}

const handleUpdate = async () => {
  if (!editItem.value?.id) return

  editLoading.value = true
  try {
    const res = await request(`/targets/${editItem.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        target: Number(editForm.target) || 0,
        buyer_network: Number(editForm.buyer_network) || 0,
        buyer: Number(editForm.buyer) || 0,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Lỗi khi cập nhật chỉ tiêu')
    }

    toast.success('Đã cập nhật chỉ tiêu thành công!')
    isEditOpen.value = false
    fetchTargets()
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    editLoading.value = false
  }
}

const openDelete = (item: any) => {
  deleteItem.value = item
  isDeleteOpen.value = true
}
defineExpose({ openDelete })

const handleDelete = async () => {
  if (!deleteItem.value?.id) return

  deleteLoading.value = true
  try {
    const res = await request(`/targets/${deleteItem.value.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) throw new Error('Lỗi khi xóa chỉ tiêu')

    toast.success('Đã xóa chỉ tiêu thành công!')
    isDeleteOpen.value = false
    fetchTargets()
  } catch (err: any) {
    toast.error('Lỗi: ' + err.message)
  } finally {
    deleteLoading.value = false
  }
}

const formatNumber = (val: any) => {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return val
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-3">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <TargetIcon class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-slate-900">Targets</h1>
        </div>
        <p class="text-xs text-slate-500 mt-1">Lưu trữ và theo dõi kế hoạch chỉ tiêu bán hàng theo từng tháng và khách
          hàng</p>
      </div>

      <!-- <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <div class="flex items-center gap-2">
          <Input type="month" v-model="filterMonth" class="h-9 w-[160px] text-sm bg-slate-50"
            placeholder="Lọc theo tháng" />
          <Button variant="outline" size="sm" class="h-9" @click="fetchTargets">
            <Search class="w-4 h-4 mr-1" />
            Lọc
          </Button>
          <Button v-if="filterMonth" variant="ghost" size="sm" class="h-9 text-xs"
            @click="filterMonth = ''; fetchTargets()">
            Xóa lọc
          </Button>
        </div>

        <Button class="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white" @click="isCreateOpen = true">
          <Plus class="w-4 h-4" />
          Thêm chỉ tiêu
        </Button>
      </div> -->
    </div>

    <!-- Targets Table -->
    <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs text-left">
          <thead class="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 text-center w-12 border-b">STT</th>
              <th class="px-4 py-3 border-b whitespace-nowrap">Tháng (Month)</th>
              <th class="px-4 py-3 border-b whitespace-nowrap text-indigo-700 bg-indigo-50/40 font-bold">
                Chỉ tiêu (Target)
              </th>
              <th class="px-4 py-3 border-b whitespace-nowrap">Mạng lưới (Buyer Network)</th>
              <th class="px-4 py-3 border-b whitespace-nowrap">Khách hàng (Buyer)</th>
              <th class="px-4 py-3 border-b whitespace-nowrap">Người tạo</th>
              <th class="px-4 py-3 border-b whitespace-nowrap">Ngày tạo</th>
              <th class="px-4 py-3 border-b whitespace-nowrap text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            <tr v-if="loading">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center gap-2">
                  <div class="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                  <span>Đang tải danh sách chỉ tiêu...</span>
                </div>
              </td>
            </tr>

            <tr v-else-if="targets.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <div class="flex flex-col items-center justify-center gap-2">
                  <Inbox class="w-10 h-10 text-slate-300 stroke-[1.5]" />
                  <span class="text-sm font-medium text-slate-500">Chưa có chỉ tiêu nào được thiết lập</span>
                  <p class="text-xs text-slate-400">Bấm "Thêm chỉ tiêu" để tạo mục tiêu kinh doanh cho tháng</p>
                </div>
              </td>
            </tr>

            <tr v-for="(item, idx) in targets" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-4 py-3 text-center text-slate-400 font-medium">{{ idx + 1 }}</td>
              <td class="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {{ item.month }}
                </span>
              </td>
              <td class="px-4 py-3 text-indigo-700 font-bold bg-indigo-50/20 whitespace-nowrap text-sm">
                {{ formatNumber(item.target) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                {{ formatNumber(item.buyer_network) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-700">
                {{ item.buyer || '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-500">
                <span class="inline-flex items-center gap-1">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  {{ item.created_by || '-' }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-slate-500">
                <span class="inline-flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  {{ item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <Button variant="ghost" size="icon"
                    class="h-7 w-7 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" @click="openEdit(item)">
                    <Edit2 class="w-3.5 h-3.5" />
                  </Button>
                  <!-- <Button variant="ghost" size="icon" class="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50"
                    @click="openDelete(item)">
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button> -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Target Dialog -->
    <Dialog v-model:open="isCreateOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-base font-bold">Thêm chỉ tiêu tháng</DialogTitle>
          <DialogDescription>Nhập mục tiêu bán hàng cho chu kỳ tháng</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleCreate" class="space-y-3 py-2">
          <div class="space-y-1">
            <Label class="text-xs font-medium">Tháng (YYYY-MM)</Label>
            <Input v-model="createForm.month" placeholder="2026-09" required />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium text-indigo-700">Chỉ tiêu (Target quantity)</Label>
            <Input type="number" step="any" v-model="createForm.target" required />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium">Mạng lưới khách hàng (Buyer Network)</Label>
            <Input v-model="createForm.buyer_network" placeholder="Buyer Network" />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium">Khách hàng (Buyer)</Label>
            <Input v-model="createForm.buyer" placeholder="Buyer Name" />
          </div>
          <DialogFooter class="pt-3">
            <Button type="button" variant="outline" @click="isCreateOpen = false">Hủy</Button>
            <Button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white" :disabled="createLoading">
              <Loader2 v-if="createLoading" class="w-4 h-4 mr-2 animate-spin" />
              Lưu chỉ tiêu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Edit Target Dialog -->
    <Dialog v-model:open="isEditOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-base font-bold">Chỉnh sửa chỉ tiêu #{{ editItem?.id }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleUpdate" class="space-y-3 py-2">
          <div class="space-y-1">
            <Label class="text-xs font-medium">Tháng</Label>
            <Input v-model="editForm.month" required />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium text-indigo-700">Chỉ tiêu</Label>
            <Input type="number" step="any" v-model="editForm.target" required />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium">Mạng lưới khách hàng</Label>
            <Input v-model="editForm.buyer_network" />
          </div>
          <div class="space-y-1">
            <Label class="text-xs font-medium">Khách hàng</Label>
            <Input v-model="editForm.buyer" />
          </div>
          <DialogFooter class="pt-3">
            <Button type="button" variant="outline" @click="isEditOpen = false">Hủy</Button>
            <Button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white" :disabled="editLoading">
              <Loader2 v-if="editLoading" class="w-4 h-4 mr-2 animate-spin" />
              Cập nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation -->
    <AlertDialog :open="isDeleteOpen" @update:open="isDeleteOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa chỉ tiêu?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa chỉ tiêu tháng {{ deleteItem?.month }} của buyer {{ deleteItem?.buyer || 'Tất cả'
            }}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteLoading">Hủy</AlertDialogCancel>
          <AlertDialogAction class="bg-red-600 hover:bg-red-700 text-white" :disabled="deleteLoading"
            @click="handleDelete">
            Xác nhận xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
