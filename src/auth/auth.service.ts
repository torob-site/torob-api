import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SendCodeDto, VerifyCodeDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async sendCode({ phone }: SendCodeDto) {}

  async verifyCode({ code, phone }: VerifyCodeDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        phone,
      },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const token = await this.jwt.sign({ sub: user.id });
    return {
      token: token,
    };
  }
}
