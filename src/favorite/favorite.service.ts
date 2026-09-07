import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFavoriteDto } from './favorite.dto';
import { toProductDisplayInfo } from 'src/common/utils/product-display';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async all(user_id: number, only_ids?: boolean) {
    if (only_ids) {
      const favorites = await this.prisma.favorite.findMany({
        where: { user_id },
        select: {
          product_id: true,
        },
      });
      return favorites.map((x) => x.product_id);
    }
    const favorites = await this.prisma.favorite.findMany({
      where: { user_id },
      include: {
        product: {
          include: {
            productImages: true,
            offers: {
              where: {
                is_active: true,
              },
              include: {
                shop: true,
                badges: true,
              },
            },
          },
        },
      },
    });
    return favorites.map((favorite) => toProductDisplayInfo(favorite.product));
  }

  async toggle(user_id: number, { product_id }: CreateFavoriteDto) {
    const favorite = await this.prisma.favorite.findFirst({
      where: {
        user_id,
        product_id,
      },
    });
    if (favorite) {
      await this.prisma.favorite.delete({
        where: { id: favorite.id },
      });
      return { is_favorite: false };
    }
    await this.prisma.favorite.create({
      data: {
        user_id,
        product_id,
      },
    });
    return { is_favorite: true };
  }
}
