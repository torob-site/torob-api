import { PrismaClient, ReportReasonType, ReportType, ShopType, ShopStatus, SpecificationType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ---------- Types ----------
type CategorySeed = {
  title: string;
  url: string;
  children?: CategorySeed[];
};

type CitySeed = { name: string; slug: string };

type ProvinceSeed = {
  name: string;
  slug: string;
  cities: CitySeed[];
};

type BusinessTypeSeed = { value: string; label: string };

type ReportReasonSeed = {
  type: ReportReasonType;
  title: string;
  report_type: ReportType | null;
  needs_description: boolean;
  shop_type?: ShopType;
  children?: ReportReasonSeed[];
};

type BrandSeed = {
  name: string;
  name_en: string;
  slug: string;
};

type ProductImageSeed = {
  url: string;
  is_main: boolean;
};

type ProductPriceHistorySeed = {
  date: string;
  min_price: number;
  avg_price: number;
  max_price: number;
};

type SpecificationSeed = {
  title: string;
  value: string;
};

type ProductSpecificationsSeed = {
  key: SpecificationSeed[];
  general: SpecificationSeed[];
};

type ProductSeed = {
  name: string;
  name_en: string;
  slug: string;
  category_id: number;
  brand_id?: number | null;
  is_authentic: boolean;
  images: ProductImageSeed[];
  price_history: ProductPriceHistorySeed[];
  specifications?: ProductSpecificationsSeed;
};

type ShopOwnerSeed = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  national_code: string | null;
  mobile_phone: string | null;
  birth_date: string | null;
};

type ShopSeed = {
  type: ShopType;
  status: ShopStatus;
  is_active: boolean;
  shop_name: string;
  has_license: boolean;
  is_guaranteed: boolean;
  business_type_id: number | null;
  domain: string;
  instagram_username: string;
  address: string;
  latitude: number;
  longitude: number;
  shop_logo: string;
  province_id: number;
  city_id: number;
  owner_id: number;
  reject_reason?: string;
};

type UserSeed = {
  id: number;
  phone: string;
  name: string | null;
  is_active: boolean;
  city_id: number | null;
};

type ShopMemberSeed = {
  is_owner: boolean;
  is_admin: boolean;
  is_deleted: boolean;
  user_id: number;
  shop_id: number;
};

type WarrantySeed = {
  title: string;
};

type OfferSeed = {
  product_id: number;
  shop_id: number;
  price: number;
  status: 'CONFIRMED' | 'PENDING' | 'REJECTED';
  is_active: boolean;
  is_available: boolean;
  warranty_id: number | null;
  warranty_duration: number | null;
};

type SeedData = {
  categories: CategorySeed[];
  provinces: ProvinceSeed[];
  business_types: BusinessTypeSeed[];
  report_reasons: ReportReasonSeed[];
  brands: BrandSeed[];
  products: ProductSeed[];
  shop_owners: ShopOwnerSeed[];
  shops: ShopSeed[];
  users: UserSeed[];
  shop_members: ShopMemberSeed[];
  warranties: WarrantySeed[];
  offers: OfferSeed[];
};

