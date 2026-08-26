import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateViewDto } from './history.dto';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async all(user_id: number) {
    const histories = await this.prisma.productView.findMany({
      where: {
        user_id,
      },
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
    const productsWithDisplayInfo = histories.map((history) => {
      const product = history.product;

      const sellerCount = product.offers.length;

      const mainOffer = sellerCount === 0 ? null : sellerCount === 1 ? product.offers[0] : product.offers.reduce((min, offer) => (Number(offer.price) < Number(min.price) ? offer : min));
      const { offers, ...rest } = product;

      return {
        ...rest,
        badges: mainOffer?.badges ?? [],

        shop_price: mainOffer ? `${sellerCount > 1 ? 'از ' : ''}${Number(mainOffer.price).toLocaleString('fa-IR')} تومان` : '',

        shop_text: mainOffer ? (sellerCount > 1 ? `در ${sellerCount} فروشگاه` : `در ${mainOffer.shop.shop_name}`) : '',
        is_available: mainOffer?.is_available,
      };
    });
    return productsWithDisplayInfo;
  }

  async createView(user_id: number, { product_id }: CreateViewDto) {
    try {
      const viewed = await this.prisma.productView.findUnique({
        where: {
          product_id_user_id: { product_id, user_id },
        },
      });

      if (!viewed) {
        await this.prisma.$transaction([
          this.prisma.productView.create({
            data: { product_id, user_id },
          }),
          this.prisma.product.update({
            where: { id: product_id },
            data: { view_count: { increment: 1 } },
          }),
        ]);
        return { status: 200 };
      }
      return { status: 200 };
    } catch (error) {
      console.error(`Error to set view`);
      return { status: 200 };
    }
  }

  async allRemove(user_id: number) {
    await this.prisma.productView.deleteMany({
      where: {
        user_id,
      },
    });
    return { status: 200 };
  }
}
