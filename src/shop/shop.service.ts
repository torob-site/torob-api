import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetShopProductsDto, shopProductsSortEnum } from './shop.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async all(q: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.ShopWhereInput = {
      type: 'ONLINE_SHOP',
    };
    if (q) {
      where.shop_name = {
        contains: q,
      };
    }

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

  async shopProducts(shop_id: number, { limit, page, has_pickup, sort, condition, is_available, price_gt, price_lt, q }: GetShopProductsDto) {
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
      is_deleted: false,
    };
    if (q) {
      where.product = {
        OR: [
          {
            name: {
              contains: q,
            },
          },
          {
            name_en: {
              contains: q,
            },
          },
        ],
      };
    }
    if (is_available) where.is_available = true;

    if (price_gt || price_lt) {
      where.price = {};

      if (price_gt) where.price.gte = price_gt;
      if (price_lt) where.price.lte = price_lt;
    }

    if (has_pickup) {
      console.log('has_pickup');
      where.shop = {
        type: 'OFFLINE_SHOP',
      };
    }

    if (condition === 'new') where.stock_status = '';
    if (condition === 'stock') where.stock_status = 'کارکرده';
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
    }
    const [offers, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          shop: true,
          badges: true,
          product: {
            include: {
              productImages: true,
            },
          },
        },
      }),
      this.prisma.offer.count({ where }),
    ]);
    if (total === 0) {
      return {
        data: [],
        filters2: [
          {
            title: 'امکان خرید حضوری',
            slug: 'has_pickup',
            type: 'toggle-icon',
            icon: 'MapPin',
          },
          {
            title: 'وضعیت کارکرد',
            slug: 'condition',
            type: 'toggle-group',
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
            ],
          },
        ],
      };
    }
    const products = offers.map((offer) => {
      const { product, badges, ...offerData } = offer;

      return {
        ...product,
        badges: badges ?? [],
        shop_price: `${Number(offer.price).toLocaleString('fa-IR')} تومان`,
        shop_text: `در ${shop.shop_name}`,
        is_available: offer.is_available,
      };
    });
    return {
      data: products,
      filters1: [],
      filters2: [
        {
          title: 'امکان خرید حضوری',
          slug: 'has_pickup',
          type: 'toggle-icon',
          icon: 'MapPin',
        },
        {
          title: 'وضعیت کارکرد',
          slug: 'condition',
          type: 'toggle-group',
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
