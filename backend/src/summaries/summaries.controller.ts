import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get()
  async search(@Query('month') month: string) {
    console.log('[Summaries] month:', month);
    const result = await this.summariesService.search(month);
    console.log('[Summaries] result keys:', Object.keys(result));
    console.log('[Summaries] summaryPKD:', result.summaryPKD ? 'has data' : 'null');
    console.log('[Summaries] summaryLocal:', result.summaryLocal ? 'has data' : 'null');
    console.log('[Summaries] summaryPerUser count:', result.summaryPerUser.length);
    return result;
  }
}
