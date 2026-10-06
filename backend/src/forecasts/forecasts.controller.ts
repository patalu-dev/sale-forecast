import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { ForecastsService } from './forecasts.service';
import { CreateForecastDto } from './dto/create-forecast.dto';
import { BulkCreateForecastDto } from './dto/bulk-create-forecast.dto';
import { UpdateForecastDto } from './dto/update-forecast.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesGuard } from '../ability/policies.guard';
import { CheckPolicies } from '../ability/check-policies.decorator';
import { AbilityFactory } from '../ability/ability.factory';

@UseGuards(JwtAuthGuard)
@Controller('forecasts')
export class ForecastsController {
  constructor(
    private readonly forecastsService: ForecastsService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  private async assertOwn(
    req: any,
    action: 'update' | 'delete',
    createdBy: string | null,
  ) {
    const ability = await this.abilityFactory.createForUser({
      id: req.user.id,
      username: req.user.username,
      roles: req.user.roles,
    });
    if (!ability.can(action, subject('Forecast', { created_by: createdBy ?? undefined }))) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên dữ liệu của người khác');
    }
  }

  @Get()
  findAll(
    @Query('selectedDate') selectedDate: string,
    @Query('group') group: string,
    @Query('all') all: string,
    @Query('username') username: string,
    @Req() req: any,
  ) {
    const resolvedUsername = username || (all ? undefined : (group ? undefined : req.user?.username));
    return this.forecastsService.findAllByDate(selectedDate, resolvedUsername, group);
  }

  @Get('cycle-info')
  getCycleInfo(@Query('selectedDate') selectedDate?: string) {
    return this.forecastsService.calculateCycleRange(selectedDate);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.forecastsService.findOne(id);
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Forecast' })
  create(@Body() createForecastDto: CreateForecastDto, @Req() req: any) {
    return this.forecastsService.create(createForecastDto, req.user?.username);
  }

  @Post('bulk')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Forecast' })
  bulkCreate(@Body() bulkDto: BulkCreateForecastDto, @Req() req: any) {
    return this.forecastsService.bulkCreate(bulkDto, req.user?.username);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Forecast' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateForecastDto: UpdateForecastDto,
    @Req() req: any,
  ) {
    const row = await this.forecastsService.findOne(id);
    await this.assertOwn(req, 'update', row.created_by);
    return this.forecastsService.update(id, updateForecastDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Forecast' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const row = await this.forecastsService.findOne(id);
    await this.assertOwn(req, 'delete', row.created_by);
    return this.forecastsService.remove(id);
  }
}
