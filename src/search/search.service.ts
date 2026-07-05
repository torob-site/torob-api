import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDto, SearchSortEnum, SearchTypeEnum } from './search.dto';
import { Prisma } from '@prisma/client';
import { SortTitles } from 'src/common/constants/sort.constant';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

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
    switch (sort) {
      case SearchSortEnum.popularity:
        orderBy = {
          product: {
            view_count: 'desc',
          },
        };
        break;

      case SearchSortEnum.price_asc:
        orderBy = {
          price: 'asc',
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
          badge_text: sort ? SortTitles[sort] : '',
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
    const where: Prisma.ProductWhereInput = {};
    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
          },
        },
        {
          name_en: {
            contains: query,
          },
        },
      ];
    }
    if (brand_id) {
      where.brand_id = brand_id;
    }
    if (specifications && Object.keys(specifications).length > 0) {
      where.AND = Object.entries(specifications).map(([key, values]) => ({
        productSpecifications: {
          some: {
            key,
            value: {
              in: values,
            },
          },
        },
      }));
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

    let productOrderBy: Prisma.ProductOrderByWithRelationInput = {};
    let offerOrderBy: Prisma.OfferOrderByWithRelationInput = {
      price: 'asc',
    };

    switch (sort) {
      case SearchSortEnum.popularity:
        productOrderBy = {
          view_count: 'desc',
        };
        break;

      case SearchSortEnum.price_asc:
        offerOrderBy = {
          price: 'asc',
        };
        break;

      case SearchSortEnum.price_desc:
        offerOrderBy = {
          price: 'desc',
        };
        break;

      case SearchSortEnum.new:
        productOrderBy = {
          created_at: 'desc',
        };
        break;

      case SearchSortEnum.top_seller:
        productOrderBy = {
          offer_count: 'desc',
        };
        break;
    }
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: productOrderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: true,
          productImages: true,
          productSpecifications: true,
          offers: {
            where: offerWhere,
            orderBy: offerOrderBy,
            include: {
              shop: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const brandMap = new Map();

    for (const product of products) {
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

    for (const product of products) {
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

    const prices = products.flatMap((product) =>
      product.offers.map((offer) => Number(offer.price)),
    );

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    return {
      type: 'product',
      data: products,
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
          badge_text: `از ${price_gt || Number(minPrice)} تا ${price_lt || Number(maxPrice)}`,
          items: [
            {
              value: Number(minPrice),
              slug: 'price_gt',
            },
            {
              value: Number(maxPrice),
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
          badge_text: sort ? SortTitles[sort] : '',
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
