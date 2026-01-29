import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const apiUrl = configService.get<string>('API_URL') || 'http://localhost:8000';
    const callbackPath = '/api/auth/google/callback';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || `${apiUrl}${callbackPath}`;
    
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    
    // Use placeholder values if credentials are not configured
    // This allows the server to start without Google OAuth configured
    // See GOOGLE_OAUTH_SETUP.md for setup instructions
    super({
      clientID: clientID || 'placeholder-client-id',
      clientSecret: clientSecret || 'placeholder-client-secret',
      callbackURL,
      scope: ['email', 'profile'],
    });
    
    if (!clientID || !clientSecret) {
      console.warn('⚠️  Google OAuth credentials not configured. Google login will not work.');
      console.warn('   See GOOGLE_OAUTH_SETUP.md for setup instructions.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name } = profile;
    const email = emails[0]?.value;

    // Validate that email ends with umich.edu
    if (!email || !email.endsWith('@umich.edu')) {
      return done(
        new UnauthorizedException('Only University of Michigan email addresses are allowed'),
        null,
      );
    }

    const user = await this.authService.validateOrCreateGoogleUser({
      googleId: id,
      email,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
    });

    return done(null, user);
  }
}
