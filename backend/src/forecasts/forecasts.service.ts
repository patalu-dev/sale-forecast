import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Forecast, ForecastType } from './entities/forecast.entity';
import { CreateForecastDto } from './dto/create-forecast.dto';
import { BulkCreateForecastDto } from './dto/bulk-create-forecast.dto';
import { UpdateForecastDto } from './dto/update-forecast.dto';

export interface CycleRange {
  startDate: string;
  endDate: string;
  label: string;
  selectedDate: string;
  cycleMonth: string;
}

@Injectable()
export class ForecastsService {
  constructor(
    @InjectRepository(Forecast)
    private readonly forecastRepository: Repository<Forecast>,
  ) {}

  /**
   * Tính toán khoảng ngày theo tháng dương lịch:
   * Từ ngày 01 đến ngày cuối cùng của tháng được chọn (Kỳ tháng là tháng đang chọn).
   */
  calculateCycleRange(dateStr?: string): CycleRange {
    let now = new Date();
    if (dateStr) {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        now = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }

    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-12
    const lastDay = new Date(y, m, 0).getDate();
    const mm = String(m).padStart(2, '0');

    const startDateStr = `${y}-${mm}-01 00:00:00`;
    const endDateStr = `${y}-${mm}-${String(lastDay).padStart(2, '0')} 23:59:59`;
    const label = `Tháng ${mm}/${y}`;
    const cycleMonth = `${y}-${mm}`;

    const formattedSelected = `${y}-${mm}-${String(now.getDate()).padStart(2, '0')}`;

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      label,
      selectedDate: formattedSelected,
      cycleMonth,
    };
  }

  async findAllByDate(selectedDate?: string, username?: string, group?: string) {
    const cycle = this.calculateCycleRange(selectedDate);

    const qb = this.forecastRepository
      .createQueryBuilder('f')
      .where('f.createdAt >= :startDate AND f.createdAt <= :endDate', {
        startDate: cycle.startDate,
        endDate: cycle.endDate,
      });

    if (username) {
      qb.andWhere('f.created_by = :username', { username });
    }

    if (group) {
      qb.innerJoin('users', 'u', 'u.username = f.created_by AND u.group = :group', { group });
    }

    qb.orderBy('f.id', 'ASC');

    const allItems = await qb.getMany();

    const forecastMain = allItems.filter(
      (item) => item.forecast_type === ForecastType.MAIN,
    );
    const forecastException = allItems.filter(
      (item) => item.forecast_type === ForecastType.EXCEPTION,
    );
    const noForecast = allItems.filter(
      (item) => item.forecast_type === ForecastType.NO_FORECAST,
    );

    const sumForecast = (list: Forecast[]) =>
      list.reduce((acc, curr) => acc + Number(curr.forecast || 0), 0);

    return {
      cycle,
      forecastMain,
      forecastException,
      noForecast,
      summary: {
        totalMain: forecastMain.length,
        totalException: forecastException.length,
        totalNoForecast: noForecast.length,
        totalItems: allItems.length,
        sumMainForecast: sumForecast(forecastMain),
        sumExceptionForecast: sumForecast(forecastException),
        sumNoForecast: sumForecast(noForecast),
        sumTotalForecast: sumForecast(allItems),
      },
    };
  }

  async findOne(id: number): Promise<Forecast> {
    const forecast = await this.forecastRepository.findOne({ where: { id } });
    if (!forecast) {
      throw new NotFoundException(`Forecast with ID ${id} not found`);
    }
    return forecast;
  }

  async create(createForecastDto: CreateForecastDto, username?: string): Promise<Forecast> {
    const { record_date, ...data } = createForecastDto;
    const cycle = this.calculateCycleRange(record_date);
    const forecast = this.forecastRepository.create({
      ...data,
      month: data.month || cycle.cycleMonth,
      created_by: username || 'System',
    });

    if (record_date) {
      forecast.createdAt = new Date(record_date);
    }

    return this.forecastRepository.save(forecast);
  }

  async bulkCreate(bulkDto: BulkCreateForecastDto, username?: string): Promise<{ count: number; items: Forecast[] }> {
    const entities = bulkDto.items.map((dto) => {
      const { record_date, ...data } = dto;
      const cycle = this.calculateCycleRange(record_date);
      const forecast = this.forecastRepository.create({
        ...data,
        month: data.month || cycle.cycleMonth,
        created_by: username || 'System',
      });
      if (record_date) {
        forecast.createdAt = new Date(record_date);
      }
      return forecast;
    });

    const saved = await this.forecastRepository.save(entities);
    return {
      count: saved.length,
      items: saved,
    };
  }

  async update(id: number, updateForecastDto: UpdateForecastDto): Promise<Forecast> {
    const forecast = await this.findOne(id);
    const { record_date, ...data } = updateForecastDto;

    Object.assign(forecast, data);
    if (record_date) {
      forecast.createdAt = new Date(record_date);
    }

    return this.forecastRepository.save(forecast);
  }

  async remove(id: number): Promise<{ message: string }> {
    const forecast = await this.findOne(id);
    await this.forecastRepository.remove(forecast);
    return { message: `Forecast #${id} deleted successfully` };
  }
}
