import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ForecastType } from '../entities/forecast.entity';

export class CreateForecastDto {
  @IsEnum(ForecastType)
  @IsNotEmpty()
  forecast_type: ForecastType;

  @IsString()
  @IsOptional()
  month?: string;

  @IsString()
  @IsOptional()
  yarn_type_1?: string;

  @IsString()
  @IsOptional()
  yarn_type_2?: string;

  @IsString()
  @IsOptional()
  yarn_type_3?: string;

  @IsString()
  @IsOptional()
  yarn_type_4?: string;

  @IsString()
  @IsOptional()
  yarn_type_5?: string;

  @IsString()
  @IsOptional()
  yarn_type_6?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  @IsOptional()
  buyer?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @IsOptional()
  stock_quantity?: number;

  @IsNumber()
  @IsOptional()
  new_pro_quantity?: number;

  @IsNumber()
  @IsOptional()
  forecast?: number;

  @IsString()
  @IsOptional()
  application?: string;

  @IsNumber()
  @IsOptional()
  day_1?: number;

  @IsNumber()
  @IsOptional()
  day_2?: number;

  @IsNumber()
  @IsOptional()
  day_3?: number;

  @IsNumber()
  @IsOptional()
  day_4?: number;

  @IsNumber()
  @IsOptional()
  day_5?: number;

  @IsNumber()
  @IsOptional()
  day_6?: number;

  @IsNumber()
  @IsOptional()
  day_7?: number;

  @IsString()
  @IsOptional()
  record_date?: string; // Optional custom date for createdAt (e.g. YYYY-MM-DD)
}
