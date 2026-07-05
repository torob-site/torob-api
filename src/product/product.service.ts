import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

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
      data: product,
      pagination: {
        page: page,
        limit: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
