import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Forecast } from '../forecasts/entities/forecast.entity';
import { Target } from '../targets/entities/target.entity';

/**
 * Seed dữ liệu khớp với trạng thái hiện tại của Database
 * Usage: pnpm run seed:all
 */

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'nest_vue_with_auth',
  entities: [Permission, Role, User, Forecast, Target],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('📦 Kết nối database thành công!\n');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // =============================================
  // 1. TẠO PERMISSIONS (19 items)
  // =============================================
  console.log('━━━ BƯỚC 1: Cập nhật Permissions ━━━');

  const OWN_COND: Record<string, any> = { created_by: '${user.username}' };

  type SeedPerm = { name: string; action: string; subject: string; description: string; inverted: boolean; conditions?: Record<string, any> };
  const defaultPermissions: SeedPerm[] = [
    { name: 'Toàn quyền', action: 'manage', subject: 'all', description: 'Toàn quyền quản lý hệ thống', inverted: false },
    { name: 'Xem tất cả', action: 'read', subject: 'all', description: 'Xem tất cả thông tin', inverted: false },
    { name: 'Xem menu người dùng', action: 'view', subject: 'User', description: 'Xem menu User', inverted: false },
    { name: 'Tạo người dùng', action: 'create', subject: 'User', description: 'Tạo người dùng mới', inverted: false },
    { name: 'Xem người dùng', action: 'read', subject: 'User', description: 'Xem thông tin người dùng', inverted: false },
    { name: 'Sửa người dùng', action: 'update', subject: 'User', description: 'Cập nhật thông tin người dùng', inverted: false },
    { name: 'Xóa người dùng', action: 'delete', subject: 'User', description: 'Xóa người dùng', inverted: false },
    { name: 'Xem menu vai trò', action: 'view', subject: 'Role', description: 'Xem menu Role', inverted: false },
    { name: 'Tạo vai trò', action: 'create', subject: 'Role', description: 'Tạo vai trò mới', inverted: false },
    { name: 'Xem vai trò', action: 'read', subject: 'Role', description: 'Xem thông tin vai trò', inverted: false },
    { name: 'Sửa vai trò', action: 'update', subject: 'Role', description: 'Cập nhật vai trò', inverted: false },
    { name: 'Xóa vai trò', action: 'delete', subject: 'Role', description: 'Xóa vai trò', inverted: false },
    { name: 'Xem menu quyền', action: 'view', subject: 'Permission', description: 'Xem menu Permission', inverted: false },
    { name: 'Tạo quyền', action: 'create', subject: 'Permission', description: 'Tạo quyền mới', inverted: false },
    { name: 'Xem quyền', action: 'read', subject: 'Permission', description: 'Xem thông tin quyền', inverted: false },
    { name: 'Sửa quyền', action: 'update', subject: 'Permission', description: 'Cập nhật quyền', inverted: false },
    { name: 'Xóa quyền', action: 'delete', subject: 'Permission', description: 'Xóa quyền', inverted: false },
    { name: 'Ngăn truy cập Roles', action: 'create,update,delete,view', subject: 'Role', description: 'Ngăn truy cập Roles', inverted: true },
    { name: 'Ngăn truy cập Permissions', action: 'create,update,view,delete', subject: 'Permission', description: 'Ngăn truy cập Permissions', inverted: true },
    // Menu báo cáo bán hàng
    { name: 'Xem menu Forecast', action: 'view', subject: 'Forecast', description: 'Hiển thị menu Forecast', inverted: false },
    { name: 'Xem menu Summary', action: 'view', subject: 'Summary', description: 'Hiển thị menu Summary', inverted: false },
    { name: 'Xem menu Reports', action: 'view', subject: 'Report', description: 'Hiển thị menu Reports', inverted: false },
    { name: 'Xem menu Targets', action: 'view', subject: 'Target', description: 'Hiển thị menu Targets', inverted: false },
    // Forecast của chính mình
    { name: 'Tạo forecast của mình', action: 'create', subject: 'Forecast', description: 'Tạo forecast (created_by = chính mình)', inverted: false, conditions: OWN_COND },
    { name: 'Xem forecast của mình', action: 'read', subject: 'Forecast', description: 'Xem forecast của chính mình', inverted: false, conditions: OWN_COND },
    { name: 'Sửa forecast của mình', action: 'update', subject: 'Forecast', description: 'Sửa forecast của chính mình', inverted: false, conditions: OWN_COND },
    { name: 'Xóa forecast của mình', action: 'delete', subject: 'Forecast', description: 'Xóa forecast của chính mình', inverted: false, conditions: OWN_COND },
    // Target của chính mình
    { name: 'Tạo target của mình', action: 'create', subject: 'Target', description: 'Tạo target (created_by = chính mình)', inverted: false, conditions: OWN_COND },
    { name: 'Xem target của mình', action: 'read', subject: 'Target', description: 'Xem target của chính mình', inverted: false, conditions: OWN_COND },
    { name: 'Sửa target của mình', action: 'update', subject: 'Target', description: 'Sửa target của chính mình', inverted: false, conditions: OWN_COND },
    { name: 'Xóa target của mình', action: 'delete', subject: 'Target', description: 'Xóa target của chính mình', inverted: false, conditions: OWN_COND },
  ];

  const condKey = (c: any) => (c ? JSON.stringify(c) : null);
  const savedPermissions: Permission[] = [];
  for (const perm of defaultPermissions) {
    const candidates = await permissionRepo.findBy({ action: perm.action, subject: perm.subject, inverted: perm.inverted });
    const found = candidates.find(p => condKey(p.conditions) === condKey(perm.conditions ?? null));
    if (found) {
      savedPermissions.push(found);
    } else {
      const created = await permissionRepo.save(permissionRepo.create(perm));
      console.log(`  ✅ Tạo: ${perm.action}:${perm.subject}`);
      savedPermissions.push(created);
    }
  }

  // =============================================
  // 2. TẠO ROLES & GÁN QUYỀN
  // =============================================
  console.log('\n━━━ BƯỚC 2: Cập nhật Roles ━━━');

  const rolesData = [
    {
      name: 'super_admin',
      description: 'Quản trị viên - toàn quyền',
      perms: [{ a: 'manage', s: 'all', i: false }]
    },
    {
      name: 'admin',
      description: 'Quản trị viên',
      perms: [
        { a: 'manage', s: 'all', i: false },
        { a: 'create,update,delete,view', s: 'Role', i: true },
        { a: 'create,update,view,delete', s: 'Permission', i: true }
      ]
    },
    {
      name: 'staff',
      description: 'Nhân viên',
      perms: [
        { a: 'view', s: 'Forecast', i: false },
        { a: 'view', s: 'Summary', i: false },
        { a: 'view', s: 'Report', i: false },
        { a: 'view', s: 'Target', i: false },
        { a: 'create', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'read', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'update', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'delete', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'create', s: 'Target', i: false, c: OWN_COND },
        { a: 'read', s: 'Target', i: false, c: OWN_COND },
        { a: 'update', s: 'Target', i: false, c: OWN_COND },
        { a: 'delete', s: 'Target', i: false, c: OWN_COND },
        { a: 'read', s: 'User', i: false },
      ]
    },
    {
      name: 'manager',
      description: 'Quản lý',
      perms: [
        { a: 'view', s: 'Summary', i: false },
        { a: 'view', s: 'Report', i: false },
        { a: 'read', s: 'User', i: false },
      ]
    },
    {
      name: 'user',
      description: 'Người dùng thông thường',
      perms: [
        { a: 'view', s: 'Forecast', i: false },
        { a: 'view', s: 'Summary', i: false },
        { a: 'view', s: 'Report', i: false },
        { a: 'view', s: 'Target', i: false },
        { a: 'create', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'read', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'update', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'delete', s: 'Forecast', i: false, c: OWN_COND },
        { a: 'create', s: 'Target', i: false, c: OWN_COND },
        { a: 'read', s: 'Target', i: false, c: OWN_COND },
        { a: 'update', s: 'Target', i: false, c: OWN_COND },
        { a: 'delete', s: 'Target', i: false, c: OWN_COND },
        { a: 'read', s: 'User', i: false },
      ]
    }
  ];

  const savedRoles: Record<string, Role> = {};
  for (const rData of rolesData) {
    let role = await roleRepo.findOne({ where: { name: rData.name }, relations: ['permissions'] });
    if (!role) {
      role = roleRepo.create({ name: rData.name, description: rData.description });
    }

    // Tìm các permission object tương ứng (khớp cả conditions)
    const rolePerms: Permission[] = [];
    for (const p of rData.perms) {
      const found = savedPermissions.find(sp => sp.action === p.a && sp.subject === p.s && sp.inverted === p.i && condKey(sp.conditions) === condKey((p as any).c ?? null));
      if (found) rolePerms.push(found);
    }

    role.permissions = rolePerms;
    savedRoles[rData.name] = await roleRepo.save(role);
    console.log(`  ✅ Role "${rData.name}" updated (${rolePerms.length} perms).`);
  }

  // =============================================
  // 3. TẠO USERS
  // =============================================
  console.log('\n━━━ BƯỚC 3: Cập nhật Users ━━━');

  const usersData = [
    { name: 'Super Administrator', username: 'super_admin', roles: ['super_admin'] },
    { name: 'Administrator', username: 'admin', roles: ['admin'] },
    { name: 'User', username: 'user', roles: ['user'] },
  ];

  for (const uData of usersData) {
    let user = await userRepo.findOne({ where: { username: uData.username }, relations: ['roles'] });
    if (!user) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      user = userRepo.create({
        name: uData.name,
        username: uData.username,
        password: hashedPassword,
        isActive: true,
      });
    }

    user.roles = uData.roles.map(rName => savedRoles[rName]);
    await userRepo.save(user);
    console.log(`  ✅ User "${uData.username}" updated.`);
  }

  console.log('\n🎉 Đã đồng bộ Seed data thành công!');
  await dataSource.destroy();
}

seed().catch(console.error);
