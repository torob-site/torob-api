import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserSelectCity } from './user.dto';
import { ShopType } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async me(user_id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: user_id,
      },
      include: {
        city: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }

  async selectCity({ city_id }: UserSelectCity, user_id: number) {
    await this.prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        city_id,
      },
    });
    return { status: 200 };
  }
}
