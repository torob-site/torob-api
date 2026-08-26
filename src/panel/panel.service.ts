import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLocationDto, GetProductsQueryDto, GetShopStatisticsDto, ProductSortField, ReportAction, StatisticsRange, UpdateBusinessTypeDto, UpdateContactInfoDto, UpdateLocationDto, UpdateOwnerInfoDto, UpdateProductDto, UpdateReportStatusDto, UpdateShopInstagramUserNameDto, UpdateShopStatusDto, UpdateWorkingHoursDto } from './panel.dto';
import { BusinessLicenseType, ContactPlatform, ContactType, DayOfWeek, Prisma, ReportStatus, ReportType, VerificationSection } from '@prisma/client';
import jalaliday from 'jalaliday';
import dayjs from 'dayjs';

dayjs.extend(jalaliday);

@Injectable()
export class PanelService {
  constructor(private prisma: PrismaService) {}

  private async getShopMember(shop_id: number, user_id: number, select?: Prisma.ShopSelect) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: shop_id,
      },
      select: {
        ...select,
        shopMembers: {
          where: {
            user_id,
            is_deleted: false,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('shop not found');
    }

    if (!shop.shopMembers.length) {
      throw new ForbiddenException('you are not a member of this shop');
    }

    return shop;
  }

  async getMyShops(user_id: number) {
    const shops = await this.prisma.shop.findMany({
      where: {
        shopMembers: {
          some: {
            user_id,
            is_deleted: false,
          },
        },
      },
      select: {
        id: true,
        shop_name: true,
        shop_logo: true,
        type: true,
        is_active: true,
        domain: true,
        shopMembers: {
          where: {
            user_id,
            is_deleted: false,
          },
          select: {
            is_owner: true,
            is_admin: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    return shops.map((shop) => {
      const member = shop.shopMembers[0];

      const access: string[] = [];

      if (member?.is_owner) {
        access.push('صاحب امتیاز');
      }

      if (member?.is_admin) {
        access.push('ادمین');
      }

      return {
        id: shop.id,
        shop_name: shop.shop_name,
        shop_logo: shop.shop_logo,
        type: shop.type,
        is_active: shop.is_active,
        access,
      };
    });
  }

  async updateShopStatus(shop_id: number, { is_active }: UpdateShopStatusDto, user_id: number) {
    await this.getShopMember(shop_id, user_id);

    await this.prisma.shop.update({
      where: {
        id: shop_id,
      },
      data: {
        is_active,
      },
    });

    return { status: 200 };
  }

  async getInstagramUserName(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      instagram_username: true,
    });
    return {
      instagram_username: shop.instagram_username,
    };
  }

  async updateShopInstagramUserName(shop_id: number, { instagram_username }: UpdateShopInstagramUserNameDto, user_id: number) {
    await this.getShopMember(shop_id, user_id);
    await this.prisma.shop.update({ where: { id: shop_id }, data: { instagram_username }, select: { id: true, instagram_username: true } });
    return { status: 200 };
  }

  async getStatus(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopVerifications: {
        select: {
          section: true,
          status: true,
        },
      },
      shop_logo: true,
      shop_name: true,
    });

    const verificationMap = new Map(shop.shopVerifications.map((item) => [item.section, item.status.toLowerCase()]));

    const result = Object.values(VerificationSection).reduce((acc, section) => {
      acc[`${section.toLowerCase()}_status`] = verificationMap.get(section) ?? 'pending_filling';

      return acc;
    }, {});

    return {
      shop_name: shop.shop_name,
      shop_logo: shop.shop_logo,
      ...result,
    };
  }

  async getOwnerInfo(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      owner: {
        select: {
          national_code: true,
          first_name: true,
          last_name: true,
          birth_date: true,
          mobile_phone: true,
        },
      },
    });
    return shop.owner;
  }

  async getBusinessType(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      businessType: {
        select: {
          value: true,
        },
      },
    });
    const business = await this.prisma.business.findMany({
      select: {
        value: true,
        label: true,
      },
    });
    return {
      business_types: business,
      selected_business_type: shop.businessType?.value,
    };
  }

  async updateBusinessType(shop_id: number, { business_type }: UpdateBusinessTypeDto, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      id: true,
    });

    const business = await this.prisma.business.findUnique({
      where: {
        value: business_type,
      },
    });

    if (!business) {
      throw new NotFoundException('business type not found');
    }

    await this.prisma.shop.update({
      where: {
        id: shop.id,
      },
      data: {
        business_type_id: business.id,
      },
    });

    return {
      status: 200,
    };
  }

  async getShopProfile(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shop_logo: true,
      shop_name: true,
    });

    return {
      shop_name: shop.shop_name,
      shop_logo: shop.shop_logo,
    };
  }

  async getShopImages(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopImages: {
        select: {
          id: true,
          url: true,
        },
      },
    });
    return shop.shopImages;
  }

  async getWorkingHours(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopWorkingHours: {
        select: {
          day: true,
          shift_number: true,
          start_time: true,
          end_time: true,
        },
      },
    });

    const workingHourMap = new Map(
      shop.shopWorkingHours.map((item) => {
        // تبدیل Date به فرمت HH:mm:ss
        const formatTime = (date: Date) => {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
        };

        return [
          `${item.day}_${item.shift_number}`,
          {
            start_time: formatTime(item.start_time),
            end_time: formatTime(item.end_time),
          },
        ];
      }),
    );

    const dailyWorkingHours = Object.values(DayOfWeek).reduce((acc, day) => {
      acc[day.toLowerCase()] = {
        shift1: workingHourMap.get(`${day}_1`) ?? {
          start_time: '00:00:00',
          end_time: '00:00:00',
        },
        shift2: workingHourMap.get(`${day}_2`) ?? {
          start_time: '00:00:00',
          end_time: '00:00:00',
        },
      };

      return acc;
    }, {});

    return {
      daily_working_hours: dailyWorkingHours,
    };
  }

  async updateWorkingHours(shop_id: number, user_id: number, updateData: UpdateWorkingHoursDto) {
    await this.getShopMember(shop_id, user_id);

    const { daily_working_hours } = updateData;
    console.log('daily_working_hours:', JSON.stringify(daily_working_hours, null, 2));

    // آماده‌سازی داده‌ها برای ذخیره
    const workingHoursData: Prisma.ShopWorkingHourCreateManyInput[] = [];

    for (const [dayKey, shifts] of Object.entries(daily_working_hours)) {
      console.log(`Processing day: ${dayKey}`);

      const dayEnum = this.getDayEnum(dayKey);
      console.log(`dayEnum: ${dayEnum}`);

      if (!dayEnum) continue;

      // شیفت اول
      if (shifts.shift1) {
        const { start_time, end_time } = shifts.shift1;
        console.log(`Shift1: start=${start_time}, end=${end_time}`);

        // فقط اگر زمان‌ها معتبر باشند (نه 00:00:00)
        if (start_time !== '00:00:00' || end_time !== '00:00:00') {
          const parsedStart = this.parseTime(start_time);
          const parsedEnd = this.parseTime(end_time);
          console.log(`Parsed Shift1: start=${parsedStart}, end=${parsedEnd}`);

          workingHoursData.push({
            shop_id,
            day: dayEnum,
            shift_number: 1,
            start_time: parsedStart,
            end_time: parsedEnd,
          });
        } else {
          console.log('Shift1 skipped (00:00:00)');
        }
      }

      // شیفت دوم
      if (shifts.shift2) {
        const { start_time, end_time } = shifts.shift2;
        console.log(`Shift2: start=${start_time}, end=${end_time}`);

        if (start_time !== '00:00:00' || end_time !== '00:00:00') {
          const parsedStart = this.parseTime(start_time);
          const parsedEnd = this.parseTime(end_time);
          console.log(`Parsed Shift2: start=${parsedStart}, end=${parsedEnd}`);

          workingHoursData.push({
            shop_id,
            day: dayEnum,
            shift_number: 2,
            start_time: parsedStart,
            end_time: parsedEnd,
          });
        } else {
          console.log('Shift2 skipped (00:00:00)');
        }
      }
    }

    console.log('workingHoursData to save:', JSON.stringify(workingHoursData, null, 2));

    // حذف ساعات کاری قبلی
    console.log('Deleting old working hours...');
    await this.prisma.shopWorkingHour.deleteMany({
      where: {
        shop_id,
      },
    });
    console.log('Old working hours deleted');

    // ذخیره ساعات کاری جدید
    if (workingHoursData.length > 0) {
      console.log(`Creating ${workingHoursData.length} new working hours...`);
      try {
        const result = await this.prisma.shopWorkingHour.createMany({
          data: workingHoursData,
        });
        console.log('Create result:', result);
      } catch (error) {
        console.error('Error creating working hours:', error);
        throw error;
      }
    } else {
      console.log('No working hours to save');
    }

    // برگرداندن اطلاعات به‌روز شده
    console.log('Fetching updated working hours...');
    const result = await this.getWorkingHours(shop_id, user_id);
    console.log('Result:', JSON.stringify(result, null, 2));

    return result;
  }

  private getDayEnum(dayKey: string): DayOfWeek | null {
    const dayMap: Record<string, DayOfWeek> = {
      saturday: DayOfWeek.SATURDAY,
      sunday: DayOfWeek.SUNDAY,
      monday: DayOfWeek.MONDAY,
      tuesday: DayOfWeek.TUESDAY,
      wednesday: DayOfWeek.WEDNESDAY,
      thursday: DayOfWeek.THURSDAY,
      friday: DayOfWeek.FRIDAY,
    };

    return dayMap[dayKey.toLowerCase()] || null;
  }

  private parseTime(timeString: string): Date {
    console.log(`Parsing time: ${timeString}`);
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2] || '0', 10);

    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    console.log(`Parsed date: ${date.toISOString()}`);
    return date;
  }

  async getLocation(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      address: true,
      latitude: true,
      longitude: true,
      province: {
        select: {
          id: true,
          name: true,
        },
      },
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    });

    return {
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      province: shop.province,
      city: shop.city,
    };
  }

  async getPermissions(shop_id: number, user_id: number) {
    const shopMembers = await this.prisma.shopMember.findMany({
      where: {
        shop_id,
      },
      select: {
        user_id: true,
        is_owner: true,
        is_admin: true,
        is_deleted: true,
        created_at: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!shopMembers || shopMembers.length === 0) {
      throw new NotFoundException('shop not found');
    }

    const currentMember = shopMembers.find((member) => member.user_id === user_id);

    if (!currentMember) {
      throw new ForbiddenException('you are not a member of this shop');
    }

    if (currentMember.is_deleted) {
      throw new ForbiddenException('you do not have permission');
    }

    const users = shopMembers.map((member) => {
      const access: string[] = [];

      if (member.is_owner) {
        access.push('صاحب امتیاز');
      }

      if (member.is_admin) {
        access.push('ادمین');
      }

      return {
        access,
        name: member.user?.name ?? '',
        phone: member.user?.phone ?? '',
        is_current_user: member.user_id === user_id,
        can_remove: currentMember.is_owner ? member.user_id !== user_id : member.user_id === user_id,
        is_deleted: member.is_deleted,
      };
    });

    return {
      current_user_permissions: {
        is_owner: currentMember.is_owner,
        is_admin: currentMember.is_admin,
        is_deleted: currentMember.is_deleted,
      },
      users,
    };
  }

  async getNationalCard(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopDocuments: {
        where: {
          section: 'NATIONAL_CARD',
        },
        select: {
          document_url: true,
        },
      },
    });
    return shop.shopDocuments;
  }

  async getShopProducts(shop_id: number, user_id: number, query: GetProductsQueryDto) {
    await this.getShopMember(shop_id, user_id);

    const { sort = ProductSortField.CREATED_AT, q, page = 1, limit = 10, has_description, has_warranty } = query;

    // =========================================================
    // PARSE BOOLEAN QUERY PARAMS
    // =========================================================

    const parseBoolean = (value: boolean | string | undefined | null): boolean | undefined => {
      if (value === true || value === 'true') {
        return true;
      }

      if (value === false || value === 'false') {
        return false;
      }

      return undefined;
    };

    const parsedHasDescription = parseBoolean(has_description);
    const parsedHasWarranty = parseBoolean(has_warranty);

    // =========================================================
    // PAGINATION
    // =========================================================

    const currentPage = Math.max(1, Number(page) || 1);

    const currentLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const skip = (currentPage - 1) * currentLimit;

    // =========================================================
    // WHERE
    // =========================================================

    const where: Prisma.OfferWhereInput = {
      shop_id,

      is_deleted: false,

      // =======================================================
      // SEARCH
      // =======================================================

      ...(q?.trim()
        ? {
            OR: [
              {
                more_info_url: {
                  contains: q.trim(),
                },
              },

              {
                description: {
                  contains: q.trim(),
                },
              },

              {
                product: {
                  name: {
                    contains: q.trim(),
                  },
                },
              },
            ],
          }
        : {}),

      // =======================================================
      // DESCRIPTION FILTER
      //
      // true  => دارای توضیحات
      // false => بدون توضیحات
      // undefined => بدون فیلتر
      // =======================================================

      ...(parsedHasDescription !== undefined
        ? parsedHasDescription
          ? {
              description: {
                not: null,
              },
            }
          : {
              description: null,
            }
        : {}),

      // =======================================================
      // WARRANTY FILTER
      //
      // true  => دارای گارانتی
      // false => بدون گارانتی
      // undefined => بدون فیلتر
      // =======================================================

      ...(parsedHasWarranty !== undefined
        ? parsedHasWarranty
          ? {
              warranty_id: {
                not: null,
              },
            }
          : {
              warranty_id: null,
            }
        : {}),
    };

    // =========================================================
    // ORDER BY
    // =========================================================

    const orderByMap: Record<ProductSortField, Prisma.OfferOrderByWithRelationInput> = {
      [ProductSortField.NAME]: {
        product: {
          name: 'asc',
        },
      },

      [ProductSortField.CREATED_AT]: {
        created_at: 'desc',
      },

      [ProductSortField.VIEWS]: {
        view_count: 'desc',
      },

      [ProductSortField.QUANTITY_DESC]: {
        is_available: 'desc',
      },

      [ProductSortField.QUANTITY_ASC]: {
        is_available: 'asc',
      },
    };

    const orderBy = orderByMap[sort] ?? orderByMap[ProductSortField.CREATED_AT];

    // =========================================================
    // DATABASE QUERY
    // =========================================================

    const [products, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
        where,

        select: {
          id: true,

          description: true,

          more_info_url: true,

          view_count: true,

          price: true,

          is_active: true,

          is_available: true,

          created_at: true,

          // =====================================================
          // PRODUCT
          // =====================================================

          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          // =====================================================
          // WARRANTY
          // =====================================================

          warranty: {
            select: {
              id: true,
              title: true,
            },
          },

          // =====================================================
          // MAIN IMAGE
          // =====================================================

          offerImages: {
            where: {
              is_main: true,
            },

            select: {
              id: true,
              url: true,
              is_main: true,
            },

            take: 1,
          },
        },

        skip,

        take: currentLimit,

        orderBy,
      }),
      this.prisma.offer.count({
        where,
      }),
    ]);

    const formattedProducts = products.map((offer) => {
      const viewsCount = Number(offer.view_count ?? 0);

      return {
        id: Number(offer.id),

        product_id: Number(offer.product.id),
        slug: offer.product.slug,
        name: offer.product?.name ?? 'محصول بدون نام',

        description: offer.description,

        price: Number(offer.price),

        is_active: Boolean(offer.is_active),

        is_available: Boolean(offer.is_available),

        main_image: offer.offerImages[0]?.url ?? null,

        views: viewsCount,

        time_ago: this.getTimeAgo(offer.created_at),

        warranty: offer.warranty
          ? {
              id: Number(offer.warranty.id),

              title: offer.warranty.title,
            }
          : null,

        more_info_url: offer.more_info_url ?? null,
      };
    });

    const sortLabels: Record<ProductSortField, string> = {
      [ProductSortField.NAME]: 'نام محصول',

      [ProductSortField.CREATED_AT]: 'جدیدترین',

      [ProductSortField.VIEWS]: 'پربازدیدترین',

      [ProductSortField.QUANTITY_DESC]: 'موجودی',

      [ProductSortField.QUANTITY_ASC]: 'ناموجود',
    };

    const sortOrders: Record<ProductSortField, 'asc' | 'desc'> = {
      [ProductSortField.NAME]: 'asc',

      [ProductSortField.CREATED_AT]: 'desc',

      [ProductSortField.VIEWS]: 'desc',

      [ProductSortField.QUANTITY_DESC]: 'desc',

      [ProductSortField.QUANTITY_ASC]: 'asc',
    };

    const selectedSort = sortLabels[sort] ? sort : ProductSortField.CREATED_AT;


    const totalPages = total > 0 ? Math.ceil(total / currentLimit) : 0;

    return {
      products: formattedProducts,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_previous: currentPage > 1,
      },

      sorting: {
        sort_by: selectedSort,

        sort_label: sortLabels[selectedSort],

        sort_order: sortOrders[selectedSort],
      },

      filters: {
        has_description: parsedHasDescription ?? null,

        has_warranty: parsedHasWarranty ?? null,

        search: q?.trim() || null,
      },
    };
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (minutes < 1) return 'چند لحظه پیش';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 30) return `${days} روز پیش`;
    if (months < 12) return `${months} ماه پیش`;
    return `${years} سال پیش`;
  }

  async updateProduct(shop_id: number, user_id: number, product_id: number, { description, is_active, price, warranty_id, warranty_duration }: UpdateProductDto) {
    await this.getShopMember(shop_id, user_id);

    const product = await this.prisma.offer.findFirst({
      where: {
        id: product_id,
        shop_id,
        is_deleted: false,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    const data: any = {};

    if (description) {
      data.description = description;
    }

    if (price) {
      data.price = price;
    }

    if (is_active !== undefined) {
      data.is_active = is_active;
    }

    if (warranty_id) {
      let warranty = await this.prisma.warranty.findFirst({
        where: {
          id: warranty_id,
        },
      });
      if (!warranty) {
        throw new BadRequestException('warranty not found');
      }

      data.warranty_id = warranty_id;
      if (warranty_duration) {
        data.warranty_duration = warranty_duration;
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('هیچ فیلدی برای بروزرسانی ارسال نشده است');
    }

    await this.prisma.offer.update({
      where: {
        id: product_id,
      },
      data,
    });
  }

  async getShopTransactions(shop_id: number, user_id: number) {
    await this.getShopMember(shop_id, user_id);

    // ============================================
    // دریافت تراکنش‌ها
    // ============================================

    const transactions = await this.prisma.transaction.findMany({
      where: {
        shop_id,
      },

      orderBy: {
        created_at: 'desc',
      },

      select: {
        id: true,
        amount: true,
        title: true,
        description: true,
        type: true,
        created_at: true,
        updated_at: true,
      },
    });

    // ============================================
    // محاسبه موجودی
    // ============================================
    //
    // DEPOSIT               => مثبت
    // PROMOTIONAL_CREDIT    => مثبت
    // EXPENSE               => منفی
    //
    // هیچ filter یا sort در JavaScript انجام نمی‌شود.
    // Prisma مستقیماً SUM را روی دیتابیس انجام می‌دهد.
    // ============================================

    const [deposits, promotionalCredits, expenses] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          shop_id,
          type: 'DEPOSIT',
        },

        _sum: {
          amount: true,
        },
      }),

      this.prisma.transaction.aggregate({
        where: {
          shop_id,
          type: 'PROMOTIONAL_CREDIT',
        },

        _sum: {
          amount: true,
        },
      }),

      this.prisma.transaction.aggregate({
        where: {
          shop_id,
          type: 'EXPENSE',
        },

        _sum: {
          amount: true,
        },
      }),
    ]);

    const depositAmount = Number(deposits._sum.amount ?? 0);

    const promotionalCreditAmount = Number(promotionalCredits._sum.amount ?? 0);

    const expenseAmount = Number(expenses._sum.amount ?? 0);

    const balance = depositAmount + promotionalCreditAmount - expenseAmount;

    // ============================================
    // نام ماه‌های شمسی
    // ============================================

    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    // ============================================
    // گروه‌بندی تراکنش‌ها بر اساس ماه
    // ============================================

    const groups = new Map<
      string,
      {
        key: string;
        year: number;
        month: number;
        month_name: string;
        title: string;
        transactions: any[];
      }
    >();

    for (const transaction of transactions) {
      const date = dayjs(transaction.created_at).calendar('jalali');

      const year = date.year();

      const month = date.month() + 1;

      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!groups.has(key)) {
        const monthName = monthNames[month - 1];

        const lastDay = date.endOf('month').date();

        groups.set(key, {
          key,

          year,

          month,

          month_name: monthName,

          title: `از ۱ تا ${lastDay} ` + `${monthName} ` + `${year}`,

          transactions: [],
        });
      }

      groups.get(key)!.transactions.push({
        id: Number(transaction.id),

        amount: Number(transaction.amount),

        title: transaction.title,

        description: transaction.description,

        type: transaction.type,

        created_at: transaction.created_at,

        updated_at: transaction.updated_at,

        date: {
          year,

          month,

          day: date.date(),
        },
      });
    }

    // ============================================
    // Response
    // ============================================

    return {
      balance,

      transactions: Array.from(groups.values()),
    };
  }

  async getShopStatistics(shop_id: number, user_id: number, query: GetShopStatisticsDto) {
    await this.getShopMember(shop_id, user_id);

    const range = query.range ?? StatisticsRange.LAST_30_DAYS;

    const offer_id = query.offer_id;

    const now = dayjs();

    let startDate: Date;
    let pointsCount: number;
    let unit: 'hour' | 'day';

    switch (range) {
      case StatisticsRange.LAST_24_HOURS:
        startDate = now.subtract(23, 'hour').startOf('hour').toDate();

        pointsCount = 24;
        unit = 'hour';
        break;

      case StatisticsRange.LAST_7_DAYS:
        startDate = now.subtract(6, 'day').startOf('day').toDate();

        pointsCount = 7;
        unit = 'day';
        break;

      case StatisticsRange.LAST_30_DAYS:
      default:
        startDate = now.subtract(29, 'day').startOf('day').toDate();

        pointsCount = 30;
        unit = 'day';
        break;
    }

    const endDate = now.toDate();

    /*
     * اگر product_id ارسال شده باشد،
     * اول بررسی می‌کنیم که این محصول واقعاً
     * متعلق به همین فروشگاه باشد.
     */

    if (offer_id) {
      const productOffer = await this.prisma.offer.findFirst({
        where: {
          id: offer_id,
          shop_id,
          is_deleted: false,
        },
        select: {
          id: true,
        },
      });

      if (!productOffer) {
        throw new NotFoundException('محصول مورد نظر پیدا نشد');
      }
    }

    /*
     * شرط مربوط به محصول
     */

    const offerWhere = {
      shop_id,
      is_deleted: false,

      ...(offer_id && {
        id: offer_id,
      }),
    };

    /*
     * شرط کلیک
     */

    const offerClickWhere = {
      offer: offerWhere,

      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [totalClicks, activeProducts, clicks, mostViewedProduct] = await this.prisma.$transaction([
      /*
       * تعداد کلیک
       *
       * اگر product_id وجود داشته باشد:
       * فقط کلیک‌های همان محصول
       */

      this.prisma.offerClick.count({
        where: offerClickWhere,
      }),

      /*
       * تعداد محصولات فعال
       *
       * این قسمت فقط زمانی برای کل فروشگاه معنی دارد.
       * برای صفحه محصول نیازی به آن نداریم.
       */

      this.prisma.offer.count({
        where: {
          shop_id,
          is_deleted: false,
          is_active: true,
        },
      }),

      /*
       * کلیک‌های مربوط به chart
       */

      this.prisma.offerClick.findMany({
        where: offerClickWhere,

        select: {
          created_at: true,
        },
      }),

      /*
       * پربازدیدترین محصول
       */

      this.prisma.offer.findFirst({
        where: offerWhere,

        orderBy: {
          view_count: 'desc',
        },

        select: {
          id: true,
          view_count: true,

          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const chartMap = new Map<
      string,
      {
        key: string;
        label: string;
        value: number;
      }
    >();

    /*
     * ابتدا تمام نقاط chart را می‌سازیم
     * تا نقاط بدون کلیک هم مقدار 0 داشته باشند.
     */

    for (let index = 0; index < pointsCount; index++) {
      let date: dayjs.Dayjs;
      let key: string;
      let label: string;

      if (unit === 'hour') {
        date = now.subtract(pointsCount - 1 - index, 'hour').startOf('hour');

        key = date.format('YYYY-MM-DD-HH');

        label = date.calendar('jalali').format('HH');
      } else {
        date = now.subtract(pointsCount - 1 - index, 'day').startOf('day');

        key = date.format('YYYY-MM-DD');

        label = String(date.calendar('jalali').date());
      }

      chartMap.set(key, {
        key,
        label,
        value: 0,
      });
    }

    /*
     * قرار دادن کلیک‌ها در chart
     */

    for (const click of clicks) {
      const clickDate = dayjs(click.created_at);

      const key = unit === 'hour' ? clickDate.format('YYYY-MM-DD-HH') : clickDate.format('YYYY-MM-DD');

      const point = chartMap.get(key);

      if (point) {
        point.value += 1;
      }
    }

    const chart = Array.from(chartMap.values());

    /*
     * Persian period
     */

    const jalaliStart = dayjs(startDate).calendar('jalali');

    const jalaliEnd = dayjs(endDate).calendar('jalali');

    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    const startMonthName = monthNames[jalaliStart.month()];

    const endMonthName = monthNames[jalaliEnd.month()];

    let periodLabel = '';

    if (range === StatisticsRange.LAST_24_HOURS) {
      periodLabel = '۲۴ ساعت اخیر';
    }

    if (range === StatisticsRange.LAST_7_DAYS || range === StatisticsRange.LAST_30_DAYS) {
      periodLabel = startMonthName === endMonthName ? startMonthName : `${startMonthName} - ${endMonthName}`;
    }

    return {
      range,

      period: {
        label: periodLabel,

        from: {
          year: jalaliStart.year(),

          month: jalaliStart.month() + 1,

          day: jalaliStart.date(),
        },

        to: {
          year: jalaliEnd.year(),

          month: jalaliEnd.month() + 1,

          day: jalaliEnd.date(),
        },
      },

      summary: {
        total_clicks: totalClicks,

        active_products: activeProducts,

        most_viewed_product: mostViewedProduct
          ? {
              id: Number(mostViewedProduct.id),

              name: mostViewedProduct.product?.name ?? 'محصول بدون نام',

              views: Number(mostViewedProduct.view_count ?? 0),
            }
          : null,
      },

      chart,
    };
  }

  async getShopReports(shop_id: number, user_id: number) {
    await this.getShopMember(shop_id, user_id);

    const reports = await this.prisma.report.findMany({
      where: {
        shop_id,
      },

      orderBy: {
        created_at: 'desc',
      },

      select: {
        id: true,

        description: true,

        price_at_report_time: true,

        status: true,

        created_at: true,

        updated_at: true,

        product: {
          select: {
            id: true,
            name: true,
          },
        },

        reportReason: {
          select: {
            id: true,
            title: true,
            type: true,
            report_type: true,
            needs_description: true,
          },
        },
      },
    });

    return {
      reports: reports.map((report) => ({
        id: Number(report.id),

        description: report.description,

        price_at_report_time: Number(report.price_at_report_time),

        status: report.status,

        created_at: report.created_at,

        updated_at: report.updated_at,

        product: {
          id: Number(report.product.id),

          name: report.product.name,
        },

        reason: {
          id: Number(report.reportReason.id),

          title: report.reportReason.title,

          type: report.reportReason.type,

          report_type: report.reportReason.report_type,

          needs_description: report.reportReason.needs_description,
        },
      })),
    };
  }

  async updateReportStatus(report_id: number, user_id: number, body: UpdateReportStatusDto) {
    const report = await this.prisma.report.findUnique({
      where: {
        id: report_id,
      },

      include: {
        reportReason: true,
      },
    });

    if (!report) {
      throw new NotFoundException('report not found');
    }

    await this.getShopMember(report.shop_id, user_id);

    // فقط گزارش‌های در انتظار قابل تغییر هستند
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('این گزارش قبلاً بررسی شده است');
    }

    /*
     * =========================
     * لغو گزارش
     * =========================
     */

    if (body.action === ReportAction.REJECT) {
      return this.prisma.report.update({
        where: {
          id: report_id,
        },

        data: {
          status: ReportStatus.REJECTED,
        },

        select: {
          id: true,
          status: true,
          updated_at: true,
        },
      });
    }

    /*
     * =========================
     * تایید گزارش
     * =========================
     */

    if (body.action === ReportAction.APPROVE) {
      /*
       * اگر گزارش مربوط به تغییر قیمت است،
       * قیمت جدید باید ارسال شده باشد.
       */

      if (report.reportReason.report_type === ReportType.PRICE_CHANGE_AFTER_ORDER) {
        if (body.new_price === undefined || body.new_price === null) {
          throw new BadRequestException('قیمت جدید الزامی است');
        }

        if (body.new_price <= 0) {
          throw new BadRequestException('قیمت جدید باید بیشتر از صفر باشد');
        }

        return this.prisma.$transaction(async (tx) => {
          /*
           * اینجا قیمت محصول/آفر را تغییر می‌دهیم.
           *
           * اگر قیمت در Offer است:
           */

          await tx.offer.updateMany({
            where: {
              shop_id: report.shop_id,
              product_id: report.product_id,
              is_deleted: false,
            },

            data: {
              price: body.new_price,
            },
          });

          /*
           * گزارش تایید شد
           */

          const updatedReport = await tx.report.update({
            where: {
              id: report_id,
            },

            data: {
              status: ReportStatus.RESOLVED,
            },

            select: {
              id: true,
              status: true,
              updated_at: true,
            },
          });

          return updatedReport;
        });
      }

      return this.prisma.report.update({
        where: {
          id: report_id,
        },

        data: {
          status: ReportStatus.RESOLVED,
        },

        select: {
          id: true,
          status: true,
          updated_at: true,
        },
      });
    }
  }

  async getProductsDeleted(shop_id: number, user_id: number) {
    await this.getShopMember(shop_id, user_id);
  }

  async getContactInfo(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopContacts: {
        select: {
          type: true,
          platform: true,
          value: true,
        },
      },
    });
    const phone = shop.shopContacts.find((item) => item.type === ContactType.PHONE);
    const secondPhone = shop.shopContacts.find((item) => item.type === ContactType.SECOND_PHONE);
    const messengers = shop.shopContacts
      .filter((item) => item.type === ContactType.MESSENGER)
      .map((item) => ({
        platform: item.platform.toLowerCase(),
        value: item.value,
      }));

    const socialMedias = shop.shopContacts
      .filter((item) => item.type === ContactType.SOCIAL_MEDIA)
      .map((item) => ({
        platform: item.platform.toLowerCase(),
        value: item.value,
      }));

    return {
      phone: phone?.value ?? null,
      second_phone: secondPhone?.value ?? null,
      messengers,
      social_medias: socialMedias,
    };
  }

  async updateContactInfo(shop_id: number, user_id: number, dto: UpdateContactInfoDto) {
    await this.getShopMember(shop_id, user_id);

    if (dto.phone && dto.second_phone && dto.phone === dto.second_phone) {
      throw new BadRequestException('شماره تماس پیش فرض و شماره تماس دوم نمی‌توانند یکی باشند');
    }

    const contacts: Prisma.ShopContactCreateManyInput[] = [];
    if (dto.phone) {
      contacts.push({
        type: ContactType.PHONE,
        platform: ContactPlatform.PHONE,
        value: dto.phone,
        shop_id,
      });
    }

    if (dto.second_phone) {
      contacts.push({
        type: ContactType.SECOND_PHONE,
        platform: ContactPlatform.PHONE,
        value: dto.second_phone,
        shop_id,
      });
    }

    dto.messengers?.forEach((item) => {
      contacts.push({
        type: ContactType.MESSENGER,

        platform: item.platform,

        value: item.value,

        shop_id,
      });
    });

    dto.social_medias?.forEach((item) => {
      contacts.push({
        type: ContactType.SOCIAL_MEDIA,

        platform: item.platform,

        value: item.value,

        shop_id,
      });
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.shopContact.deleteMany({
        where: {
          shop_id,
        },
      });

      if (contacts.length) {
        await tx.shopContact.createMany({
          data: contacts,
        });
      }
    });

    return { status: 200 };
  }

  async updateLocation(shop_id: number, user_id: number, { address, city_id, latitude, longitude, province_id }: UpdateLocationDto) {
    await this.getShopMember(shop_id, user_id);
    const city = await this.prisma.city.findFirst({
      where: {
        id: city_id,
        province_id,
      },
    });

    if (!city) {
      throw new BadRequestException('استان یا شهر انتخاب شده معتبر نیست');
    }
    await this.prisma.shop.update({
      where: {
        id: shop_id,
      },
      data: {
        address,
        latitude,
        longitude,
        province_id,
        city_id,
      },
    });
    return { status: 200 };
  }

  async updateOwnerInfo(shop_id: number, user_id: number, { birth_date, first_name, last_name, mobile_phone, national_code }: UpdateOwnerInfoDto) {
    await this.getShopMember(shop_id, user_id);
    await this.prisma.shopOwner.update({
      where: {
        id: shop_id,
      },
      data: {
        birth_date,
        first_name,
        last_name,
        mobile_phone,
        national_code,
      },
    });
    return { status: 200 };
  }

  async getAddressVerification(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopDocuments: {
        where: {
          section: 'ADDRESS_VERIFICATION',
        },
        select: {
          document_url: true,
        },
      },
    });
    return shop.shopDocuments.map((x) => x.document_url);
  }

  async getVerificationVideo(shop_id: number, user_id: number) {
    const shop = await this.getShopMember(shop_id, user_id, {
      shopDocuments: {
        where: {
          section: 'AUTHENTICATION_VIDEO',
        },
        select: {
          document_url: true,
        },
      },
    });
    return shop.shopDocuments.map((x) => x.document_url);
  }

  async getBusinessLicense(shop_id: number, type: string, user_id: number) {
    let businessType: BusinessLicenseType | undefined;

    switch (type) {
      case 'national-license':
        businessType = BusinessLicenseType.NATIONAL_PERMITS_SYSTEM;
        break;

      case 'iranian-asnaf':
        businessType = BusinessLicenseType.IRANIAN_ASNAF;
        break;

      case 'pharmacy-license':
        businessType = BusinessLicenseType.PHARMACY_LICENSE;
        break;

      default:
        throw new BadRequestException('invalid business license type');
    }

    const shop = await this.getShopMember(shop_id, user_id, {
      shopDocuments: {
        where: {
          section: VerificationSection.BUSINESS_LICENSE,
          business_license_type: businessType,
        },
        select: {
          document_url: true,
        },
      },
    });

    return shop.shopDocuments.map((x) => x.document_url);
  }

  async getProduct(shop_id: number, product_id: number, user_id: number) {
    await this.getShopMember(shop_id, user_id);

    const product = await this.prisma.offer.findFirst({
      where: {
        id: product_id,
        shop_id,
        is_deleted: false,
      },
      select: {
        id: true,
        price: true,
        description: true,
        is_active: true,
        is_available: true,
        warranty_duration: true,
        warranty: true,
        product: {
          select: {
            name: true,
            id: true,
            slug: true,
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
        offerImages: true,
        offerVideos: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }
    return {
      id: Number(product.id),
      product_id: product.product.id,
      name: product.product.name,
      slug: product.product.slug,
      price: Number(product.price),
      description: product.description,
      is_active: product.is_active,
      warranty: product.warranty,
      images: product.offerImages,
      videos: product.offerVideos,
      image_url: product.product.productImages,
    };
  }

  async getWarranties(shop_id: number, user_id: number) {
    await this.getShopMember(shop_id, user_id);
    const warranties = await this.prisma.warranty.findMany({
      select: {
        id: true,
        title: true,
      },
    });
    return warranties;
  }

  async removeProduct(shop_id: number, user_id: number, product_id: number) {
    await this.getShopMember(shop_id, user_id);
    await this.prisma.offer.delete({
      where: {
        id: product_id,
      },
    });
    return { status: 200 };
  }
}
