import { Controller, Post, Body, Get, UseGuards, Request, Res, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.username, body.password);
    const tokens = await this.authService.login(user);

    // Set httpOnly cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Send cookie over HTTPS only in production
      sameSite: 'lax', // Changed to lax for better compatibility
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Send cookie over HTTPS only in production
      sameSite: 'lax', // Changed to lax for better compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { user: tokens.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Post('refresh')
  async refreshTokens(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refresh_token;
    const userId = req.body.userId || req.user?.id;
    
    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    // Update httpOnly cookies
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Send cookie over HTTPS only in production
      sameSite: 'lax', // Changed to lax for better compatibility
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Send cookie over HTTPS only in production
      sameSite: 'lax', // Changed to lax for better compatibility
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);

    // Clear cookies (options must match the ones used when setting)
    const clearOpts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
    res.clearCookie('access_token', clearOpts);
    res.clearCookie('refresh_token', clearOpts);

    return { message: 'Logged out successfully' };
  }

}
