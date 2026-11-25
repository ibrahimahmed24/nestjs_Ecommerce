import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

function getVerificationEmailTemplate(name: string, otpToken: string): string {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 500px; margin: 40px auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">🔐 تفعيل الحساب</h2>
      </div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
      <p style="font-size: 16px; color: #374151; line-height: 1.6;">أهلاً بك يا <strong>${name}</strong> في متجرنا! 👋</p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">سعداء جداً بانضمامك إلينا. يرجى استخدام رمز التفعيل (OTP) التالي لإتمام عملية إنشائك للحساب وتأكيد بريدك الإلكتروني:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827; margin: 25px 0; border: 1px dashed #cbd5e1;">
        ${otpToken}
      </div>
      
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5; background-color: #fef3c7; padding: 10px; border-radius: 6px; border-right: 4px solid #f59e0b;">
        ⚠️ هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط. إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذا الإيميل وحذفه فوراً لحماية خصوصيتك.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 30px; margin-bottom: 15px;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">هذا إيميل تلقائي، يرجى عدم الرد عليه.</p>
    </div>
  `;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async sendVerificationMail(
    email: string,
    name: string,
    otpToken: string,
  ): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'onboarding@resend.dev', // الإيميل المجاني الافتراضي الموفر من Resend للتجربة
        to: email, // إيميل العميل المستقبل
        subject: '🔐 تفعيل حسابك - خطوة واحدة وتبدأ معنا!',
        html: getVerificationEmailTemplate(name, otpToken),
      });

      if (error) {
        this.logger.error(`[Resend Error Details]: ${JSON.stringify(error)}`);
        throw new InternalServerErrorException(
          'Failed to send email via Resend provider',
        );
      }

      this.logger.log(
        `📧 Success: Verification email dispatched successfully to ${email}. ID: ${data?.id}`,
      );
    } catch (err) {
      this.logger.error(
        `Critical pipeline failure inside sendVerificationMail for recipient: ${email}`,
        err,
      );
      throw new InternalServerErrorException(
        'Account registered, but verification mail queue failed',
      );
    }
  }
}
