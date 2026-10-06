import * as XLSX from 'xlsx';
import { getSaturdaysInCycle } from '@/lib/date-utils';

const DAY_FIELDS = ['day_1', 'day_2', 'day_3', 'day_4', 'day_5', 'day_6', 'day_7'] as const;

export const FORECAST_COLUMNS = [
  { key: 'yarn_type_1', label: 'Loại sợi 1', example: 'Cotton 32s' },
  { key: 'yarn_type_2', label: 'Loại sợi 2', example: 'Polyester 40s' },
  { key: 'yarn_type_3', label: 'Loại sợi 3', example: 'TC 65/35' },
  { key: 'yarn_type_4', label: 'Loại sợi 4', example: '' },
  { key: 'yarn_type_5', label: 'Loại sợi 5', example: '' },
  { key: 'yarn_type_6', label: 'Loại sợi 6', example: '' },
  { key: 'grade', label: 'Cấp (Grade)', example: 'Grade A' },
  { key: 'buyer', label: 'Khách hàng (Buyer)', example: 'Uniqlo' },
  { key: 'brand', label: 'Thương hiệu (Brand)', example: 'Nike' },
  { key: 'stock_quantity', label: 'Tồn kho (Stock)', example: 1200 },
  { key: 'new_pro_quantity', label: 'SX Mới (New Pro)', example: 5000 },
  { key: 'forecast', label: 'Dự báo (Forecast)', example: 6200 },
  { key: 'application', label: 'Ứng dụng (Application)', example: 'Dệt kim' },
];

/**
 * Lấy danh sách label cho các cột day_1 - day_7 theo định dạng DD-MM
 */
