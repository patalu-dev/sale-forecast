import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Forecast, ForecastType } from '../forecasts/entities/forecast.entity';
import { Target } from '../targets/entities/target.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SummariesService {
  constructor(
    @InjectRepository(Forecast)
    private readonly forecastRepo: Repository<Forecast>,
    @InjectRepository(Target)
    private readonly targetRepo: Repository<Target>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private calcTotal(item: any): number {
    return (
      Number(item.day_1 || 0) +
      Number(item.day_2 || 0) +
      Number(item.day_3 || 0) +
      Number(item.day_4 || 0) +
      Number(item.day_5 || 0) +
      Number(item.day_6 || 0) +
      Number(item.day_7 || 0)
    );
  }

  private async getForecastsByMonth(month: string, created_by?: string) {
    const qb = this.forecastRepo.createQueryBuilder('f');
    qb.where('f.month = :month', { month });
    if (created_by) {
      qb.andWhere('f.created_by = :created_by', { created_by });
    }
    const items = await qb.getMany();
    return items.map((item) => ({
      ...item,
      total: this.calcTotal(item),
    }));
  }

  private async getForecastsByGroup(month: string, group: string) {
    const items = await this.forecastRepo
      .createQueryBuilder('f')
      .where('f.month = :month', { month })
      .andWhere(`f.created_by IN (SELECT username FROM users WHERE \`group\` = :group)`, { group })
      .getMany();
    return items.map((item) => ({
      ...item,
      total: this.calcTotal(item),
    }));
  }

  private async getAllForecasts(month: string) {
    const items = await this.forecastRepo
      .createQueryBuilder('f')
      .where('f.month = :month', { month })
      .getMany();
    return items.map((item) => ({
      ...item,
      total: this.calcTotal(item),
    }));
  }

  private async getTargetsByUser(month: string, username: string) {
    return this.targetRepo.findOne({ where: { month, created_by: username } });
  }

  private async getTargetsByGroup(month: string, group: string) {
    return this.targetRepo
      .createQueryBuilder('t')
      .where('t.month = :month', { month })
      .andWhere(`t.created_by IN (SELECT username FROM users WHERE \`group\` = :group)`, { group })
      .getMany();
  }

  private async getAllTargets(month: string) {
    return this.targetRepo
      .createQueryBuilder('t')
      .where('t.month = :month', { month })
      .getMany();
  }

  private buildSummary(
    label: string,
    forecasts: any[],
    targets: any[],
    kpiTarget: number,
  ) {
    const mains = forecasts.filter((f) => f.forecast_type === ForecastType.MAIN);
    const exceptions = forecasts.filter((f) => f.forecast_type === ForecastType.EXCEPTION);
    const noForecasts = forecasts.filter((f) => f.forecast_type === ForecastType.NO_FORECAST);

    if (targets.length === 0 && mains.length === 0 && exceptions.length === 0 && noForecasts.length === 0) {
      return null;
    }

    const kpis = targets.reduce((s, t) => s + Number(t.target || 0), 0);
    const buyernetwork = targets.reduce((s, t) => s + Number(t.buyer_network || 0), 0);

    const sumForecastMain = mains.reduce((s, f) => s + Number(f.forecast || 0), 0);
    const sumForecastException = exceptions.reduce((s, f) => s + Number(f.forecast || 0), 0);
    const forecastSum = sumForecastMain + sumForecastException;
    const forecast = forecastSum > 0 ? forecastSum : 1;

    const stockqty =
      mains.reduce((s, f) => s + Number(f.stock_quantity || 0), 0) +
      exceptions.reduce((s, f) => s + Number(f.stock_quantity || 0), 0);

    const realized =
      mains.reduce((s, f) => s + Number(f.total || 0), 0) +
      exceptions.reduce((s, f) => s + Number(f.total || 0), 0);

    const realized_out_dk = noForecasts.reduce((s, f) => s + Number(f.total || 0), 0);

    const total_realized = realized + realized_out_dk;

    const percent_forecast = kpis > 0 ? forecast / kpis : 0;
    const percent_realized = forecast > 0 ? realized / forecast : 0;
    const percent_realized_out_dk = forecast > 0 ? realized_out_dk / forecast : 0;
    const percent_vs_buyer_network = buyernetwork > 0 ? total_realized / buyernetwork : 0;
    const percent_realized_in_fc = percent_vs_buyer_network * (forecast > 0 ? realized / forecast : 0);
    const percent_total_realized = (forecast > 0 ? total_realized / forecast : 0) * percent_vs_buyer_network;

    const new_prod = forecast - stockqty;
    const realized_new_prod = realized;
    const percent_realized_new_prod = realized_new_prod > 0 ? realized / realized_new_prod : realized / 1;

    const out_dk_new_prod = realized_out_dk;
    const percent_out_dk_new_prod = forecast > 0 ? out_dk_new_prod / forecast : 0;

    const percent_total_realized_vs_kpi = kpiTarget > 0 ? total_realized / kpiTarget : 0;

    return {
      user: label,
      kpis,
      buyernetwork,
      forecast,
      percent_forecast,
      stockqty,
      realized,
      percent_realized,
      realized_out_dk,
      percent_realized_out_dk,
      total_realized,
      percent_vs_buyer_network,
      percent_realized_in_fc,
      percent_total_realized,
      new_prod,
      realized_new_prod,
      percent_realized_new_prod,
      out_dk_new_prod,
      percent_out_dk_new_prod,
      percent_total_realized_vs_kpi,
      targets,
      forecasts,
    };
  }

  async search(month: string) {
    console.log('[SummariesService] search month:', month);

    const users = await this.userRepo
      .createQueryBuilder('u')
      .where(`u.group IN (:...groups)`, { groups: ['local', 'export'] })
      .andWhere('u.isActive = 1')
      .orderBy('u.username')
      .getMany();

    console.log('[SummariesService] users found:', users.length, users.map(u => u.username));

    const summaryPerUser: any[] = [];

    for (const user of users) {
      const forecasts = await this.getForecastsByMonth(month, user.username);
      const target = await this.getTargetsByUser(month, user.username);
      console.log(`[SummariesService] user=${user.username} forecasts=${forecasts.length} target=${target ? 'yes' : 'no'}`);
      if (target || forecasts.length > 0) {
        const summary = this.buildSummary(
          user.username,
          forecasts,
          target ? [target] : [],
          Number(target?.target || 0),
        );
        if (summary) summaryPerUser.push(summary);
      }
    }

    const localForecasts = await this.getForecastsByGroup(month, 'local');
    const localTargets = await this.getTargetsByGroup(month, 'local');
    const summaryLocal = this.buildSummary('LOCAL', localForecasts, localTargets, 3000000);
    console.log('[SummariesService] local:', localForecasts.length, 'forecasts,', localTargets.length, 'targets');

    const exportForecasts = await this.getForecastsByGroup(month, 'export');
    const exportTargets = await this.getTargetsByGroup(month, 'export');
    const summaryExport = this.buildSummary('EXPORT', exportForecasts, exportTargets, 2200000);
    console.log('[SummariesService] export:', exportForecasts.length, 'forecasts,', exportTargets.length, 'targets');

    const allForecasts = await this.getAllForecasts(month);
    const allTargets = await this.getAllTargets(month);
    const summaryPKD = this.buildSummary('PKD', allForecasts, allTargets, 5200000);
    console.log('[SummariesService] pkd:', allForecasts.length, 'forecasts,', allTargets.length, 'targets');

    return {
      summaryPerUser,
      summaryLocal,
      summaryExport,
      summaryPKD,
    };
  }
}
