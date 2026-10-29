import { ForecastsService } from './forecasts.service';

describe('ForecastsService - calculateCycleRange', () => {
  let service: ForecastsService;

  beforeEach(() => {
    service = new ForecastsService({} as any);
  });

  it('should return full calendar month for a mid-month date (15th Sep)', () => {
    const cycle = service.calculateCycleRange('2026-09-15');
    expect(cycle.startDate).toBe('2026-09-01 00:00:00');
    expect(cycle.endDate).toBe('2026-09-30 23:59:59');
    expect(cycle.label).toBe('Tháng 09/2026');
    expect(cycle.cycleMonth).toBe('2026-09');
  });

  it('should return full calendar month for a month-end date (30th Sep)', () => {
    const cycle = service.calculateCycleRange('2026-09-30');
    expect(cycle.startDate).toBe('2026-09-01 00:00:00');
    expect(cycle.endDate).toBe('2026-09-30 23:59:59');
    expect(cycle.label).toBe('Tháng 09/2026');
    expect(cycle.cycleMonth).toBe('2026-09');
  });

  it('should handle February in a leap year', () => {
    const cycle = service.calculateCycleRange('2028-02-10');
    expect(cycle.startDate).toBe('2028-02-01 00:00:00');
    expect(cycle.endDate).toBe('2028-02-29 23:59:59');
    expect(cycle.label).toBe('Tháng 02/2028');
    expect(cycle.cycleMonth).toBe('2028-02');
  });

  it('should handle February in a non-leap year', () => {
    const cycle = service.calculateCycleRange('2026-02-15');
    expect(cycle.startDate).toBe('2026-02-01 00:00:00');
    expect(cycle.endDate).toBe('2026-02-28 23:59:59');
    expect(cycle.label).toBe('Tháng 02/2026');
    expect(cycle.cycleMonth).toBe('2026-02');
  });

  it('should handle December (no year rollover)', () => {
    const cycle = service.calculateCycleRange('2026-12-25');
    expect(cycle.startDate).toBe('2026-12-01 00:00:00');
    expect(cycle.endDate).toBe('2026-12-31 23:59:59');
    expect(cycle.label).toBe('Tháng 12/2026');
    expect(cycle.cycleMonth).toBe('2026-12');
  });
});
