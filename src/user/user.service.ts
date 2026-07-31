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
        shopMembers: {
          include: {
            shop: {
              select: {
                id: true,
                shop_name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const offline_panel_accesses = user.shopMembers
      .filter((member) => member.shop.type === ShopType.OFFLINE_SHOP)
      .map((member) => ({
        id: member.shop.id,
        name: member.shop.shop_name,
        permissions: {
          is_owner: member.is_owner,
          is_admin: member.is_admin,
        },
      }));

    const online_panel_accesses = user.shopMembers
      .filter((member) => member.shop.type === ShopType.ONLINE_SHOP)
      .map((member) => ({
        id: member.shop.id,
        name: member.shop.shop_name,
        permissions: {
          is_owner: member.is_owner,
          is_admin: member.is_admin,
        },
      }));

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      offline_panel_accesses,
      online_panel_accesses,
    };
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
