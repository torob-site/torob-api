import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private buildCategoryTree(
    categories: any[],
    parent_id: number | null = null,
  ) {
    return categories
      .filter((category) => category.parent_id === parent_id)
      .map((category) => ({
        id: category.id,
        title: category.title,
        url: category.url,
        parent_id: category.parent_id,
        children: this.buildCategoryTree(categories, category.id),
      }));
  }

  async all() {
    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        url: true,
        parent_id: true,
      },
    });

    const tree = this.buildCategoryTree(categories);
    return tree;
  }

  async popular() {
    const populars = await this.prisma.categoryLog.groupBy({
      by: ['category_id'],
      _sum: {
        count: true,
      },
      orderBy: {
        _sum: {
          count: 'desc',
        },
      },
      take: 3,
    });

    return populars;
  }

  async createLog(user_id: number, category_id: number) {
    await this.prisma.categoryLog.upsert({
      where: {
        user_id_category_id: {
          category_id,
          user_id,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        category_id,
        user_id,
      },
    });
    return { status: 200 };
  }
}
