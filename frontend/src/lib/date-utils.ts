export interface CycleDate {
  date: Date
  label: string
  isStartDate: boolean
}

/**
 * Tính toán khoảng ngày theo tháng dương lịch và trả về danh sách các mốc cột:
 * - Luôn bắt đầu từ ngày 01 của tháng
 * - Các ngày thứ 7 (Saturday) trong tháng
 * - Luôn kết thúc ở ngày cuối cùng của tháng
 * Giới hạn tối đa 7 mốc (day_1 đến day_7 trong database)
 */
export function getCycleDates(selectedDate?: string): CycleDate[] {
  let now = new Date()
  if (selectedDate) {
    const parts = selectedDate.split('-').map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      now = new Date(parts[0], parts[1] - 1, parts[2])
    }
  }

  const y = now.getFullYear()
  const m = now.getMonth() + 1

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0)

  const result: CycleDate[] = []
  const MAX_DAYS = 7

  // Luôn thêm ngày 01 làm ngày đầu tiên
  result.push({
    date: new Date(startDate),
    label: formatCycleDate(startDate),
    isStartDate: true,
  })

  // Tìm các ngày thứ 7 trong tháng (trừ ngày cuối tháng)
  const current = new Date(startDate)
  current.setDate(current.getDate() + 1)

  while (current < endDate && result.length < MAX_DAYS - 1) {
    if (current.getDay() === 6) { // Saturday = 6
      result.push({
        date: new Date(current),
        label: formatCycleDate(current),
        isStartDate: false,
      })
    }
    current.setDate(current.getDate() + 1)
  }

  // Luôn thêm ngày cuối tháng nếu chưa có
  const lastDate = result[result.length - 1].date
  if (lastDate.getTime() !== endDate.getTime()) {
    result.push({
      date: new Date(endDate),
      label: formatCycleDate(endDate),
      isStartDate: false,
    })
  }

  return result
}

function formatCycleDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date thành YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Tính cycleMonth từ ngày chọn theo tháng dương lịch (YYYY-MM)
 */
export function getCycleMonth(dateStr?: string): string {
  let now = new Date()
  if (dateStr) {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      now = new Date(parts[0], parts[1] - 1, parts[2])
    }
  }
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}
