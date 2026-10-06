import { ForecastsService } from './forecasts.service';

describe('ForecastsService - calculateCycleRange', () => {
  let service: ForecastsService;

  beforeEach(() => {
    service = new ForecastsService({} as any);
  });

  it('should calculate cycle for day < 21 (e.g. 15th Sep): from 21st Aug to 20th Sep', () => {
    const cycle = service.calculateCycleRange('2026-09-15');
    expect(cycle.startDate).toBe('2026-08-21 00:00:00');
    expect(cycle.endDate).toBe('2026-09-20 23:59:59');
    expect(cycle.label).toBe('Kỳ 21/08/2026 - 20/09/2026');
    expect(cycle.cycleMonth).toBe('2026-09');
  });

  it('should calculate cycle for day >= 21 (e.g. 21st Sep): from 21st Sep to 20th Oct', () => {
    const cycle = service.calculateCycleRange('2026-09-21');
    expect(cycle.startDate).toBe('2026-09-21 00:00:00');
    expect(cycle.endDate).toBe('2026-10-20 23:59:59');
    expect(cycle.label).toBe('Kỳ 21/09/2026 - 20/10/2026');
    expect(cycle.cycleMonth).toBe('2026-10');
  });

  it('should handle January before 21: year rolls back to previous December', () => {
    const cycle = service.calculateCycleRange('2026-01-10');
    expect(cycle.startDate).toBe('2025-12-21 00:00:00');
    expect(cycle.endDate).toBe('2026-01-20 23:59:59');
    expect(cycle.label).toBe('Kỳ 21/12/2025 - 20/01/2026');
    expect(cycle.cycleMonth).toBe('2026-01');
  });

  it('should handle December after 21: year rolls forward to next January', () => {
    const cycle = service.calculateCycleRange('2026-12-25');
    expect(cycle.startDate).toBe('2026-12-21 00:00:00');
    expect(cycle.endDate).toBe('2027-01-20 23:59:59');
    expect(cycle.label).toBe('Kỳ 21/12/2026 - 20/01/2027');
    expect(cycle.cycleMonth).toBe('2027-01');
  });
});
