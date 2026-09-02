import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReportDto } from './report.dto';
import { ShopType } from '@prisma/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fa';

dayjs.extend(relativeTime);

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private buildTree(items) {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      const node = map.get(item.id);

      if (item.parent_id) {
        map.get(item.parent_id)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async all(user_id: number) {
    const reports = await this.prisma.report.findMany({
      where: {
        user_id,
      },
      select: {
        created_at: true,
        status: true,
        price_at_report_time: true,
        shop: {
          select: {
            id: true,
            shop_name: true,
          },
        },
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
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
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    const reportsMap = reports.map((x) => {
      return {
        id: x.product.id,
        slug: x.product.slug,
        product_name: x.product.name,
        product_shop_name: x.shop.shop_name,
        status: x.status,
        price_at_report_time: x.price_at_report_time,
        main_image: x.product.productImages.map((x) => x.url),
        created_at: dayjs(x.created_at).locale('fa').fromNow(),
      };
    });

    const reviewedReports = reports.filter((x) => x.status !== 'PENDING');
    const positiveCount = reviewedReports.filter((x) => x.status === 'RESOLVED' || x.status === 'REVIEWED').length;
    const reviewedTotal = reviewedReports.length;

    let user_status: string = 'بد';
    if (reviewedTotal > 0) {
      const accuracy = positiveCount / reviewedTotal;
      if (accuracy >= 0.8) {
        user_status = 'عالی';
      } else if (accuracy >= 0.5) {
        user_status = 'خوب';
      }
    }

    return {
      results: reportsMap,
      user_status,
    };
  }

  async recentOfferClicks(user_id: number) {
    const clicks = await this.prisma.offerClick.findMany({
      where: {
        user_id,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 50,
      select: {
        id: true,
        created_at: true,
        offer: {
          select: {
            id: true,
            product_id: true,
            price: true,
            is_available: true,
            is_active: true,
            warranty: {
              select: {
                title: true,
              },
            },
            warranty_duration: true,
            shop: {
              select: {
                id: true,
                shop_name: true,
                type: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
              take: 1,
            },
          },
        },
        shop: {
          select: {
            id: true,
            shop_name: true,
            shop_logo: true,
          },
        },
      },
    });

    return clicks.map((click) => ({
      id: click.id,
      created_at: click.created_at,
      offer: {
        id: click.offer.id,
        product_id: click.offer.product_id,
        price: Number(click.offer.price),
        is_available: click.offer.is_available,
        is_active: click.offer.is_active,
        warranty: click.offer.warranty,
        warranty_duration: click.offer.warranty_duration,
        shop: click.offer.shop,
      },
      product: {
        id: click.product.id,
        name: click.product.name,
        slug: click.product.slug,
        image: click.product.productImages[0]?.url ?? null,
      },
      shop: {
        id: click.shop.id,
        shop_name: click.shop.shop_name,
        shop_logo: click.shop.shop_logo,
      },
    }));
  }

  async options(shop_type: ShopType) {
    const reasons = await this.prisma.reportReason.findMany({
      where: { shop_type },
      orderBy: { id: 'asc' },
    });

    return this.buildTree(reasons);
  }

  async create(user_id: number, { product_id, report_reason_id, shop_id, description }: CreateReportDto) {
    const reason = await this.prisma.reportReason.findUnique({
      where: { id: report_reason_id },
    });

    if (!reason) {
      throw new NotFoundException('report reason not found');
    }

    const offer = await this.prisma.offer.findFirst({
      where: {
        shop_id,
        product_id,
        is_active: true,
      },
      include: {
        shop: {
          select: {
            type: true,
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    if (!offer) {
      throw new NotFoundException('offer not found');
    }
    if (offer.shop.type !== reason.shop_type) {
      throw new BadRequestException('shop type bad');
    }

    if (reason.needs_description && !description) {
      throw new BadRequestException('description required');
    }

    const report = await this.prisma.report.create({
      data: {
        user_id,
        shop_id,
        product_id,
        report_reason_id,
        description,
        price_at_report_time: Number(offer.price),
      },
    });

    return { status: 200 };
  }
}
