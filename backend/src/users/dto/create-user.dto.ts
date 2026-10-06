import { IsString, IsEmail, IsBoolean, MaxLength, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../../utils/sanitize';
import { UserGroup } from '../entities/user.entity';

export class CreateUserDto {
    @IsString({
        message: 'Họ tên phải là một chuỗi ký tự'
    })
    @MaxLength(100, {
        message: 'Họ tên phải có độ dài tối đa 100 ký tự'
    })
    @Transform(({ value }) => sanitizeInput(value))
    name: string;

    @IsString({
        message: 'Tên đăng nhập phải là một chuỗi ký tự'
    })
    @MaxLength(50, {
        message: 'Tên đăng nhập phải có độ dài tối đa 50 ký tự'
    })
    @Transform(({ value }) => sanitizeInput(value))
    username: string;

    @IsEmail({}, {
        message: 'Email không hợp lệ'
    })
    @IsOptional()
    @Transform(({ value }) => value ? sanitizeInput(value) : value)
    email?: string;

    @IsString({
        message: 'Mật khẩu phải là một chuỗi ký tự'
    })
    @IsOptional()
    password?: string;

    @IsBoolean()
    isActive: boolean;

    @IsEnum(UserGroup, { message: 'Group phải là local hoặc export' })
    @IsOptional()
    group?: UserGroup;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    roleIds?: number[];
}