// ---------- Load ----------
function loadSeedData(): SeedData {
  const filePath = path.join(__dirname, 'data', 'seed-data.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SeedData;
}

// ---------- Cleanup ----------
async function cleanupAll() {
  console.log('🗑️  Cleaning up existing data...');

  // 1) وابسته‌های Offer (عمیق‌ترین)
  await prisma.offerClick.deleteMany();
  await prisma.offerHistory.deleteMany();
  await prisma.offerImage.deleteMany();
  await prisma.offerVideo.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.offer.deleteMany(); // → Product, Shop, Warranty

  // 2) وابسته‌های Product
  await prisma.productImage.deleteMany();
  await prisma.productPriceHistory.deleteMany();
  await prisma.productView.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productSpecification.deleteMany(); // ← وابسته به Specification و Product
  await prisma.alert.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany(); // → Category, Brand

  // 3) Specification (بعد از productSpecification)
  await prisma.specification.deleteMany(); // → Category

  // 4) وابسته‌های Shop
  await prisma.shopMember.deleteMany();
  await prisma.shopCategory.deleteMany();
  await prisma.shopContact.deleteMany();
  await prisma.shopWorkingHour.deleteMany();
  await prisma.shopImage.deleteMany();
  await prisma.shopVerification.deleteMany();
  await prisma.shopDocument.deleteMany();
  await prisma.shop.deleteMany(); // → Business, Province, City, ShopOwner

  // 5) وابسته‌های User
  await prisma.categoryLog.deleteMany();
  await prisma.userSearchHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.transaction.deleteMany();

  // 6) User, ShopOwner
  await prisma.user.deleteMany();
  await prisma.shopOwner.deleteMany();

  // 7) Warranty (بعد از Offer)
  await prisma.warranty.deleteMany();

  // 8) Brand, ReportReason, Business
  await prisma.brand.deleteMany();
  await prisma.reportReason.deleteMany();
  await prisma.business.deleteMany();

  // 9) City, Province
  await prisma.city.deleteMany();
  await prisma.province.deleteMany();

  // 10) Category (خودارجاع)
  await prisma.category.updateMany({ data: { parent_id: null } });
  await prisma.category.deleteMany();

  // 11) ریست AUTO_INCREMENT همه جداول
  await prisma.$executeRawUnsafe(`ALTER TABLE categories AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE business AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE brands AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE provinces AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE cities AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE products AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE productImages AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE productPrice AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE specifications AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE productSpecifications AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE shops AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE shopOwners AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE users AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE shopMember AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE reportReasons AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE warranties AUTO_INCREMENT = 1;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE offers AUTO_INCREMENT = 1;`);

  console.log('✅ Cleanup completed.');
}

// ---------- Categories ----------
async function createCategory(category: CategorySeed, parentId: number | null = null) {
  const created = await prisma.category.create({
    data: {
      title: category.title,
      url: category.url,
      parent_id: parentId,
    },
  });

  for (const child of category.children ?? []) {
    await createCategory(child, created.id);
  }
}

async function seedCategories(categories: CategorySeed[]) {
  console.log('🌱 Seeding categories...');
  for (const category of categories) {
    await createCategory(category);
  }
  console.log('✅ Categories seeded successfully.');
}

// ---------- Provinces & Cities ----------
async function seedProvincesAndCities(provinces: ProvinceSeed[]) {
  console.log('🌱 Seeding provinces and cities...');

  for (const provinceData of provinces) {
    const province = await prisma.province.create({
      data: { name: provinceData.name, slug: provinceData.slug },
    });

    for (const cityData of provinceData.cities) {
      await prisma.city.create({
        data: {
          name: cityData.name,
          slug: `${provinceData.slug}-${cityData.slug}`,
          province_id: province.id,
        },
      });
    }
  }

  console.log('✅ Provinces and cities seeded successfully.');
}

// ---------- Business Types ----------
async function seedBusinessTypes(businessTypes: BusinessTypeSeed[]) {
  console.log('🌱 Seeding business types...');

  for (const bt of businessTypes) {
    await prisma.business.create({
      data: { value: bt.value, label: bt.label },
    });
  }

  console.log('✅ Business types seeded successfully.');
}

// ---------- Report Reasons ----------
async function createReportReason(reason: ReportReasonSeed, parentId: number | null = null, parentShopType: ShopType | null = null) {
  const shopType = reason.shop_type ?? parentShopType;

  if (!shopType) {
    throw new Error(`❌ shop_type is required but missing for report reason: "${reason.title}"`);
  }

  const created = await prisma.reportReason.create({
    data: {
      title: reason.title,
      type: reason.type,
      shop_type: shopType,
      report_type: reason.report_type ?? undefined,
      needs_description: reason.needs_description,
      parent_id: parentId,
    },
  });

  for (const child of reason.children ?? []) {
    await createReportReason(child, created.id, created.shop_type);
  }
}

async function seedReportReasons(reportReasons: ReportReasonSeed[]) {
  console.log('🌱 Seeding report reasons...');
  for (const reason of reportReasons) {
    await createReportReason(reason);
  }
  console.log('✅ Report reasons seeded successfully.');
}

// ---------- Brands ----------
async function seedBrands(brands: BrandSeed[]) {
  console.log('🌱 Seeding brands...');

  for (const brand of brands) {
    await prisma.brand.create({
      data: {
        name: brand.name,
        name_en: brand.name_en,
        slug: brand.slug,
      },
    });
  }

  console.log('✅ Brands seeded successfully.');
}

// ---------- Specifications ----------
async function seedSpecifications(products: ProductSeed[]) {
  console.log('🌱 Seeding specifications...');

  // استخراج همه specificationهای یکتا (بر اساس title + category_id)
  const specMap = new Map<string, { title: string; category_id: number }>();

  for (const product of products) {
    const allSpecs = [...(product.specifications?.key ?? []), ...(product.specifications?.general ?? [])];

    for (const spec of allSpecs) {
      const key = `${product.category_id}::${spec.title}`;
      if (!specMap.has(key)) {
        specMap.set(key, {
          title: spec.title,
          category_id: product.category_id,
        });
      }
    }
  }

  // درج Specificationها
  for (const spec of specMap.values()) {
    await prisma.specification.create({
      data: {
        title: spec.title,
        category_id: spec.category_id,
        filterable: true,
      },
    });
  }

  console.log(`✅ ${specMap.size} specifications seeded successfully.`);
}

// ---------- Products ----------
async function seedProducts(products: ProductSeed[]) {
  console.log('🌱 Seeding products, images, price history and specifications...');

  for (const product of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        name_en: product.name_en,
        category_id: product.category_id,
        brand_id: product.brand_id ?? null,
        is_authentic: product.is_authentic,
      },
      create: {
        name: product.name,
        name_en: product.name_en,
        slug: product.slug,
        category_id: product.category_id,
        brand_id: product.brand_id ?? null,
        is_authentic: product.is_authentic,
        view_count: 0,
        offer_count: 0,
      },
    });

    // تصاویر
    await prisma.productImage.deleteMany({
      where: { product_id: createdProduct.id },
    });
    for (const image of product.images) {
      await prisma.productImage.create({
        data: {
          url: image.url,
          is_main: image.is_main,
          product_id: createdProduct.id,
        },
      });
    }

    // تاریخچه قیمت
    await prisma.productPriceHistory.deleteMany({
      where: { product_id: createdProduct.id },
    });
    for (const ph of product.price_history) {
      await prisma.productPriceHistory.create({
        data: {
          product_id: createdProduct.id,
          date: new Date(ph.date),
          min_price: ph.min_price,
          avg_price: ph.avg_price,
          max_price: ph.max_price,
        },
      });
    }

    // مشخصات محصول (key + general)
    await prisma.productSpecification.deleteMany({
      where: { product_id: createdProduct.id },
    });

    const keySpecs = product.specifications?.key ?? [];
    const generalSpecs = product.specifications?.general ?? [];

    for (const spec of keySpecs) {
      const specification = await prisma.specification.findUnique({
        where: {
          title_category_id: {
            title: spec.title,
            category_id: product.category_id,
          },
        },
        select: { id: true },
      });

      if (!specification) {
        console.warn(`⚠️ Specification not found: ${spec.title} (category: ${product.category_id})`);
        continue;
      }

      await prisma.productSpecification.create({
        data: {
          value: spec.value,
          type: 'KEY' as SpecificationType,
          specification_id: specification.id,
          product_id: createdProduct.id,
        },
      });
    }

    for (const spec of generalSpecs) {
      const specification = await prisma.specification.findUnique({
        where: {
          title_category_id: {
            title: spec.title,
            category_id: product.category_id,
          },
        },
        select: { id: true },
      });

      if (!specification) {
        console.warn(`⚠️ Specification not found: ${spec.title} (category: ${product.category_id})`);
        continue;
      }

      await prisma.productSpecification.create({
        data: {
          value: spec.value,
          type: 'GENERAL' as SpecificationType,
          specification_id: specification.id,
          product_id: createdProduct.id,
        },
      });
    }
  }

  console.log('✅ Products, images, price history and specifications seeded successfully.');
}

