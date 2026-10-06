import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateForecastDto } from './create-forecast.dto';

export class BulkCreateForecastDto {
  @IsArray()
  @ArrayMaxSize(2000, { message: 'Mỗi lần import tối đa 2000 dòng' })
  @ValidateNested({ each: true })
  @Type(() => CreateForecastDto)
  items: CreateForecastDto[];
}
