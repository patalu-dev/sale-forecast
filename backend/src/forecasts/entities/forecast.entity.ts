import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ForecastType {
  MAIN = 'forecast_main',
  EXCEPTION = 'forecast_exception',
  NO_FORECAST = 'no_forecast',
}

@Entity('forecasts')
export class Forecast {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ForecastType,
    default: ForecastType.MAIN,
  })
  forecast_type: ForecastType;

  @Column({ length: 50, nullable: true })
  month: string;

  @Column({ length: 100, nullable: true })
  yarn_type_1: string;

  @Column({ length: 100, nullable: true })
  yarn_type_2: string;

  @Column({ length: 100, nullable: true })
  yarn_type_3: string;

  @Column({ length: 100, nullable: true })
  yarn_type_4: string;

  @Column({ length: 100, nullable: true })
  yarn_type_5: string;

  @Column({ length: 100, nullable: true })
  yarn_type_6: string;

  @Column({ length: 100, nullable: true })
  grade: string;

  @Column({ length: 100, nullable: true })
  buyer: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  stock_quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  new_pro_quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  forecast: number;

  @Column({ length: 255, nullable: true })
  application: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_1: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_2: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_3: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_4: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_5: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_6: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  day_7: number;

  @Column({ length: 100, nullable: true })
  created_by: string;

  @Index()
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
