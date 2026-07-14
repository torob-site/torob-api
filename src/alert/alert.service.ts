import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto, RemoveAlertDto } from './alert.dto';

@Injectable()
export class AlertService {
  constructor(private prisma: PrismaService) {}

  async all(user_id: number, only_ids: boolean) {
    if (only_ids) {
      const alerts = await this.prisma.alert.findMany({
        where: {
          user_id,
        },
        select: {
          product_id: true,
        },
      });
      return alerts;
    }
    const alerts = await this.prisma.alert.findMany({
      where: {
        user_id,
      },
      include: {
        product: {
          include: {
            productImages: {
              where: {
                is_main: true,
              },
            },
          },
        },
      },
    });
    return alerts;
  }

  async create(userId: number, dto: CreateAlertDto) {
    const hasPrice = dto.watch_price != null;
    const hasAvailability = dto.watch_availability === true;

    if (hasPrice === hasAvailability) {
      throw new BadRequestException('choose either watch_price or watch_availability');
    }

    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.product_id,
      },
      include: {
        productVariants: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('product not found');
    }

    if (product.productVariants.length > 0) {
      if (!dto.variant_id) {
        throw new BadRequestException('variant_id is required');
      }

      const variant = product.productVariants.find((item) => item.id === dto.variant_id);

      if (!variant) {
        throw new NotFoundException('variant not found');
      }
    }

    const offer = await this.prisma.offer.findFirst({
      where: {
        product_id: dto.product_id,
        variant_id: dto.variant_id ?? null,
        is_active: true,
      },
      orderBy: {
        price: 'asc',
      },
      select: {
        price: true,
        is_available: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('offer not found');
    }

    if (hasAvailability && offer.is_available) {
      throw new BadRequestException('product is already available');
    }

    if (hasPrice && dto.watch_price! >= Number(offer.price)) {
      throw new BadRequestException('watch price must be lower than current price');
    }

    await this.prisma.alert.upsert({
      where: {
        product_id_variant_id_user_id: {
          product_id: dto.product_id,
          variant_id: dto.variant_id ?? null,
          user_id: userId,
        },
      },
      update: {
        watch_price: hasPrice ? dto.watch_price : null,
        watch_availability: hasAvailability,
        disabled: false,
      },
      create: {
        user_id: userId,
        product_id: dto.product_id,
        variant_id: dto.variant_id,
        watch_price: hasPrice ? dto.watch_price : null,
        watch_availability: hasAvailability,
      },
    });

    return {
      status: 200,
    };
  }

  async remove(user_id: number, { alert_id }: RemoveAlertDto) {
    const watch = await this.prisma.alert.findUnique({
      where: {
        id: alert_id,
      },
      select: {
        id: true,
      },
    });

    if (!watch) {
      throw new NotFoundException('price watch not found');
    }

    await this.prisma.alert.delete({
      where: {
        id: watch.id,
      },
    });

    return {
      status: 200,
    };
  }
}
