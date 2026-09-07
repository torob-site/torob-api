import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private buildCategoryTree(categories: any[]) {
    const map = new Map<number, any>();

    for (const category of categories) {
      map.set(category.id, {
        id: category.id,
        title: category.title,
        url: category.url,
        parent_id: category.parent_id,
        children: [],
      });
    }

    const tree: any[] = [];

    for (const category of categories) {
      const node = map.get(category.id);

      if (category.parent_id) {
        const parent = map.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    }

    return tree;
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

  async getCategoryBreadcrumb(categoryId: number) {
    const rows = await this.prisma.$queryRaw<{ id: number; title: string; url: string }[]>`
    WITH RECURSIVE tree AS (
      SELECT id, title, url, parent_id, 0 as level
      FROM \`categories\`
      WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id, c.title, c.url, c.parent_id, t.level + 1
      FROM \`categories\` c
      JOIN tree t ON t.parent_id = c.id
    )
    SELECT id, title, url FROM tree ORDER BY level DESC;
  `;
    return {
      categories: rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.url,
      })),
    };
  }
}