// ---------- Shop Owners ----------
async function seedShopOwners(owners: ShopOwnerSeed[]) {
  console.log('🌱 Seeding shop owners...');

  for (const owner of owners) {
    await prisma.shopOwner.create({
      data: {
        id: owner.id,
        first_name: owner.first_name ?? null,
        last_name: owner.last_name ?? null,
        national_code: owner.national_code ?? null,
        mobile_phone: owner.mobile_phone ?? null,
        birth_date: owner.birth_date ? new Date(owner.birth_date) : null,
      },
    });
  }

  console.log('✅ Shop owners seeded successfully.');
}

// ---------- Shops ----------
async function seedShops(shops: ShopSeed[]) {
  console.log('🌱 Seeding shops...');

  for (const shop of shops) {
    await prisma.shop.create({
      data: {
        type: shop.type,
        status: shop.status,
        is_active: shop.is_active,
        shop_name: shop.shop_name,
        has_license: shop.has_license,
        is_guaranteed: shop.is_guaranteed,
        business_type_id: shop.business_type_id ?? null,
        domain: shop.domain,
        instagram_username: shop.instagram_username,
        address: shop.address,
        latitude: shop.latitude,
        longitude: shop.longitude,
        shop_logo: shop.shop_logo,
        province_id: shop.province_id,
        city_id: shop.city_id ?? null,
        owner_id: shop.owner_id,
        reject_reason: shop.reject_reason ?? null,
      },
    });
  }

  console.log('✅ Shops seeded successfully.');
}

