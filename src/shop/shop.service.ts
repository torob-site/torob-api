import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShopDto, GetShopProductsDto, shopProductsSortEnum } from './shop.dto';
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

  async create(user_id: number, dto: CreateShopDto) {
    // =====================================================
    // Validate shop name
    // =====================================================

    const shopName = dto.shop_name?.trim();

    if (!shopName) {
      throw new BadRequestException('نام فروشگاه الزامی است');
    }

    // =====================================================
    // Validate OFFLINE_SHOP
    // =====================================================

    if (dto.type === 'OFFLINE_SHOP') {
      // ---------------------------------------------------
      // City
      // ---------------------------------------------------

      if (dto.city_id === undefined || dto.city_id === null) {
        throw new BadRequestException('شهر برای فروشگاه حضوری الزامی است');
      }

      // ---------------------------------------------------
      // Business type
      // ---------------------------------------------------

      if (!dto.business_type?.trim()) {
        throw new BadRequestException('حوزه فعالیت برای فروشگاه حضوری الزامی است');
      }

      // ---------------------------------------------------
      // Has license
      // ---------------------------------------------------
      // توجه:
      // false مقدار معتبر است.
      // پس نباید از !dto.has_license استفاده کنیم.
      // ---------------------------------------------------

      if (dto.has_license === undefined || dto.has_license === null) {
        throw new BadRequestException('مشخص کردن وضعیت جواز کسب برای فروشگاه حضوری الزامی است');
      }
    }

    // =====================================================
    // Validate ONLINE_SHOP
    // =====================================================

    if (dto.type === 'ONLINE_SHOP') {
      if (!dto.domain?.trim()) {
        throw new BadRequestException('دامنه برای فروشگاه آنلاین الزامی است');
      }
    }

    // =====================================================
    // Check duplicate shop name
    // =====================================================

    const existingShop = await this.prisma.shop.findUnique({
      where: {
        shop_name: shopName,
      },
    });

    if (existingShop) {
      throw new BadRequestException('نام فروشگاه قبلاً استفاده شده است');
    }

    // =====================================================
    // Find city
    // =====================================================

    if (dto.type === 'OFFLINE_SHOP') {
      const city = await this.prisma.city.findUnique({
        where: {
          id: dto.city_id!,
        },
      });

      if (!city) {
        throw new BadRequestException('شهر انتخاب‌شده معتبر نیست');
      }
    }

    // =====================================================
    // Find business type
    // =====================================================

    let business_type_id: number | null = null;

    if (dto.type === 'OFFLINE_SHOP') {
      const business = await this.prisma.business.findUnique({
        where: {
          value: dto.business_type!.trim(),
        },
      });

      if (!business) {
        throw new BadRequestException('حوزه فعالیت انتخاب‌شده معتبر نیست');
      }

      business_type_id = business.id;
    }

    // =====================================================
    // Create owner
    // =====================================================

    const owner = await this.prisma.shopOwner.create({
      data: {
        first_name: '',
        last_name: '',
        national_code: `pending_${Date.now()}_${user_id}`,
        mobile_phone: '',
        birth_date: new Date('2000-01-01'),
      },
    });

    // =====================================================
    // Create shop
    // =====================================================

    const shop = await this.prisma.shop.create({
      data: {
        // ---------------------------------------------------
        // Basic
        // ---------------------------------------------------

        type: dto.type,
        status: 'PENDING',
        shop_name: shopName,

        // ---------------------------------------------------
        // License
        // ---------------------------------------------------

        has_license: dto.type === 'OFFLINE_SHOP' ? dto.has_license! : false,

        // ---------------------------------------------------
        // Location
        // ---------------------------------------------------

        city_id: dto.type === 'OFFLINE_SHOP' ? dto.city_id! : null,

        // فعلاً همان مقدار قبلی
        province_id: dto.type === 'OFFLINE_SHOP' ? 1 : null,

        // ---------------------------------------------------
        // Other
        // ---------------------------------------------------

        address: '',
        shop_logo: '',
        owner_id: owner.id,

        // ---------------------------------------------------
        // Domain
        // ---------------------------------------------------

        domain: dto.type === 'ONLINE_SHOP' ? dto.domain!.trim() : '',

        // ---------------------------------------------------
        // Business type
        // ---------------------------------------------------

        business_type_id,
      },
    });

    // =====================================================
    // Create ShopMember
    // =====================================================

    await this.prisma.shopMember.create({
      data: {
        shop_id: shop.id,
        user_id,
        is_owner: true,
        is_admin: true,
      },
    });

    // =====================================================
    // Create verification records
    // =====================================================

    const sections = ['LOCATION', 'OWNER_INFO', 'PHONE', 'CONTACT_INFO', 'IMAGES', 'CATEGORY', 'NAME', 'DAILY_WORKING_HOURS', 'BUSINESS_TYPE', 'INSTAGRAM_USERNAME'] as const;

    await this.prisma.shopVerification.createMany({
      data: sections.map((section) => ({
        shop_id: shop.id,
        section,
        status: 'PENDING_FILLING',
      })),
    });

    // =====================================================
    // Response
    // =====================================================

    return {
      id: shop.id,
      shop_name: shop.shop_name,
      type: shop.type,
      status: shop.status,
    };
  }

  async businessTypes() {
    return await this.prisma.business.findMany({
      select: {
        value: true,
        label: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}
