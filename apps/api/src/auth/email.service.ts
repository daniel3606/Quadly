import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationCode(email: string, code: string) {
    // TODO: Implement actual email sending using SMTP or service like SendGrid
    // For now, just log it
    this.logger.log(`Verification code for ${email}: ${code}`);
    
    // In production, use something like:
    // await this.smtpService.send({
    //   to: email,
    //   subject: 'Quadly Verification Code',
    //   text: `Your verification code is: ${code}`,
    // });
  }
}
