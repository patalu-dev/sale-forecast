import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { Forecast } from '../forecasts/entities/forecast.entity';
import { Target } from '../targets/entities/target.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Forecast, Target, User])],
  controllers: [SummariesController],
  providers: [SummariesService],
})
export class SummariesModule {}
