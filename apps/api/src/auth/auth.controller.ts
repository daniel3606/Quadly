import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  requestEmailCodeSchema,
  verifyEmailCodeSchema,
  loginSchema,
} from '@quadly/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-email-code')
  @ApiOperation({ summary: 'Request email verification code' })
  async requestEmailCode(@Body() body: unknown) {
    const input = requestEmailCodeSchema.parse(body);
    return this.authService.requestEmailCode(input);
  }

  @Post('verify-email-code')
  @ApiOperation({ summary: 'Verify email code and register/login' })
  async verifyEmailCode(@Body() body: unknown) {
    const input = verifyEmailCodeSchema.parse(body);
    return this.authService.verifyEmailCode(input);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() body: unknown) {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Request() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      nickname: req.user.nickname,
      email_verified: req.user.email_verified,
      role: req.user.role,
      school: req.user.school,
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateTokenForUser(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.WEB_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('universities')
  @ApiOperation({ summary: 'Get list of supported universities' })
  async getUniversities() {
    return {
      universities: [
        {
          id: 'UMICH',
          name: 'University of Michigan',
          domain: 'umich.edu',
        },
      ],
    };
  }
}
