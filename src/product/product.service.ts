import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import jalaliday from 'jalaliday';
import dayjs from 'dayjs';

dayjs.extend(jalaliday);

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

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

  async get(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: product_id,
      },

      select: {
        id: true,
        name: true,
        slug: true,
        name_en: true,
        brand_id: true,
        created_at: true,
        updated_at: true,
        category_id: true,

        productImages: {
          select: {
            id: true,
            url: true,
          },
        },

        productVariants: {
          orderBy: {
            id: 'asc',
          },
        },

        productSpecifications: {
          orderBy: {
            id: 'asc',
          },

          select: {
            id: true,
            value: true,
            type: true,
            specification_id: true,
            product_id: true,

            specification: {
              select: {
                id: true,
                title: true,
                filterable: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const breadcrumb = await this.getCategoryBreadcrumb(product.category_id);
    return {
      ...product,
      breadcrumb: breadcrumb.categories,
    };
  }

  async offerHistory(product_id: number, page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.offerHistory.findMany({
        where: {
          offer: {
            product_id,
          },
        },
        include: {
          offer: {
            include: {
              shop: {
                select: {
                  id: true,
                  shop_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.offerHistory.count({
        where: {
          offer: {
            product_id,
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => {
        switch (item.type) {
          case 'PRICE_INCREASE':
            return {
              title: `افزایش قیمت در ${item.offer.shop.shop_name}`,
              description: `از ${Number(item.old_price)} به ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'PRICE_DECREASE':
            return {
              title: `کاهش قیمت در ${item.offer.shop.shop_name}`,
              description: `از ${Number(item.old_price)} به ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'AVAILABLE':
            return {
              title: `موجود شدن در ${item.offer.shop.shop_name}`,
              description: `قیمت جدید: ${Number(item.new_price)}`,
              created_at: item.created_at,
            };

          case 'UNAVAILABLE':
            return {
              title: `ناموجود شدن در ${item.offer.shop.shop_name}`,
              description: `قیمت قبلی: ${Number(item.old_price)}`,
              created_at: item.created_at,
            };
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async priceHistory(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: product_id,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new NotFoundException('product not found');
    }

    const priceHistory = await this.prisma.productPriceHistory.findMany({
      where: {
        product_id: product.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      labels: priceHistory.map((item) => dayjs(item.date).calendar('jalali').locale('fa').format('D MMMM YYYY')),
      dataSets: [
        {
          label: 'میانگین قیمت',
          entries: priceHistory.map((item, index) => ({
            val: item.avg_price,
            i: index,
          })),
        },
        {
          label: 'کمترین قیمت',
          entries: priceHistory.map((item, index) => ({
            val: item.min_price,
            i: index,
          })),
        },
      ],
    };
  }

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
            where: {
              is_active: true,
            },
            orderBy: {
              price: 'asc',
            },
            include: {
              shop: true,
              badges: true,
            },
          },
        },
      }),

      this.prisma.product.count({
        where: {
          id: {
            not: product.id,
          },
          category_id: product.category_id,
          brand_id: product.brand_id,
        },
      }),
    ]);

    const productsWithDisplayInfo = products.map((product) => {
      const sellerCount = product.offers.length;

      const mainOffer = sellerCount === 0 ? null : product.offers[0];
      const { offers, ...rest } = product;

      return {
        ...rest,

        badges: mainOffer?.badges ?? [],

        shop_price: mainOffer ? `${sellerCount > 1 ? 'از ' : ''}${Number(mainOffer.price).toLocaleString('fa-IR')} تومان` : '',

        shop_text: mainOffer ? (sellerCount > 1 ? `در ${sellerCount} فروشگاه` : `در ${mainOffer.shop.shop_name}`) : '',
        is_available: mainOffer?.is_available,
      };
    });
    return {
      data: productsWithDisplayInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async redirect(data: { offer_id: number; user_id?: number; ip?: string; user_agent?: string; referer?: string }) {
    const offer = await this.prisma.offer.findUnique({
      where: {
        id: data.offer_id,
      },
      select: {
        id: true,
        more_info_url: true,
        product_id: true,
        shop_id: true,
        is_active: true,
        price: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (!offer.is_active) {
      throw new BadRequestException('Offer is inactive');
    }

    await this.prisma.$transaction([
      this.prisma.offerClick.create({
        data: {
          offer_id: offer.id,
          product_id: offer.product_id,
          shop_id: offer.shop_id,
          user_id: data.user_id ?? null,
          ip: data.ip ?? null,
          user_agent: data.user_agent ?? null,
          referer: data.referer ?? null,
          price: Number(offer.price),
        },
      }),
      this.prisma.offer.update({
        where: {
          id: offer.id,
        },
        data: {
          view_count: {
            increment: 1,
          },
        },
      }),
    ]);

    return offer.more_info_url;
  }

  async offers(product_id: number) {
    const offers = await this.prisma.offer.findMany({
      where: {
        product_id,
        is_active: true,
        is_deleted: false,
      },
      select: {
        id: true,
        price: true,
        description: true,
        warranty_duration: true,
        more_info_url: true,
        is_available: true,
        warranty: {
          select: { title: true },
        },
        badges: true,
        shop: {
          select: {
            id: true,
            shop_name: true,
            address: true,
            latitude: true,
            longitude: true,
            type: true,
            city: {
              select: { id: true, name: true },
            },
            shopImages: {
              select: { id: true, url: true },
            },
            shopContacts: {
              select: { id: true, type: true, platform: true, value: true },
            },
          },
        },
      },
      orderBy: [
        {
          is_available: 'desc',
        },
        {
          price: 'asc',
        },
        {
          updated_at: 'desc',
        },
      ],
    });

    return JSON.parse(JSON.stringify(offers, (key, value) => (typeof value === 'bigint' ? Number(value) : value)));
  }

  async mapOffers(product_id: number, user_id?: number) {
    const TEHRAN_CITY_ID = 1;

    let targetCityId = TEHRAN_CITY_ID;

    if (user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: { city_id: true },
      });
      if (user?.city_id) {
        targetCityId = user.city_id;
      }
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        product_id,
        is_active: true,
        shop: {
          city_id: targetCityId,
        },
      },
      select: {
        id: true,
        price: true,
        description: true,
        warranty_duration: true,
        warranty: {
          select: { title: true },
        },
        shop: {
          select: {
            id: true,
            shop_name: true,
            address: true,
            latitude: true,
            longitude: true,
            type: true,
            city: {
              select: { id: true, name: true },
            },
            shopImages: {
              select: { id: true, url: true },
            },
            shopContacts: {
              select: { id: true, type: true, platform: true, value: true },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      sellers: JSON.parse(JSON.stringify(offers, (key, value) => (typeof value === 'bigint' ? Number(value) : value))),
    };
  }

  async priceList(category_id: number, page = 1, limit = 10) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: category_id,
      },
      select: {
        id: true,
        title: true,
        url: true,
        parent_id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('category not found');
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));

    /* ---------------------------------------------------------------------- */
    /* Siblings                                                               */
    /* ---------------------------------------------------------------------- */

    const siblings = category.parent_id
      ? await this.prisma.category.findMany({
          where: {
            parent_id: category.parent_id,
          },
          select: {
            id: true,
            title: true,
            url: true,
          },
          orderBy: {
            title: 'asc',
          },
        })
      : [];

    /* ---------------------------------------------------------------------- */
    /* Children                                                               */
    /* ---------------------------------------------------------------------- */

    const children = await this.prisma.category.findMany({
      where: {
        parent_id: category_id,
      },
      select: {
        id: true,
        title: true,
        url: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    /* ====================================================================== */
    /* HAS CHILDREN                                                           */
    /* ====================================================================== */

    if (children.length > 0) {
      const categories = await Promise.all(
        children.map(async (child) => {
          const [products, total] = await Promise.all([
            this.prisma.product.findMany({
              where: {
                category_id: child.id,
              },

              take: 10,

              select: {
                id: true,
                name: true,
                slug: true,

                offers: {
                  where: {
                    is_active: true,
                  },

                  orderBy: {
                    price: 'asc',
                  },

                  take: 1,

                  select: {
                    price: true,

                    shop: {
                      select: {
                        id: true,
                        shop_name: true,
                      },
                    },
                  },
                },

                _count: {
                  select: {
                    offers: {
                      where: {
                        is_active: true,
                      },
                    },
                  },
                },
              },

              orderBy: {
                name: 'asc',
              },
            }),

            this.prisma.product.count({
              where: {
                category_id: child.id,
              },
            }),
          ]);

          return {
            id: child.id,
            title: child.title,
            url: child.url,

            total_products: total,
            has_more: total > 10,

            products: products.map((product) => {
              const lowestOffer = product.offers[0] ?? null;

              return {
                id: product.id,
                name: product.name,
                slug: product.slug,

                lowest_price: lowestOffer ? Number(lowestOffer.price) : null,

                seller_count: product._count.offers,

                seller_name: product._count.offers === 1 ? (lowestOffer?.shop.shop_name ?? null) : null,
              };
            }),
          };
        }),
      );

      return {
        type: 'has_children' as const,

        title: `لیست قیمت ${category.title}`,

        category: {
          id: category.id,
          title: category.title,
          url: category.url,
        },

        siblings,

        categories,
      };
    }

    /* ====================================================================== */
    /* LEAF                                                                   */
    /* ====================================================================== */

    const where = {
      category_id,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,

        skip: (safePage - 1) * safeLimit,
        take: safeLimit,

        select: {
          id: true,
          name: true,
          slug: true,

          offers: {
            where: {
              is_active: true,
            },

            orderBy: {
              price: 'asc',
            },

            take: 1,

            select: {
              price: true,

              shop: {
                select: {
                  id: true,
                  shop_name: true,
                },
              },
            },
          },

          _count: {
            select: {
              offers: {
                where: {
                  is_active: true,
                },
              },
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    const formattedProducts = products.map((product) => {
      const lowestOffer = product.offers[0] ?? null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,

        lowest_price: lowestOffer ? Number(lowestOffer.price) : null,

        seller_count: product._count.offers,

        seller_name: product._count.offers === 1 ? (lowestOffer?.shop.shop_name ?? null) : null,
      };
    });

    return {
      type: 'leaf' as const,

      title: `لیست قیمت ${category.title}`,

      category: {
        id: category.id,
        title: category.title,
        url: category.url,
      },

      siblings,

      products: formattedProducts,

      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }
}
