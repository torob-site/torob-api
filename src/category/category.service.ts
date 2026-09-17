import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private buildCategoryTree(categories: any[], productCounts: Map<number, number> = new Map()) {
    const map = new Map<number, any>();

    for (const category of categories) {
      map.set(category.id, {
        id: category.id,
        title: category.title,
        url: category.url,
        parent_id: category.parent_id,
        product_count: productCounts.get(category.id) ?? 0,
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

    // Post-order pass: every parent gets the sum of its subtree's product counts.
    const accumulate = (node: any): number => {
      const childrenSum = node.children.reduce((acc: number, child: any) => acc + accumulate(child), 0);
      node.product_count += childrenSum;
      return node.product_count;
    };
    tree.forEach(accumulate);

    return tree;
  }

  /**
   * Direct product count per category. Parent categories have no direct products,
   * so the tree builder adds up the subtree counts for them.
   * Only products with at least one ACTIVE offer are counted, because those are
   * the only ones ever shown by search/browse — otherwise the badge would show
   * numbers that can't be reached on the site.
   */
  private async getProductCounts() {
    const rows = await this.prisma.product.groupBy({
      by: ['category_id'],
      _count: {
        category_id: true,
      },
      where: {
        offers: {
          some: {
            is_active: true,
          },
        },
      },
    });

    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.category_id, row._count.category_id);
    }
    return counts;
  }

  async all() {
    const [categories, productCounts] = await Promise.all([
      this.prisma.category.findMany({
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          url: true,
          parent_id: true,
        },
      }),
      this.getProductCounts(),
    ]
    );

    const tree = this.buildCategoryTree(categories, productCounts);
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
