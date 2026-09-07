import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendCodeDto, VerifyCodeDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /**
   * TODO: سرویس پیامک هنوز وصل نیست — فعلا فقط ok برمی‌گردانیم.
   */
  async sendCode({ phone }: SendCodeDto) {
    return { message: 'ok' };
  }

  /**
   * TODO: کد واقعی هنوز نداریم — کد الکی است و فقط شماره موبایل ملاک است.
   * اگر کاربر با این شماره وجود نداشته باشد ساخته می‌شود (ورود یا ثبت‌نام).
   */
  async verifyCode({ code, phone }: VerifyCodeDto) {
    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });

    const token = await this.jwt.sign({ sub: user.id });

    return {
      token: token,
    };
  }
}