export function getDayColumnLabels(selectedDate?: string): string[] {
  const cycleDates = getSaturdaysInCycle(selectedDate);
  return cycleDates.map((cd) => {
    const day = String(cd.date.getDate()).padStart(2, '0');
    const month = String(cd.date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  });
}

/**
 * Lấy danh sách cột day động
 */
export function getDynamicDayColumns(selectedDate?: string): { key: string; label: string; example: number }[] {
  const labels = getDayColumnLabels(selectedDate);
  return labels.map((label, idx) => ({
    key: `day_${idx + 1}`,
    label: `Ngày ${label}`,
    example: 800,
  }));
}

/**
 * Tải file Excel mẫu để người dùng điền và import
 */
export function downloadSampleTemplate(forecastTypeName: string = 'main', selectedDate?: string) {
  const dayColumns = getDynamicDayColumns(selectedDate);
  const allColumns = [
    ...FORECAST_COLUMNS,
    ...dayColumns,
  ];

  const headers = allColumns.map((c) => c.key);
  const headerLabels = allColumns.map((c) => c.label);
  const sampleRow1 = allColumns.reduce((acc, col) => {
    acc[col.key] = col.example;
    return acc;
  }, {} as any);

  const sampleRow2: Record<string, any> = {
    yarn_type_1: 'CVC 60/40',
    yarn_type_2: 'Spun Poly',
    yarn_type_3: '',
    yarn_type_4: '',
    yarn_type_5: '',
    yarn_type_6: '',
    grade: 'Grade B',
    buyer: 'Adidas',
    brand: 'Originals',
    stock_quantity: 800,
    new_pro_quantity: 3500,
    forecast: 4300,
    application: 'Dệt thoi',
  };

  dayColumns.forEach((col, idx) => {
    sampleRow2[col.key] = 600 + idx * 50;
  });

  const wsData = [
    headerLabels,
    headers.map((k) => sampleRow1[k]),
    headers.map((k) => sampleRow2[k]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headerLabels.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  XLSX.writeFile(wb, `Mau-Import-Forecast-${forecastTypeName}.xlsx`);
}

/**
 * Đọc và parse dữ liệu từ file Excel tải lên
 */
export async function parseExcelFile(file: File, defaultType: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        const mappedItems = jsonData.map((row: any) => {
          const getItem = (key: string, label: string) => {
            if (row[key] !== undefined && row[key] !== '') return row[key];
            if (row[label] !== undefined && row[label] !== '') return row[label];
            const keys = Object.keys(row);
            const found = keys.find((k) => k === label || k.startsWith(label + ' (') || k.includes(label));
            return found && row[found] !== '' ? row[found] : '';
          };

          const parseNum = (val: any) => {
            const num = parseFloat(String(val).replace(/,/g, ''));
            return isNaN(num) ? 0 : num;
          };

          // Parse day values based on "Ngày DD-MM" columns
          const dayValues: Record<string, number> = {};
          const keys = Object.keys(row);
          let dayIndex = 1;

          for (const key of keys) {
            if (key.match(/^Ngày\s+\d{2}-\d{2}$/i) && dayIndex <= 7) {
              dayValues[`day_${dayIndex}`] = parseNum(row[key]);
              dayIndex++;
            }
          }

          return {
            forecast_type: defaultType,
            yarn_type_1: String(getItem('yarn_type_1', 'Loại sợi 1') || '').trim(),
            yarn_type_2: String(getItem('yarn_type_2', 'Loại sợi 2') || '').trim(),
            yarn_type_3: String(getItem('yarn_type_3', 'Loại sợi 3') || '').trim(),
            yarn_type_4: String(getItem('yarn_type_4', 'Loại sợi 4') || '').trim(),
            yarn_type_5: String(getItem('yarn_type_5', 'Loại sợi 5') || '').trim(),
            yarn_type_6: String(getItem('yarn_type_6', 'Loại sợi 6') || '').trim(),
            grade: String(getItem('grade', 'Cấp (Grade)') || getItem('grade', 'Grade') || getItem('group', 'Nhóm') || '').trim(),
            buyer: String(getItem('buyer', 'Khách hàng') || '').trim(),
            brand: String(getItem('brand', 'Thương hiệu') || '').trim(),
            stock_quantity: parseNum(getItem('stock_quantity', 'Tồn kho')),
            new_pro_quantity: parseNum(getItem('new_pro_quantity', 'SX Mới')),
            forecast: parseNum(getItem('forecast', 'Dự báo')),
            application: String(getItem('application', 'Ứng dụng') || '').trim(),
            day_1: dayValues['day_1'] || 0,
            day_2: dayValues['day_2'] || 0,
            day_3: dayValues['day_3'] || 0,
            day_4: dayValues['day_4'] || 0,
            day_5: dayValues['day_5'] || 0,
            day_6: dayValues['day_6'] || 0,
            day_7: dayValues['day_7'] || 0,
          };
        });

        resolve(mappedItems);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Xuất dữ liệu forecast ra file Excel
 */
export function exportForecastToExcel(items: any[], filenamePrefix: string = 'Forecast') {
  if (!items || items.length === 0) return;

  const data = items.map((item, idx) => ({
    STT: idx + 1,
    'Loại Forecast': item.forecast_type,
    Tháng: item.month || '',
    'Loại sợi 1': item.yarn_type_1 || '',
    'Loại sợi 2': item.yarn_type_2 || '',
    'Loại sợi 3': item.yarn_type_3 || '',
    'Loại sợi 4': item.yarn_type_4 || '',
    'Loại sợi 5': item.yarn_type_5 || '',
    'Loại sợi 6': item.yarn_type_6 || '',
    'Cấp (Grade)': item.grade || '',
    'Khách hàng (Buyer)': item.buyer || '',
    'Thương hiệu (Brand)': item.brand || '',
    'Tồn kho': Number(item.stock_quantity || 0),
    'SX Mới': Number(item.new_pro_quantity || 0),
    'Dự báo (Forecast)': Number(item.forecast || 0),
    'Ứng dụng': item.application || '',
    'Day 1': Number(item.day_1 || 0),
    'Day 2': Number(item.day_2 || 0),
    'Day 3': Number(item.day_3 || 0),
    'Day 4': Number(item.day_4 || 0),
    'Day 5': Number(item.day_5 || 0),
    'Day 6': Number(item.day_6 || 0),
    'Day 7': Number(item.day_7 || 0),
    'Người tạo': item.created_by || '',
    'Ngày tạo': item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ForecastData');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}-${today}.xlsx`);
}
