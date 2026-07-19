import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import jalaliday from 'jalaliday';
import dayjs from 'dayjs';

dayjs.extend(jalaliday);

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async get(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: product_id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        name_en: true,
        brand_id: true,
        created_at: true,
        updated_at: true,
        productImages: {
          select: {
            id: true,
            url: true,
          },
        },

        productVariants: {
          orderBy: {
            id: 'asc',
          },
        },
        productSpecifications: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async offerHistory(product_id: number, page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.offerHistory.findMany({
        where: {
          offer: {
            product_id,
          },
        },
        include: {
          offer: {
            include: {
              shop: {
                select: {
                  id: true,
                  shop_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.offerHistory.count({
        where: {
          offer: {
            product_id,
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => {
        switch (item.type) {
          case 'PRICE_INCREASE':
            return {
              title: `افزایش قیمت در ${item.offer.shop.shop_name}`,
              description: `از ${Number(item.old_price)} به ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'PRICE_DECREASE':
            return {
              title: `کاهش قیمت در ${item.offer.shop.shop_name}`,
              description: `از ${Number(item.old_price)} به ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'AVAILABLE':
            return {
              title: `موجود شدن در ${item.offer.shop.shop_name}`,
              description: `قیمت جدید: ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'UNAVAILABLE':
            return {
              title: `ناموجود شدن در ${item.offer.shop.shop_name}`,
              description: `قیمت قبلی: ${Number(item.old_price)}`,
              created_at: item.created_at,
            };
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async priceHistory(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: product_id,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new NotFoundException('product not found');
    }

    const priceHistory = await this.prisma.productPriceHistory.findMany({
      where: {
        id: product.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      labels: priceHistory.map((item) => dayjs(item.date).calendar('jalali').locale('fa').format('D MMMM YYYY')),
      dataSets: [
        {
          label: 'میانگین قیمت',
          entries: priceHistory.map((item, index) => ({
            val: item.avg_price,
            i: index,
          })),
        },
        {
          label: 'کمترین قیمت',
          entries: priceHistory.map((item, index) => ({
            val: item.min_price,
            i: index,
          })),
        },
      ],
    };
  }

  async similar(product_id: number, page: number, limit: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: product_id,
      },
    });
    if (!product) {
      throw new NotFoundException('product not found');
    }
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: {
          id: {
            not: product.id,
          },
          category_id: product.category_id,
          brand_id: product.brand_id,
        },
        orderBy: {
          id: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          productImages: true,
          offers: {
            include: {
              badges: true,
            },
            orderBy: {
              price: 'asc',
            },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({
        where: {
          id: {
            not: product.id,
          },
        },
      }),
    ]);
    return {
      data: products,
      pagination: {
        page: page,
        limit: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async redirect(data: { offer_id: number; user_id?: number; ip?: string; user_agent?: string; referer?: string }) {
    const offer = await this.prisma.offer.findUnique({
      where: {
        id: data.offer_id,
      },
      select: {
        id: true,
        more_info_url: true,
        product_id: true,
        shop_id: true,
        is_active: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (!offer.is_active) {
      throw new BadRequestException('Offer is inactive');
    }

    await this.prisma.$transaction([
      this.prisma.offerClick.create({
        data: {
          offer_id: offer.id,
          product_id: offer.product_id,
          shop_id: offer.shop_id,
          user_id: data.user_id,
          ip: data.ip,
          user_agent: data.user_agent,
          referer: data.referer,
        },
      }),
    ]);

    return offer.more_info_url;
  }

  async offers(product_id: number) {
    return await this.prisma.offer.findMany({
      where: {
        product_id,
        is_active: true,
      },
      select: {
        id: true,
        price: true,
        stock_status: true,
        more_info_url: true,
        description: true,
        warranty: {
          select: {
            title: true,
          },
        },
        warranty_duration: true,
        updated_at: true,
        shop: {
          select: {
            id: true,
            shop_name: true,
            shop_logo: true,
            is_active: true,
          },
        },
      },
      orderBy: [
        {
          price: 'asc',
        },
        {
          updated_at: 'desc',
        },
      ],
    });
  }
}
