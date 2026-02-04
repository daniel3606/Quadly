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
    // Use GOOGLE_CALLBACK_URL if set, otherwise default to quadly.org
    // This ensures Google OAuth always redirects to the proper domain, not IP address
    // This MUST match the callback URL used in auth.controller.ts and Google Cloud Console
    let callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    if (!callbackURL) {
      // Default to quadly.org - this matches what mobile app expects
      // For local web development, set GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
      callbackURL = 'https://quadly.org/api/auth/google/callback';
    }
    
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    
    console.log('GoogleStrategy initialized:', {
      callbackURL,
      clientID: clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET',
      clientSecret: clientSecret ? 'SET' : 'NOT SET',
    });
    
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
    try {
      const { id, emails, name } = profile;
      const email = emails[0]?.value;

      console.log('Google OAuth validate:', {
        googleId: id,
        email,
        name: name?.givenName && name?.familyName ? `${name.givenName} ${name.familyName}` : 'N/A',
      });

      // Validate that email ends with umich.edu
      if (!email || !email.endsWith('@umich.edu')) {
        console.warn('Google OAuth rejected: Invalid email domain', { email });
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

      console.log('Google OAuth user validated/created:', { userId: user.id, email: user.email });
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth validate error:', error);
      return done(error, null);
    }
  }
}
