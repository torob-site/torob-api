import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import 'dayjs/locale/fa';

dayjs.extend(jalaliday);

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  async all(user_id: number, page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = { user_id };

    if (search && search.trim()) {
      where.OR = [{ product: { name: { contains: search.trim() } } }, { shop: { shop_name: { contains: search.trim() } } }];
    }

    const [clicks, total] = await this.prisma.$transaction([
      this.prisma.offerClick.findMany({
        where,
        select: {
          id: true,
          created_at: true,
          price: true,
          offer: {
            select: {
              more_info_url: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productImages: {
                where: {
                  is_main: true,
                },
                select: {
                  url: true,
                },
              },
            },
          },
          shop: {
            select: {
              id: true,
              shop_name: true,
              city: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.offerClick.count({
        where,
      }),
    ]);

    const results = clicks.map((click) => {
      const jalaliDate = dayjs(click.created_at).calendar('jalali').locale('fa');

      return {
        id: click.id,
        product_id: click.product.id,
        shop_id: click.shop.id,
        product_name: click.product.name,
        product_slug: click.product.slug,
        product_image: click.product.productImages[0]?.url ?? '',
        shop_name: click.shop.shop_name,
        city_name: click.shop.city?.name,
        price: click.price ?? 0,
        created_at: jalaliDate.format('dddd - D MMMM HH:mm'),
      };
    });

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async detail(user_id: number, product_id: number, shop_id: number) {
    const click = await this.prisma.offerClick.findFirst({
      where: {
        product_id,
        shop_id,
        user_id,
      },
      select: {
        id: true,
        created_at: true,
        price: true,
        offer: {
          select: {
            more_info_url: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productImages: {
              select: {
                url: true,
                is_main: true,
              },
              orderBy: {
                is_main: 'desc',
              },
            },
          },
        },
        shop: {
          select: {
            id: true,
            shop_name: true,
            shop_logo: true,
            domain: true,
            address: true,
            province: {
              select: {
                name: true,
              },
            },
            city: {
              select: {
                name: true,
              },
            },
            shopContacts: {
              select: {
                type: true,
                platform: true,
                value: true,
              },
            },
            shopWorkingHours: {
              select: {
                day: true,
                shift_number: true,
                start_time: true,
                end_time: true,
              },
              orderBy: [{ day: 'asc' }, { shift_number: 'asc' }],
            },
          },
        },
      },
    });

    if (!click) {
      throw new NotFoundException('purchase not found');
    }

    const jalaliDate = dayjs(click.created_at).calendar('jalali').locale('fa');

    return {
      id: click.id,
      product_name: click.product.name,
      product_slug: click.product.slug,
      product_images: click.product.productImages.map((img) => img.url),
      shop_name: click.shop.shop_name,
      shop_logo: click.shop.shop_logo,
      shop_domain: click.shop.domain,
      shop_address: click.shop.address,
      province_name: click.shop.province?.name,
      city_name: click.shop.city?.name,
      shop_contacts: click.shop.shopContacts,
      shop_working_hours: click.shop.shopWorkingHours,
      price: click.price ?? 0,
      more_info_url: click.offer.more_info_url,
      created_at: jalaliDate.format('dddd - D MMMM HH:mm'),
    };
  }
}
