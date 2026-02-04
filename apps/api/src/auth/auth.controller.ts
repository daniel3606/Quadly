import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  requestEmailCodeSchema,
  verifyEmailCodeSchema,
  loginSchema,
  onboardingSchema,
} from '@quadly/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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
      graduation_year: req.user.graduation_year,
      gender: req.user.gender?.toLowerCase() || null,
      major: req.user.major,
      onboarding_completed: req.user.onboarding_completed,
      profile_image_url: req.user.profile_image_url,
    };
  }

  @Patch('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete user onboarding' })
  async completeOnboarding(@Request() req: any, @Body() body: unknown) {
    const input = onboardingSchema.parse(body);
    return this.authService.completeOnboarding(req.user.id, input);
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Request() req: any, @Res() res: Response) {
    // Check if mobile request
    const isMobile = req.query.mobile === 'true';
    const mobileRedirectUri = req.query.redirect_uri || 'quadly://auth/callback';

    // Encode mobile redirect URI in state for retrieval in callback
    const state = isMobile ? `mobile:${encodeURIComponent(mobileRedirectUri)}` : 'web';

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    
    // Use GOOGLE_CALLBACK_URL if set, otherwise default to quadly.org
    // This MUST match the callback URL configured in GoogleStrategy and Google Cloud Console
    let callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!callbackUrl) {
      // Default to quadly.org - this matches GoogleStrategy default
      callbackUrl = 'https://quadly.org/api/auth/google/callback';
    }

    console.log('Google OAuth Initiation:', {
      isMobile,
      callbackUrl,
      clientId: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('email profile')}&` +
      `state=${state}`;

    res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    try {
      const user = req.user;
      if (!user) {
        console.error('Google OAuth callback: No user found');
        return res.status(401).send('Authentication failed');
      }

      const token = this.authService.generateTokenForUser(user);
      console.log('Google OAuth callback success:', {
        userId: user.id,
        email: user.email,
        state: req.query.state,
      });

      // Check if this is a mobile request (from state parameter)
      const state = req.query.state as string;
      if (state && state.startsWith('mobile:')) {
        // Extract the mobile redirect URI from state
        const mobileRedirectUri = decodeURIComponent(state.substring(7));
        console.log('Redirecting to mobile app:', mobileRedirectUri);
        // Redirect to mobile app with token
        return res.redirect(`${mobileRedirectUri}?token=${token}`);
      }

      // Redirect to web frontend with token
      const frontendUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
      console.log('Redirecting to web frontend:', frontendUrl);
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.status(500).send('Authentication error occurred');
    }
  }

  @Get('universities')
  @ApiOperation({ summary: 'Get list of supported universities' })
  async getUniversities() {
    return {
      universities: [
        {
          id: 'UMICH',
          name: 'University of Michigan',
          short_name: 'UMich',
          domain: 'umich.edu',
          logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Seal_of_the_University_of_Michigan.svg/200px-Seal_of_the_University_of_Michigan.svg.png',
          color: '#00274C',
        },
        {
          id: 'MSU',
          name: 'Michigan State University',
          short_name: 'MSU',
          domain: 'msu.edu',
          logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Michigan_State_Athletics_logo.svg/200px-Michigan_State_Athletics_logo.svg.png',
          color: '#18453B',
        },
        {
          id: 'OSU',
          name: 'Ohio State University',
          short_name: 'OSU',
          domain: 'osu.edu',
          logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ohio_State_Buckeyes_logo.svg/200px-Ohio_State_Buckeyes_logo.svg.png',
          color: '#BB0000',
        },
      ],
    };
  }
}
