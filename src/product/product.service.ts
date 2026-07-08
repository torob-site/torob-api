import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: {
        productImages: true,
        productVariants: true,
        productSpecifications: true,
        offers: true,
      },
    });
    if (!product) {
      throw new NotFoundException('product not found');
    }
    return product;
  }

  async priceHistory(product_id: number, page: number, limit: number) {
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

  async priceChart(product_id: number) {
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

    const chart = await this.prisma.productPriceChart.findMany({
      where: {
        id: product.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      labels: chart.map((item) =>
        dayjs(item.date).calendar('jalali').locale('fa').format('D MMMM YYYY'),
      ),
      dataSets: [
        {
          label: 'میانگین قیمت',
          entries: chart.map((item, index) => ({
            val: item.avg_price,
            i: index,
          })),
        },
        {
          label: 'کمترین قیمت',
          entries: chart.map((item, index) => ({
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
}
