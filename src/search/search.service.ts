import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto, SearchSortEnum, SearchTypeEnum } from './search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  private getPopularity(product: any) {
    return product.productClicks.reduce((sum, click) => sum + click.count, 0);
  }

  async searchShop(
    limit: number,
    page: number,
    shop_name?: string,
    is_available?: boolean,
    sort?: SearchSortEnum,
    price_gt?: number,
    price_lt?: number,
  ) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        shop_name: {
          contains: shop_name,
        },
      },
    });
    if (!shop) {
      throw new NotFoundException('shop not found');
    }
    const where: Prisma.OfferWhereInput = {
      shop_id: shop.id,
      is_active: true,
    };
    const skip = (page - 1) * limit;
    if (is_available) {
      where.is_available = true;
    }
    if (price_gt || price_lt) {
      where.price = {};

      if (price_gt) {
        where.price.gte = price_gt;
      }

      if (price_lt) {
        where.price.lte = price_lt;
      }
    }
    let orderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };
    if (sort === SearchSortEnum.price_asc) orderBy = { price: 'asc' };
    if (sort === SearchSortEnum.price_desc) orderBy = { price: 'desc' };
    if (sort === SearchSortEnum.new) orderBy = { created_at: 'desc' };
    if (sort === SearchSortEnum.top_seller) orderBy = { created_at: 'desc' };
    const [offers, total, priceRange] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          badges: true,
          product: {
            include: {
              productImages: true,
              productClicks: true,
            },
          },
        },
      }),
      this.prisma.offer.count({ where }),
      this.prisma.offer.aggregate({
        where: {
          shop_id: shop.id,
          is_active: true,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      }),
    ]);
    if (sort === SearchSortEnum.popularity) {
      offers.sort(
        (a, b) => this.getPopularity(b.product) - this.getPopularity(a.product),
      );
    }
    return {
      type: 'shop',
      data: offers,
      max_price: Number(priceRange._max.price),
      min_price: Number(priceRange._min.price),
      shop,
      filters1: [
        {
          title: 'قیمت',
          slug: 'price',
          type: 'price',
          badge_text: `از ${price_gt || Number(priceRange._min.price)} تا ${price_lt || Number(priceRange._max.price)}`,
          items: [
            {
              value: Number(priceRange._min.price),
              slug: 'price_gt',
            },
            {
              value: Number(priceRange._max.price),
              slug: 'price_lt',
            },
          ],
        },
      ],
      filters2: [
        {
          title: 'فقط موجودها',
          slug: 'is_available',
          type: 'toggle',
        },
        {
          title: 'مرتب‌سازی',
          slug: 'sort',
          type: 'dropdown',
          badge_text: sort ? sort : '',
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
            {
              name: 'بیشترین فروشنده',
              value: 'top_seller',
            },
          ],
        },
      ],
      similar_categories: [],
      categories: [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchProduct(
    page: number,
    limit: number,
    query?: string,
    shop_type?: string,
    stock_status?: string,
    is_available?: boolean,
    sort?: SearchSortEnum,
    price_gt?: number,
    price_lt?: number,
    brand_id?: number,
    specifications?: Record<string, string[]>,
  ) {
    const where: Prisma.ProductWhereInput = {
      OR: [{ name: { contains: query } }, { name_en: { contains: query } }],
    };

    if (brand_id) {
      where.brand_id = brand_id;
    }

    const offerWhere: Prisma.OfferWhereInput = {
      is_active: true,
    };

    if (is_available) offerWhere.is_available = true;

    if (price_gt || price_lt) {
      offerWhere.price = {};

      if (price_gt) offerWhere.price.gte = price_gt;
      if (price_lt) offerWhere.price.lte = price_lt;
    }

    if (shop_type) {
      offerWhere.shop = {
        type: 'OFFLINE_SHOP',
      };
    }

    if (stock_status === 'new') offerWhere.stock_status = '';
    if (stock_status === 'stock') offerWhere.stock_status = 'کارکرده';

    let orderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };

    if (sort === SearchSortEnum.price_asc) orderBy = { price: 'asc' };
    if (sort === SearchSortEnum.price_desc) orderBy = { price: 'desc' };
    if (sort === SearchSortEnum.new) orderBy = { created_at: 'desc' };

    const [products] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          productImages: true,
          productSpecifications: true,
          productClicks: true,
          offers: {
            where: offerWhere,
            orderBy,
            include: {
              shop: true,
            },
          },
        },
      }),
    ]);

    let filteredProducts = products.filter(
      (product) => product.offers.length > 0,
    );

    if (specifications && Object.keys(specifications).length > 0) {
      filteredProducts = filteredProducts.filter((product) => {
        return Object.entries(specifications).every(([key, values]) => {
          const productValues = product.productSpecifications
            .filter((spec) => spec.key === key)
            .map((spec) => spec.value);

          return values.some((value) => productValues.includes(value));
        });
      });
    }

    if (sort === SearchSortEnum.top_seller) {
      filteredProducts.sort((a, b) => b.offers.length - a.offers.length);
    }

    if (sort === SearchSortEnum.popularity) {
      filteredProducts.sort((a, b) => {
        const aClicks = a.productClicks.reduce(
          (sum, click) => sum + click.count,
          0,
        );

        const bClicks = b.productClicks.reduce(
          (sum, click) => sum + click.count,
          0,
        );

        return bClicks - aClicks;
      });
    }

    const brandMap = new Map();

    for (const product of filteredProducts) {
      if (!product.brand) continue;

      if (!brandMap.has(product.brand.id)) {
        brandMap.set(product.brand.id, {
          id: product.brand.id,
          slug: product.brand.slug,
          name1: product.brand.name,
          name2: product.brand.name_en,
        });
      }
    }

    const brands = Array.from(brandMap.values());

    const selectedBrand = brands.find((brand) => brand.id === brand_id);

    const specMap = new Map<string, Set<string>>();

    for (const product of filteredProducts) {
      for (const spec of product.productSpecifications) {
        if (!specMap.has(spec.key)) {
          specMap.set(spec.key, new Set());
        }

        specMap.get(spec.key)?.add(spec.value);
      }
    }

    const specFilters = Array.from(specMap.entries()).map(([key, values]) => ({
      title: key,
      slug: key,
      type: 'multi_choice',
      badge_text: specifications?.[key]?.join(', ') || '',
      items: Array.from(values).map((value) => ({
        value,
      })),
    }));

    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(
      (page - 1) * limit,
      page * limit,
    );
    const prices = filteredProducts.flatMap((product) =>
      product.offers.map((offer) => Number(offer.price)),
    );
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return {
      type: 'product',
      data: paginatedProducts,
      filters1: [
        {
          title: 'انتخاب برند',
          slug: 'brand',
          type: 'brand',
          badge_text: selectedBrand ? selectedBrand.name1 : '',
          items: brands,
        },
        ...specFilters,
        {
          title: 'قیمت',
          slug: 'price',
          type: 'price',
          badge_text: `از ${price_gt || minPrice} تا ${price_lt || maxPrice}`,
          items: [
            {
              value: minPrice,
              slug: 'price_gt',
            },
            {
              value: maxPrice,
              slug: 'price_lt',
            },
          ],
        },
      ],
      filters2: [
        {
          title: 'امکان خرید حضوری',
          slug: 'shop_type',
          type: 'toggle',
          items: [
            {
              name: 'محصولات دارای فروشنده حضوری',
              value: 'offline',
            },
          ],
        },
        {
          title: 'وضعیت کارکرد',
          slug: 'stock_status',
          type: 'single_choice',
          badge_text: stock_status === 'new' ? 'نو' : 'کارکرده',
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
          badge_text: sort ? sort : '',
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
            {
              name: 'بیشترین فروشنده',
              value: 'top_seller',
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

  async search(
    {
      sort,
      type,
      is_available,
      limit,
      page,
      query,
      price_gt,
      shop_type,
      stock_status,
      price_lt,
      brand_id,
    }: SearchDto,
    specifications?: Record<string, string[]>,
  ) {
    if (type === SearchTypeEnum.shop) {
      return this.searchShop(
        limit,
        page,
        query,
        is_available,
        sort,
        price_gt,
        price_lt,
      );
    }
    if (type === SearchTypeEnum.product) {
      return this.searchProduct(
        page,
        limit,
        query,
        shop_type,
        stock_status,
        is_available,
        sort,
        price_gt,
        price_lt,
        brand_id,
        specifications,
      );
    }
  }

  async autocomplete(keyword: string, user_id?: number) {
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