// ---------- Users ----------
async function seedUsers(users: UserSeed[]) {
  console.log('🌱 Seeding users...');

  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name ?? '',
        is_active: user.is_active ?? true,
        city_id: user.city_id ?? null,
      },
    });
  }

  console.log('✅ Users seeded successfully.');
}

// ---------- Shop Members ----------
async function seedShopMembers(members: ShopMemberSeed[]) {
  console.log('🌱 Seeding shop members...');

  for (const member of members) {
    await prisma.shopMember.create({
      data: {
        is_owner: member.is_owner,
        is_admin: member.is_admin,
        is_deleted: member.is_deleted,
        user_id: member.user_id,
        shop_id: member.shop_id,
      },
    });
  }

  console.log('✅ Shop members seeded successfully.');
}

// ---------- Warranties ----------
async function seedWarranties(warranties: WarrantySeed[]) {
  console.log('🌱 Seeding warranties...');

  for (const warranty of warranties) {
    await prisma.warranty.create({
      data: {
        title: warranty.title,
      },
    });
  }

  console.log('✅ Warranties seeded successfully.');
}

// ---------- Offers ----------
async function seedOffers(offers: OfferSeed[]) {
  console.log('🌱 Seeding offers...');

  for (const offer of offers) {
    await prisma.offer.create({
      data: {
        product_id: offer.product_id,
        shop_id: offer.shop_id,
        price: BigInt(offer.price),
        status: offer.status,
        is_active: offer.is_active,
        is_available: offer.is_available,
        warranty_id: offer.warranty_id ?? null,
        warranty_duration: offer.warranty_duration ?? null,
        more_info_url: '',
        stock_status: '',
        description: null,
        is_adv: false,
        is_deleted: false,
        view_count: 0,
      },
    });
  }

  console.log('✅ Offers seeded successfully.');
}

// ---------- Main ----------
async function main() {
  console.log('🌱 Starting seed...');

  await cleanupAll();

  const data = loadSeedData();

  await seedCategories(data.categories);
  await seedProvincesAndCities(data.provinces);
  await seedBusinessTypes(data.business_types);
  await seedReportReasons(data.report_reasons);
  await seedBrands(data.brands);
  await seedWarranties(data.warranties);
  await seedSpecifications(data.products); // ← قبل از seedProducts
  await seedProducts(data.products);
  await seedShopOwners(data.shop_owners);
  await seedShops(data.shops);
  await seedUsers(data.users);
  await seedShopMembers(data.shop_members);
  await seedOffers(data.offers);

  console.log('🎉 All seeds completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
