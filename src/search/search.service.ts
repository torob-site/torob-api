import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto, SearchSortEnum } from './search.dto';
import { Prisma } from '@prisma/client';
import { toProductDisplayInfo, toShopProductDisplay } from 'src/common/utils/product-display';
import { buildPagination } from 'src/common/utils/pagination';

type FacetProduct = {
  brand: { id: number; slug: string; name: string; name_en: string } | null;
  category?: { id: number; title: string; url: string } | null;
  productSpecifications: { specification: { id: number; title: string }; value: string }[];
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  // ─── Shared query builders ─────────────────────────────────────────────

  private buildProductWhere(params: { q?: string; category_id?: number; brand_id?: number; specifications?: Record<string, string[]> }): Prisma.ProductWhereInput {
    const { q, category_id, brand_id, specifications } = params;

    const where: Prisma.ProductWhereInput = {};
    if (category_id) {
      where.category_id = category_id;
    }
    if (q) {
      where.OR = [
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
      ];
    }
    if (brand_id) {
      where.brand_id = brand_id;
    }
    if (specifications && Object.keys(specifications).length > 0) {
      where.AND = Object.entries(specifications).map(([specification_id, values]) => ({
        productSpecifications: {
          some: {
            specification_id: Number(specification_id),
            value: {
              in: values,
            },
          },
        },
      }));
    }
    return where;
  }

  private buildOfferWhere(params: { is_available?: boolean; price_gt?: number; price_lt?: number; has_pickup?: boolean; condition?: string }): Prisma.OfferWhereInput {
    const { is_available, price_gt, price_lt, has_pickup, condition } = params;

    const offerWhere: Prisma.OfferWhereInput = {
      is_active: true,
    };

    if (is_available) offerWhere.is_available = true;

    if (price_gt || price_lt) {
      offerWhere.price = {};

      if (price_gt) offerWhere.price.gte = price_gt;
      if (price_lt) offerWhere.price.lte = price_lt;
    }

    if (has_pickup) {
      offerWhere.shop = {
        type: 'OFFLINE_SHOP',
      };
    }

    if (condition === 'new') offerWhere.stock_status = '';
    if (condition === 'stock') offerWhere.stock_status = 'کارکرده';

    return offerWhere;
  }

  /** Sort order for product-level searches: product orderBy + included-offers orderBy. */
  private getSortOrder(sort?: SearchSortEnum): {
    productOrderBy: Prisma.ProductOrderByWithRelationInput;
    offerOrderBy: Prisma.OfferOrderByWithRelationInput;
  } {
    const productOrderBy: Prisma.ProductOrderByWithRelationInput = {};
    const offerOrderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };

    switch (sort) {
      case SearchSortEnum.popularity:
        productOrderBy.view_count = 'desc';
        break;

      case SearchSortEnum.price_asc:
        offerOrderBy.price = 'asc';
        break;

      case SearchSortEnum.price_desc:
        offerOrderBy.price = 'desc';
        break;

      case SearchSortEnum.new:
        productOrderBy.created_at = 'desc';
        break;

      case SearchSortEnum.top_seller:
        productOrderBy.offer_count = 'desc';
        break;
    }

    return { productOrderBy, offerOrderBy };
  }

  /** Sort order for offer-level searches (searchShop). */
  private getOfferSortOrder(sort?: SearchSortEnum): Prisma.OfferOrderByWithRelationInput {
    let orderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };

    switch (sort) {
      case SearchSortEnum.popularity:
        orderBy = {
          product: {
            view_count: 'desc',
          },
        };
        break;

      case SearchSortEnum.price_desc:
        orderBy = {
          price: 'desc',
        };
        break;

      case SearchSortEnum.new:
        orderBy = {
          created_at: 'desc',
        };
        break;
    }

    return orderBy;
  }

  private getProductInclude(offerWhere: Prisma.OfferWhereInput, offerOrderBy: Prisma.OfferOrderByWithRelationInput) {
    // Kept as a single literal (not annotated as Prisma.ProductInclude) so Prisma
    // can infer the exact result payload. `category` is always included; callers
    // that don't need it strip it via toProductDisplayInfo's omit list.
    return {
      brand: true,
      productImages: true,
      category: {
        select: {
          id: true,
          title: true,
          url: true,
        },
      },
      productSpecifications: {
        where: {
          type: 'KEY' as const,
        },
        include: {
          specification: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      offers: {
        where: offerWhere,
        orderBy: offerOrderBy,
        include: {
          shop: true,
          badges: true,
        },
      },
    };
  }

  private getPriceBounds(priceRange: { _min: { price: unknown }; _max: { price: unknown } }) {
    return {
      max_price: priceRange._max.price ? Number(priceRange._max.price) : 0,
      min_price: priceRange._min.price ? Number(priceRange._min.price) : 0,
    };
  }

  // ─── Shared facets & filter definitions ────────────────────────────────

  private buildBrandFacets(products: FacetProduct[]) {
    const brandMap = new Map<number, { id: number; slug: string; name: string; name_en: string }>();

    for (const product of products) {
      if (!product.brand) continue;

      if (!brandMap.has(product.brand.id)) {
        brandMap.set(product.brand.id, {
          id: product.brand.id,
          slug: product.brand.slug,
          name: product.brand.name,
          name_en: product.brand.name_en,
        });
      }
    }

    return Array.from(brandMap.values());
  }

  private buildSpecFacets(products: FacetProduct[], specifications?: Record<string, string[]>) {
    const specMap = new Map<
      number,
      {
        title: string;
        values: Set<string>;
      }
    >();

    for (const product of products) {
      for (const spec of product.productSpecifications) {
        const specificationId = spec.specification.id;

        if (!specMap.has(specificationId)) {
          specMap.set(specificationId, {
            title: spec.specification.title,
            values: new Set(),
          });
        }

        specMap.get(specificationId)?.values.add(spec.value);
      }
    }

    return Array.from(specMap.entries()).map(([id, data]) => ({
      specification_id: id,
      title: data.title,
      slug: String(id),
      type: 'multiple',
      badge_text: specifications?.[String(id)]?.join(', ') || null,
      items: Array.from(data.values).map((value) => ({
        value,
      })),
    }));
  }

  private getSortFilterItems() {
    return [
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
    ];
  }

  private getProductFilters2() {
    return [
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
        items: this.getSortFilterItems(),
      },
    ];
  }

  private getShopFilters2() {
    return [
      {
        title: 'فقط موجودها',
        slug: 'is_available',
        type: 'toggle',
      },
      {
        title: 'مرتب‌سازی',
        slug: 'sort',
        type: 'dropdown',
        items: this.getSortFilterItems(),
      },
    ];
  }

  private buildFilters1(brands: ReturnType<SearchService['buildBrandFacets']>, specFilters: ReturnType<SearchService['buildSpecFacets']>, brand_id?: number) {
    const selectedBrand = brands.find((brand) => brand.id === brand_id);

    return [
      {
        title: 'انتخاب برند',
        slug: 'brand',
        type: 'dropdown',
        // NOTE: original code read `selectedBrand.name1`, which doesn't exist on Brand,
        // so badge_text was always null — preserved as-is.
        badge_text: (selectedBrand as { name1?: string } | undefined)?.name1 ?? null,
        items: brands,
      },
      ...specFilters,
    ];
  }

  // ─── Logging ───────────────────────────────────────────────────────────

  private async logSearch(user_id: number, query?: string) {
    if (!query?.trim()) return;

    const normalizedQuery = query.trim().toLowerCase();

    try {
      await this.prisma.$transaction([
        this.prisma.userSearchHistory.upsert({
          where: {
            keyword_user_id: { user_id, keyword: normalizedQuery },
          },
          update: {},
          create: {
            user_id,
            keyword: normalizedQuery,
          },
        }),

        this.prisma.searchLog.upsert({
          where: { keyword: normalizedQuery },
          update: { count: { increment: 1 } },
          create: { keyword: normalizedQuery, count: 1 },
        }),
      ]);
    } catch (error) {
      console.error('Failed to log search', { user_id, query: normalizedQuery, error });
    }
  }

  private async logCategory(user_id: number, category_id?: number) {
    if (!category_id) return;

    try {
      await this.prisma.categoryLog.upsert({
        where: {
          user_id_category_id: {
            user_id,
            category_id,
          },
        },
        update: {
          category_id,
          user_id,
          count: {
            increment: 1,
          },
        },
        create: {
          user_id,
          category_id,
        },
      });
    } catch (error) {
      console.error('Failed to log category view', { user_id, category_id, error });
    }
  }

  async getCategoryBreadcrumb(categoryId: number) {
    const rows = await this.prisma.$queryRaw<{ id: number; title: string }[]>`
    WITH RECURSIVE tree AS (
      SELECT id, title, parent_id, 0 as level
      FROM \`categories\`
      WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id, c.title, c.parent_id, t.level + 1
      FROM \`categories\` c
      JOIN tree t ON t.parent_id = c.id
    )
    SELECT id, title FROM tree ORDER BY level DESC;
  `;
    return {
      categories: rows.map((r) => ({
        id: r.id,
        title: r.title,
      })),
    };
  }

  // ─── Endpoints ─────────────────────────────────────────────────────────

  async searchShop(shop_id: number, shop_name: string, limit: number, page: number, is_available?: boolean, sort?: SearchSortEnum, price_gt?: number, price_lt?: number, domain?: string | null, shop_logo?: string | null) {
    const where: Prisma.OfferWhereInput = {
      ...this.buildOfferWhere({ is_available, price_gt, price_lt }),
      shop_id: shop_id,
    };

    const orderBy = this.getOfferSortOrder(sort);

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

    const shopInfo = {
      id: shop_id,
      shop_name,
      shop_logo,
      domain,
    };

    if (total === 0) {
      return {
        shop: shopInfo,
        data: [],
        filters2: this.getShopFilters2(),
      };
    }

    return {
      shop: shopInfo,
      data: offers.map((offer) => toShopProductDisplay(offer, shop_name)),
      ...this.getPriceBounds(priceRange),
      filters1: [],
      filters2: this.getShopFilters2(),
      pagination: buildPagination(page, limit, total),
    };
  }

  async searchProduct(page: number, limit: number, query?: string, has_pickup?: boolean, condition?: string, is_available?: boolean, sort?: SearchSortEnum, price_gt?: number, price_lt?: number, brand_id?: number, specifications?: Record<string, string[]>) {
    if (!query) {
      throw new BadRequestException('query is not the found');
    }

    const where = this.buildProductWhere({ q: query, brand_id, specifications });
    const offerWhere = this.buildOfferWhere({ is_available, price_gt, price_lt, has_pickup, condition });
    where.offers = {
      some: offerWhere,
    };

    const { productOrderBy, offerOrderBy } = this.getSortOrder(sort);

    const [products, total, priceRange] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: productOrderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.getProductInclude(offerWhere, offerOrderBy),
      }),
      this.prisma.product.count({ where }),
      this.prisma.offer.aggregate({
        where: {
          product: where,
          ...offerWhere,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      }),
    ]);

    if (total === 0) {
      return {
        data: [],
        filters2: this.getProductFilters2(),
      };
    }

    const brands = this.buildBrandFacets(products);
    const specFilters = this.buildSpecFacets(products, specifications);

    const categoryMap = new Map<number, { id: number; title: string; url: string }>();

    for (const product of products) {
      if (!product.category) continue;

      if (!categoryMap.has(product.category.id)) {
        categoryMap.set(product.category.id, {
          id: product.category.id,
          title: product.category.title,
          url: product.category.url,
        });
      }
    }

    const suggestedCategories = Array.from(categoryMap.values());

    return {
      data: products.map((product) => toProductDisplayInfo(product, ['brand', 'productSpecifications', 'category'])),
      ...this.getPriceBounds(priceRange),
      suggested_categories: suggestedCategories,
      filters1: this.buildFilters1(brands, specFilters, brand_id),
      filters2: this.getProductFilters2(),
      pagination: buildPagination(page, limit, total),
    };
  }

  async searchCategory(page: number, limit: number, has_pickup?: boolean, condition?: string, is_available?: boolean, sort?: SearchSortEnum, price_gt?: number, price_lt?: number, category_id?: number, brand_id?: number, specifications?: Record<string, string[]>, q?: string, user_id?: number) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: category_id,
      },
    });
    if (!category) {
      throw new NotFoundException('category not found');
    }
    if (user_id) {
      await this.logCategory(user_id, category_id);
    }

    const breadcrumb = await this.getCategoryBreadcrumb(category.id);
    const suggested_categories = await this.prisma.category.findMany({
      where: {
        parent_id: category.parent_id,
        id: {
          not: category.id,
        },
      },
    });

    const where = this.buildProductWhere({ q, category_id, brand_id, specifications });
    const offerWhere = this.buildOfferWhere({ is_available, price_gt, price_lt, has_pickup, condition });
    where.offers = {
      some: offerWhere,
    };

    const { productOrderBy, offerOrderBy } = this.getSortOrder(sort);

    const [products, total, priceRange] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: productOrderBy,
        include: this.getProductInclude(offerWhere, offerOrderBy),
      }),
      this.prisma.product.count({ where }),
      this.prisma.offer.aggregate({
        where: {
          product: where,
          ...offerWhere,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      }),
    ]);

    if (total === 0) {
      return {
        data: [],
        filters2: this.getProductFilters2(),
      };
    }

    const popular_categories = await this.prisma.categoryLog.findMany({
      where: {
        category: {
          parent_id: category.id,
        },
      },
      orderBy: {
        count: 'desc',
      },
      take: 3,
      include: {
        category: true,
      },
    });

    const brands = this.buildBrandFacets(products);
    const specFilters = this.buildSpecFacets(products, specifications);

    return {
      title: `${category.title}`,
      ...this.getPriceBounds(priceRange),
      data: products.map((product) => toProductDisplayInfo(product, ['brand', 'productSpecifications', 'category'])),
      suggested_categories,
      breadcrumb: breadcrumb,
      popular_categories: popular_categories.map((x) => x.category),
      filters1: this.buildFilters1(brands, specFilters, brand_id),
      filters2: this.getProductFilters2(),
      pagination: buildPagination(page, limit, total),
    };
  }

  async search(user_id: number, { sort, is_available, limit, page, query, price_gt, condition, has_pickup, price_lt, brand_id, category_id, q }: SearchDto, specifications?: Record<string, string[]>) {
    if (category_id) {
      return this.searchCategory(page, limit, has_pickup, condition, is_available, sort, price_gt, price_lt, category_id, brand_id, specifications, q, user_id);
    }

    if (user_id) {
      await this.logSearch(user_id, query);
    }

    const shop = await this.prisma.shop.findFirst({
      where: {
        OR: [
          {
            shop_name: {
              contains: query,
            },
          },
          {
            domain: {
              contains: query,
            },
          },
        ],
      },
      select: {
        id: true,
        shop_name: true,
        shop_logo: true,
        domain: true,
      },
    });
    if (shop && query?.trim() === shop.shop_name) {
      return this.searchShop(shop.id, shop.shop_name, limit, page, is_available, sort, price_gt, price_lt, shop.domain, shop.shop_logo);
    }
    return this.searchProduct(page, limit, query, has_pickup, condition, is_available, sort, price_gt, price_lt, brand_id, specifications);
  }

  async autocomplete(keyword: string, user_id: number) {
    if (!keyword?.trim()) {
      return [];
    }

    const q = keyword.trim();

    const [history, shops, logs] = await Promise.all([
      user_id
        ? this.prisma.userSearchHistory.findMany({
            where: {
              user_id,
              keyword: {
                contains: q,
              },
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 3,
            select: {
              keyword: true,
            },
          })
        : Promise.resolve([]),

      this.prisma.shop.findMany({
        where: {
          shop_name: {
            contains: q,
          },
        },
        take: 2,
        select: {
          shop_name: true,
          shop_logo: true,
        },
      }),

      this.prisma.searchLog.findMany({
        where: {
          keyword: {
            contains: q,
          },
        },
        orderBy: {
          count: 'desc',
        },
        take: 5,
        select: {
          keyword: true,
        },
      }),
    ]);

    const historyResult = history.map((h) => ({
      type: 'text',
      text: h.keyword,
      is_history: true,
    }));

    const shopResult = shops.map((s) => ({
      type: 'shop',
      text: s.shop_name,
      logo: s.shop_logo,
      is_history: false,
    }));

    const logResult = logs.map((l) => ({
      type: 'text',
      text: l.keyword,
      is_history: false,
    }));

    const result = [...historyResult, ...shopResult, ...logResult];

    return result;
  }
}
