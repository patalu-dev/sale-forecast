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
import { TargetsService } from './targets.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesGuard } from '../ability/policies.guard';
import { CheckPolicies } from '../ability/check-policies.decorator';
import { AbilityFactory } from '../ability/ability.factory';

@UseGuards(JwtAuthGuard)
@Controller('targets')
export class TargetsController {
  constructor(
    private readonly targetsService: TargetsService,
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
    if (!ability.can(action, subject('Target', { created_by: createdBy ?? undefined }))) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên dữ liệu của người khác');
    }
  }

  @Get()
  findAll(@Query('month') month?: string, @Req() req?: any) {
    return this.targetsService.findAll(month, req.user?.username);
  }

  @Get('by-period')
  findByPeriod(@Query('month') month: string, @Query('username') username: string, @Req() req: any) {
    return this.targetsService.findByMonthAndUser(month, username || req.user?.username) ?? {};
  }

  @Get('sum')
  sumByMonth(@Query('month') month: string, @Query('group') group: string, @Query('all') all: string) {
    return this.targetsService.sumByMonth(month, group, all === 'true' || all === '1');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.targetsService.findOne(id);
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Target' })
  create(@Body() createTargetDto: CreateTargetDto, @Req() req: any) {
    return this.targetsService.create(createTargetDto, req.user?.username);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Target' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTargetDto: UpdateTargetDto,
    @Req() req: any,
  ) {
    const row = await this.targetsService.findOne(id);
    await this.assertOwn(req, 'update', row.created_by);
    return this.targetsService.update(id, updateTargetDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Target' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const row = await this.targetsService.findOne(id);
    await this.assertOwn(req, 'delete', row.created_by);
    return this.targetsService.remove(id);
  }
}