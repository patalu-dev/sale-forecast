import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTargetDto {
  @IsString()
  @IsNotEmpty()
  month: string;

  @IsNumber()
  @IsNotEmpty()
  target: number;

  @IsNumber()
  @IsOptional()
  buyer_network?: number;

  @IsNumber()
  @IsOptional()
  buyer?: number;
}