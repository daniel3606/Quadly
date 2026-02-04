import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from './email.service';
import {
  RequestEmailCodeInput,
  VerifyEmailCodeInput,
  LoginInput,
  OnboardingInput,
} from '@quadly/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async requestEmailCode(input: RequestEmailCodeInput) {
    const { email } = input;

    // Check if email is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code
    await this.prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expires_at: expiresAt,
      },
    });

    // Send email (in production, implement actual email sending)
    await this.emailService.sendVerificationCode(email, code);

    return {
      message: 'Verification code sent to email',
      expiresIn: 600, // seconds
    };
  }

  async verifyEmailCode(input: VerifyEmailCodeInput) {
    const { email, code } = input;

    const verificationCode = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Mark code as used
    await this.prisma.emailVerificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          email_verified: true,
          nickname: email.split('@')[0], // Default nickname
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { email_verified: true },
      });
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        email_verified: user.email_verified,
        role: user.role,
      },
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or deleted');
    }

    // Update last active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_active_at: new Date() },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        email_verified: user.email_verified,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  }

  async validateOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const { googleId, email, firstName, lastName } = data;

    // Check if user exists by Google ID
    let user = await this.prisma.user.findUnique({
      where: { google_id: googleId },
    });

    if (user) {
      // Update last active
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { last_active_at: new Date() },
      });
      return user;
    }

    // Check if user exists by email
    user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          google_id: googleId,
          email_verified: true,
          last_active_at: new Date(),
        },
      });
      return user;
    }

    // Create new user
    const nickname = firstName && lastName
      ? `${firstName} ${lastName}`
      : email.split('@')[0];

    user = await this.prisma.user.create({
      data: {
        email,
        google_id: googleId,
        email_verified: true,
        nickname,
        school: 'UMICH',
      },
    });

    return user;
  }

  generateTokenForUser(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async completeOnboarding(userId: string, input: OnboardingInput) {
    const { graduation_year, gender, major } = input;

    // Convert gender to Prisma enum format (uppercase)
    const genderEnum = gender.toUpperCase() as 'MALE' | 'FEMALE' | 'NONBINARY';

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        graduation_year,
        gender: genderEnum,
        major,
        onboarding_completed: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      email_verified: user.email_verified,
      role: user.role,
      school: user.school,
      graduation_year: user.graduation_year,
      gender: user.gender?.toLowerCase() || null,
      major: user.major,
      onboarding_completed: user.onboarding_completed,
      profile_image_url: user.profile_image_url,
    };
  }
}
