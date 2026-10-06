import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Target } from './entities/target.entity';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(Target)
    private readonly targetRepository: Repository<Target>,
  ) {}

  async findAll(month?: string, username?: string): Promise<Target[]> {
    const qb = this.targetRepository.createQueryBuilder('t');
    if (month) {
      qb.where('t.month = :month', { month });
    }
    if (username) {
      qb.andWhere('t.created_by = :username', { username });
    }
    return qb.orderBy('t.month', 'DESC').addOrderBy('t.createdAt', 'DESC').getMany();
  }

  async findByMonthAndUser(month: string, username?: string): Promise<Target | null> {
    return this.targetRepository.findOne({ where: { month, created_by: username } });
  }

  /**
   * Tổng target trong tháng:
   * - all=true: toàn bộ target tồn tại trong tháng (phòng kinh doanh)
   * - group: tổng target của các user thuộc group (local/export)
   */
  async sumByMonth(month: string, group?: string, all?: boolean): Promise<{ target: number; buyer_network: number; buyer: number }> {
    const qb = this.targetRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.target), 0)', 'target')
      .addSelect('COALESCE(SUM(t.buyer_network), 0)', 'buyer_network')
      .addSelect('COALESCE(SUM(t.buyer), 0)', 'buyer')
      .where('t.month = :month', { month });
    if (!all && group) {
      qb.andWhere('t.created_by IN (SELECT u.username FROM users u WHERE u.group = :group)', { group });
    }
    const raw = await qb.getRawOne();
    return {
      target: Number(raw?.target || 0),
      buyer_network: Number(raw?.buyer_network || 0),
      buyer: Number(raw?.buyer || 0),
    };
  }

  /**
   * Đảm bảo user có target cho kỳ tháng hiện tại (chu kỳ 21).
   * Thêm 1 dòng mới: copy target tháng trước (cùng user) và đổi month sang tháng hiện tại.
   */
  async ensureTargetForCurrentCycle(username: string): Promise<Target | null> {
    const currentMonth = this.getCycleMonth();
    const prevMonth = this.previousMonth(currentMonth);

    const existing = await this.findByMonthAndUser(currentMonth, username);
    if (existing) {
      return existing;
    }

    const prev = await this.findByMonthAndUser(prevMonth, username);
    if (!prev) {
      console.log(`[TargetsService] no target for ${username} in ${currentMonth} and no previous (${prevMonth}), skip copy`);
      return null;
    }

    const target = this.targetRepository.create({
      month: currentMonth,
      target: prev.target,
      buyer_network: prev.buyer_network,
      buyer: prev.buyer,
      created_by: username,
    });
    const saved = await this.targetRepository.save(target);
    console.log(`[TargetsService] copied target for ${username} from ${prevMonth} to ${currentMonth}, id=${saved.id}`);
    return saved;
  }

  /**
   * Kỳ tháng của ngày hôm nay theo chu kỳ 21:
   * ngày < 21 => tháng hiện tại; ngày >= 21 => tháng tiếp theo. Format YYYY-MM.
   */
  private getCycleMonth(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if (d < 21) {
      return `${y}-${String(m).padStart(2, '0')}`;
    }
    let nextYear = y;
    let nextMonth = m + 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear = y + 1;
    }
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }

  private previousMonth(month: string): string {
    const [y, m] = month.split('-').map(Number);
    let py = y;
    let pm = m - 1;
    if (pm === 0) {
      pm = 12;
      py -= 1;
    }
    return `${py}-${String(pm).padStart(2, '0')}`;
  }

  async findOne(id: number): Promise<Target> {
    const target = await this.targetRepository.findOne({ where: { id } });
    if (!target) {
      throw new NotFoundException(`Target with ID ${id} not found`);
    }
    return target;
  }

  async create(createTargetDto: CreateTargetDto, username?: string): Promise<Target> {
    const target = this.targetRepository.create({
      ...createTargetDto,
      created_by: username || 'System',
    });
    return this.targetRepository.save(target);
  }

  async update(id: number, updateTargetDto: UpdateTargetDto): Promise<Target> {
    const target = await this.findOne(id);
    Object.assign(target, updateTargetDto);
    return this.targetRepository.save(target);
  }

  async remove(id: number): Promise<{ message: string }> {
    const target = await this.findOne(id);
    await this.targetRepository.remove(target);
    return { message: `Target #${id} deleted successfully` };
  }
}