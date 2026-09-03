import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export enum shopProductsSortEnum {
  popularity = 'popularity',
  price_asc = 'price_asc',
  price_desc = 'price_desc',
  new = 'new',
}

export class GetShopProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  has_pickup?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  is_available?: boolean;

  @ApiProperty({ enum: shopProductsSortEnum })
  @IsOptional()
  @IsEnum(shopProductsSortEnum)
  sort: shopProductsSortEnum = shopProductsSortEnum.popularity;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price_gt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price_lt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(20)
  limit: number = 20;
}

export class CreateShopDto {
  // =====================================================
  // Shop Type
  // =====================================================

  @ApiProperty({
    description: 'نوع فروشگاه',
    enum: ['ONLINE_SHOP', 'OFFLINE_SHOP'],
    example: 'OFFLINE_SHOP',
  })
  @IsNotEmpty()
  @IsEnum(['ONLINE_SHOP', 'OFFLINE_SHOP'] as const)
  type: 'ONLINE_SHOP' | 'OFFLINE_SHOP';

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  shop_name: string;

  // =====================================================
  // City - Required for OFFLINE_SHOP
  // =====================================================

  @ApiPropertyOptional({
    description: 'شناسه شهر - برای فروشگاه حضوری الزامی است',
    example: 1,
  })
  @ValidateIf((o) => o.type === 'OFFLINE_SHOP')
  @IsNotEmpty({
    message: 'شناسه شهر برای فروشگاه حضوری الزامی است',
  })
  @Type(() => Number)
  @IsInt({
    message: 'شناسه شهر باید عدد صحیح باشد',
  })
  city_id?: number;

  // =====================================================
  // Business Type - Required for OFFLINE_SHOP
  // =====================================================

  @ApiPropertyOptional({
    description: 'مقدار نوع کسب‌وکار - برای فروشگاه حضوری الزامی است',
    example: 'biz-5',
  })
  @ValidateIf((o) => o.type === 'OFFLINE_SHOP')
  @IsDefined({
    message: 'حوزه فعالیت برای فروشگاه حضوری الزامی است',
  })
  @IsNotEmpty({
    message: 'حوزه فعالیت برای فروشگاه حضوری الزامی است',
  })
  @IsString({
    message: 'حوزه فعالیت باید رشته باشد',
  })
  business_type?: string;

  // =====================================================
  // Has License - Required for OFFLINE_SHOP
  // =====================================================

  @ApiPropertyOptional({
    description: 'آیا فروشگاه جواز کسب دارد؟ - برای فروشگاه حضوری الزامی است',
    example: true,
  })
  @ValidateIf((o) => o.type === 'OFFLINE_SHOP')
  @IsNotEmpty({
    message: 'مشخص کردن وضعیت جواز کسب برای فروشگاه حضوری الزامی است',
  })
  @IsBoolean({
    message: 'has_license باید مقدار boolean داشته باشد',
  })
  has_license?: boolean;

  // =====================================================
  // Domain - Required for ONLINE_SHOP
  // =====================================================

  @ApiPropertyOptional({
    description: 'آدرس دامنه - برای فروشگاه آنلاین الزامی است',
    example: 'example.com',
  })
  @ValidateIf((o) => o.type === 'ONLINE_SHOP')
  @IsNotEmpty({
    message: 'دامنه برای فروشگاه آنلاین الزامی است',
  })
  @IsString({
    message: 'دامنه باید رشته باشد',
  })
  domain?: string;
}
