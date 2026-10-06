export interface CycleDate {
  date: Date
  label: string
  isStartDate: boolean
}

/**
 * Tính toán khoảng ngày theo chu kỳ 21 và trả về danh sách ngày thứ 7 (Saturday)
 * - Nếu ngày < 21: Từ 21 tháng trước đến 20 tháng đang chọn
 * - Nếu ngày >= 21: Từ 21 tháng đang chọn đến 20 tháng sau
 * Ngày đầu tiên luôn là ngày 21 (dù có phải thứ 7 hay không)
 * Giới hạn tối đa 7 ngày (day_1 đến day_7 trong database)
 */
export function getSaturdaysInCycle(selectedDate?: string): CycleDate[] {
  let now = new Date()
  if (selectedDate) {
    const parts = selectedDate.split('-').map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      now = new Date(parts[0], parts[1] - 1, parts[2])
    }
  }

  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()

  let startDate: Date
  let endDate: Date

  if (d < 21) {
    // Từ 21 tháng trước đến 20 tháng này
    let prevYear = y
    let prevMonth = m - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear = y - 1
    }
    startDate = new Date(prevYear, prevMonth - 1, 21)
    endDate = new Date(y, m - 1, 20)
  } else {
    // Từ 21 tháng này đến 20 tháng sau
    let nextYear = y
    let nextMonth = m + 1
    if (nextMonth === 13) {
      nextMonth = 1
      nextYear = y + 1
    }
    startDate = new Date(y, m - 1, 21)
    endDate = new Date(nextYear, nextMonth - 1, 20)
  }

  const result: CycleDate[] = []
  const MAX_DAYS = 7

  // Luôn thêm ngày 21 làm ngày đầu tiên
  result.push({
    date: new Date(startDate),
    label: formatCycleDate(startDate),
    isStartDate: true,
  })

  // Tìm các ngày thứ 7 từ startDate + 1 đến endDate (trừ 1 chỗ cho ngày cuối)
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

  // Luôn thêm ngày cuối chu kỳ (ngày 20) nếu chưa có
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
 * Tính cycleMonth từ ngày chọn (giống chu kỳ 21):
 * - Ngày < 21: cycleMonth là tháng đang chọn (YYYY-MM)
 * - Ngày >= 21: cycleMonth là tháng tiếp theo (YYYY-MM)
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
  const d = now.getDate()

  if (d < 21) {
    return `${y}-${String(m).padStart(2, '0')}`
  }
  let nextYear = y
  let nextMonth = m + 1
  if (nextMonth === 13) {
    nextMonth = 1
    nextYear = y + 1
  }
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}
