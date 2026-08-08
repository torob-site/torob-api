import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetShopProductsDto, shopProductsSortEnum } from './shop.dto';
import { Prisma } from '@prisma/client';
import { SortTitles } from 'src/common/constants/sort.constant';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async all(q: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = q
      ? {
          shop_name: {
            contains: q,
          },
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.shop.findMany({
        where,
        skip,
        select: {
          id: true,
          shop_logo: true,
          shop_name: true,
        },
        take: limit,
        orderBy: {
          id: 'desc',
        },
      }),

      this.prisma.shop.count({
        where,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async shopProducts(shop_id: number, { limit, page, shop_type, sort, stock_status, is_available, price_gt, price_lt, query }: GetShopProductsDto) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        id: shop_id,
      },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }
    const where: Prisma.OfferWhereInput = {
      shop_id: shop.id,
      is_active: true,
    };
    if (query) {
      where.product = {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            name_en: {
              contains: query,
            },
          },
        ],
      };
    }
    if (is_available) {
      where.is_available = true;
    }
    if (price_gt || price_lt) {
      where.price = {};

      if (price_gt) {
        where.price.gte = price_gt;
      }

      if (price_lt) {
        where.price.lte = price_lt;
      }
    }
    if (shop_type) {
      where.shop = {
        type: 'OFFLINE_SHOP',
      };
    }
    if (stock_status === 'new') {
      where.stock_status = '';
    }

    if (stock_status === 'stock') {
      where.stock_status = 'کارکرده';
    }
    let orderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };

    switch (sort) {
      case shopProductsSortEnum.popularity:
        orderBy = {
          product: {
            view_count: 'desc',
          },
        };
        break;

      case shopProductsSortEnum.price_asc:
        orderBy = {
          price: 'asc',
        };
        break;

      case shopProductsSortEnum.price_desc:
        orderBy = {
          price: 'desc',
        };
        break;

      case shopProductsSortEnum.new:
        orderBy = {
          created_at: 'desc',
        };
        break;

      case shopProductsSortEnum.top_seller:
        orderBy = {
          product: {
            offer_count: 'desc',
          },
        };
        break;
    }
    const [offers, total, priceRange] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          badges: true,
          product: {
            include: {
              productImages: true,
            },
          },
        },
      }),
      this.prisma.offer.count({ where }),
      this.prisma.offer.aggregate({
        where,
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      }),
    ]);
    return {
      data: offers,
      max_price: Number(priceRange._max.price),
      min_price: Number(priceRange._min.price),
      shop,
      filters1: [
        {
          title: 'قیمت',
          slug: 'price',
          type: 'price',
          badge_text: `از ${price_gt || Number(priceRange._min.price)} تا ${price_lt || Number(priceRange._max.price)}`,
          items: [
            {
              value: Number(priceRange._min.price),
              slug: 'price_gt',
            },
            {
              value: Number(priceRange._max.price),
              slug: 'price_lt',
            },
          ],
        },
        {
          title: 'جستجو در نتایج',
          slug: 'q',
          type: 'query',
        },
      ],
      filters2: [
        {
          title: 'امکان خرید حضوری',
          slug: 'shop_type',
          type: 'toggle',
          items: [
            {
              name: 'محصولات دارای فروشنده حضوری',
              value: 'offline',
            },
          ],
        },
        {
          title: 'وضعیت کارکرد',
          slug: 'stock_status',
          type: 'single_choice',
          badge_text: stock_status === 'new' ? 'نو' : 'کارکرده',
          items: [
            {
              name: 'نو',
              value: 'new',
            },
            {
              name: 'کارکرده',
              value: 'stock',
            },
          ],
        },
        {
          title: 'فقط موجودها',
          slug: 'is_available',
          type: 'toggle',
        },
        {
          title: 'مرتب‌سازی',
          slug: 'sort',
          type: 'dropdown',
          badge_text: sort ? SortTitles[sort] : '',
          items: [
            {
              name: 'محبوب‌ترین',
              value: 'popularity',
            },
            {
              name: 'ارزان‌ترین',
              value: 'price_asc',
            },
            {
              name: 'گران‌ترین',
              value: 'price_desc',
            },
            {
              name: 'جدیدترین',
              value: 'new',
            },
            {
              name: 'بیشترین فروشنده',
              value: 'top_seller',
            },
          ],
        },
      ],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async get(shop_id: number) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: shop_id,
        type: 'ONLINE_SHOP',
      },
      select: {
        id: true,
        shop_name: true,
        shop_logo: true,
        domain: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        province: {
          select: {
            id: true,
            name: true,
          },
        },
        is_active: true,
        address: true,
      },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }
    return shop;
  }
}
