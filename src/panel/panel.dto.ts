// panel.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsBoolean, IsInt, Matches, ValidateNested, IsOptional, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, IsEnum, Min, Max, IsIn, MaxLength, IsNumber, IsArray, IsLatitude, IsLongitude, Length, IsDateString, IsMobilePhone, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContactPlatform } from '@prisma/client';

// ============== DTOهای قبلی ==============

export class UpdateShopStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;
}

export class UpdateBusinessTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  business_type: string;
}

export class UpdateShopInstagramUserNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  instagram_username: string;
}

export class CreateLocationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  shop_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  longitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  province_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  city_id: number;
}

// ============== اعتبارسنجی‌های سفارشی برای ساعات کاری ==============

@ValidatorConstraint({ name: 'isValidTimeRange', async: false })
export class IsValidTimeRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as ShiftTimeDto;

    if (!object.start_time || !object.end_time) {
      return true;
    }

    const start = object.start_time.split(':').map(Number);
    const end = object.end_time.split(':').map(Number);

    const startSeconds = start[0] * 3600 + start[1] * 60 + start[2];
    const endSeconds = end[0] * 3600 + end[1] * 60 + end[2];

    return startSeconds < endSeconds;
  }

  defaultMessage(args: ValidationArguments) {
    return 'زمان شروع باید کمتر از زمان پایان باشد';
  }
}

@ValidatorConstraint({ name: 'noShiftOverlap', async: false })
export class NoShiftOverlapConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as DayWorkingHoursDto;

    if (!object.shift1 || !object.shift2) {
      return true;
    }

    const s1 = object.shift1;
    const s2 = object.shift2;

    if (!s1.start_time || !s1.end_time || !s2.start_time || !s2.end_time) {
      return true;
    }

    const s1Start = s1.start_time.split(':').map(Number);
    const s1End = s1.end_time.split(':').map(Number);
    const s2Start = s2.start_time.split(':').map(Number);
    const s2End = s2.end_time.split(':').map(Number);

    const s1StartSec = s1Start[0] * 3600 + s1Start[1] * 60 + s1Start[2];
    const s1EndSec = s1End[0] * 3600 + s1End[1] * 60 + s1End[2];
    const s2StartSec = s2Start[0] * 3600 + s2Start[1] * 60 + s2Start[2];
    const s2EndSec = s2End[0] * 3600 + s2End[1] * 60 + s2End[2];

    // بررسی تداخل: شیفت اول نباید با شیفت دوم تداخل داشته باشد
    return s1EndSec <= s2StartSec;
  }

  defaultMessage(args: ValidationArguments) {
    return 'شیفت اول و دوم با هم تداخل دارند';
  }
}

// ============== DTOهای ساعات کاری ==============

export class ShiftTimeDto {
  @ApiProperty({ example: '09:00:00', description: 'زمان شروع به فرمت HH:mm:ss' })
  @IsString({ message: 'زمان شروع باید متن باشد' })
  @IsNotEmpty({ message: 'زمان شروع نمی‌تواند خالی باشد' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'زمان باید به فرمت HH:mm:ss باشد (مثال: 09:00:00)',
  })
  start_time: string;

  @ApiProperty({ example: '18:00:00', description: 'زمان پایان به فرمت HH:mm:ss' })
  @IsString({ message: 'زمان پایان باید متن باشد' })
  @IsNotEmpty({ message: 'زمان پایان نمی‌تواند خالی باشد' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'زمان باید به فرمت HH:mm:ss باشد (مثال: 18:00:00)',
  })
  end_time: string;

  @Validate(IsValidTimeRangeConstraint, {
    message: 'زمان شروع باید کمتر از زمان پایان باشد',
  })
  validateTimeRange: boolean;
}

export class DayWorkingHoursDto {
  @ApiPropertyOptional({ type: ShiftTimeDto })
  @ValidateNested({ message: 'شیفت اول نامعتبر است' })
  @Type(() => ShiftTimeDto)
  @IsOptional()
  shift1?: ShiftTimeDto;

  @ApiPropertyOptional({ type: ShiftTimeDto })
  @ValidateNested({ message: 'شیفت دوم نامعتبر است' })
  @Type(() => ShiftTimeDto)
  @IsOptional()
  shift2?: ShiftTimeDto;

  @Validate(NoShiftOverlapConstraint, {
    message: 'شیفت اول و دوم با هم تداخل دارند',
  })
  validateNoOverlap: boolean;
}

export class UpdateWorkingHoursDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      saturday: {
        shift1: { start_time: '09:00:00', end_time: '13:00:00' },
        shift2: { start_time: '14:30:00', end_time: '20:00:00' },
      },
      sunday: {
        shift1: { start_time: '10:00:00', end_time: '18:00:00' },
      },
      monday: {
        shift1: { start_time: '10:00:00', end_time: '18:00:00' },
      },
      tuesday: {
        shift1: { start_time: '10:00:00', end_time: '18:00:00' },
      },
      wednesday: {
        shift1: { start_time: '10:00:00', end_time: '18:00:00' },
      },
      thursday: {
        shift1: { start_time: '10:00:00', end_time: '18:00:00' },
      },
      friday: {
        shift1: { start_time: '10:30:00', end_time: '14:00:00' },
        shift2: { start_time: '15:00:00', end_time: '20:00:00' },
      },
    },
  })
  @IsObject({ message: 'daily_working_hours باید یک شیء باشد' })
  @ValidateNested({ message: 'ساختار روزهای هفته نامعتبر است' })
  @Type(() => DayWorkingHoursDto)
  daily_working_hours: {
    saturday: DayWorkingHoursDto;
    sunday: DayWorkingHoursDto;
    monday: DayWorkingHoursDto;
    tuesday: DayWorkingHoursDto;
    wednesday: DayWorkingHoursDto;
    thursday: DayWorkingHoursDto;
    friday: DayWorkingHoursDto;
  };
}

export enum ProductSortField {
  NAME = 'name',
  CREATED_AT = 'created_at',
  VIEWS = 'views',
  QUANTITY_DESC = 'quantity_desc',
  QUANTITY_ASC = 'quantity_asc',
}

export class GetProductsQueryDto {
  @ApiPropertyOptional({
    enum: ProductSortField,
    default: ProductSortField.CREATED_AT,
    description: 'مرتب‌سازی بر اساس: نام محصول, جدیدترین, پربازدیدترین, موجودی, ناموجود',
  })
  @IsOptional()
  @IsEnum(ProductSortField)
  sort?: ProductSortField = ProductSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'جستجو در نام و توضیحات محصول',
    example: 'گوشی',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'شماره صفحه',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'تعداد آیتم در هر صفحه',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'فیلتر بر اساس وجود توضیحات (true: دارای توضیحات, false: بدون توضیحات)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  has_description?: boolean;

  @ApiPropertyOptional({
    description: 'فیلتر بر اساس وجود گارانتی (true: دارای گارانتی, false: بدون گارانتی)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  has_warranty?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'عنوان گارانتی',
    example: 'گارانتی ۲۴ ماهه',
  })
  @IsOptional()
  @IsInt()
  warranty_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsIn([6, 12, 18, 24, 36, 48, 60, 120])
  warranty_duration?: number;
}

export enum StatisticsRange {
  LAST_24_HOURS = '24h',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
}

export class GetShopStatisticsDto {
  @IsOptional()
  @IsEnum(StatisticsRange)
  range?: StatisticsRange = StatisticsRange.LAST_30_DAYS;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offer_id?: number;
}

export enum ReportAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class UpdateReportStatusDto {
  @IsEnum(ReportAction)
  action: ReportAction;

  @IsOptional()
  @IsInt()
  new_price?: number;
}

class ContactItemDto {
  @IsEnum(ContactPlatform)
  platform: ContactPlatform;

  @IsString()
  value: string;
}

export class UpdateContactInfoDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  second_phone?: string;

  @IsOptional()
  @IsArray()
  messengers?: ContactItemDto[];

  @IsOptional()
  @IsArray()
  social_medias?: ContactItemDto[];
}

export class FindMergeCandidatesDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'عنوان الزامی است' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'حداکثر تعداد نامزدها', example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  max_candidates?: number = 5;
}

export class UpdateLocationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'استان الزامی است' })
  @IsInt({ message: 'شناسه استان باید عدد صحیح باشد' })
  @IsNumber({}, { message: 'شناسه استان باید عدد باشد' })
  province_id: number;

  @ApiProperty({
    description: 'شناسه شهر',
    example: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'شهر الزامی است' })
  @IsInt({ message: 'شناسه شهر باید عدد صحیح باشد' })
  @IsNumber({}, { message: 'شناسه شهر باید عدد باشد' })
  city_id: number;

  @ApiProperty({
    description: 'طول جغرافیایی (latitude)',
    example: 35.6892,
    required: true,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty({ message: 'طول جغرافیایی الزامی است' })
  @IsNumber({}, { message: 'طول جغرافیایی باید عدد باشد' })
  @Min(-90, { message: 'طول جغرافیایی باید بین -۹۰ و ۹۰ درجه باشد' })
  @Max(90, { message: 'طول جغرافیایی باید بین -۹۰ و ۹۰ درجه باشد' })
  @IsLatitude({ message: 'طول جغرافیایی معتبر نیست' })
  latitude: number;

  @ApiProperty({
    description: 'عرض جغرافیایی (longitude)',
    example: 51.389,
    required: true,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty({ message: 'عرض جغرافیایی الزامی است' })
  @IsNumber({}, { message: 'عرض جغرافیایی باید عدد باشد' })
  @Min(-180, { message: 'عرض جغرافیایی باید بین -۱۸۰ و ۱۸۰ درجه باشد' })
  @Max(180, { message: 'عرض جغرافیایی باید بین -۱۸۰ و ۱۸۰ درجه باشد' })
  @IsLongitude({ message: 'عرض جغرافیایی معتبر نیست' })
  longitude: number;
}

export class UpdateOwnerInfoDto {
  @ApiProperty({
    description: 'کد ملی',
    example: '0011111111',
    required: true,
  })
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  @IsString({ message: 'کد ملی باید از نوع متن باشد' })
  @Length(10, 10, { message: 'کد ملی باید ۱۰ رقم باشد' })
  @Matches(/^[0-9]+$/, { message: 'کد ملی باید فقط شامل اعداد باشد' })
  national_code: string;

  @ApiProperty({
    description: 'نام',
    example: 'علی',
    required: true,
  })
  @IsNotEmpty({ message: 'نام الزامی است' })
  @IsString({ message: 'نام باید از نوع متن باشد' })
  @Length(2, 50, { message: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد' })
  first_name: string;

  @ApiProperty({
    description: 'نام خانوادگی',
    example: 'رضایی',
    required: true,
  })
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @IsString({ message: 'نام خانوادگی باید از نوع متن باشد' })
  @Length(2, 50, { message: 'نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد' })
  last_name: string;

  @ApiProperty({
    description: 'تاریخ تولد (اختیاری)',
    example: '1990-01-10',
    required: false,
    nullable: true,
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate({ message: 'تاریخ تولد باید از نوع تاریخ باشد' })
  birth_date: Date;

  @ApiProperty({
    description: 'شماره همراه',
    example: '09120000001',
    required: true,
  })
  @IsNotEmpty({ message: 'شماره همراه الزامی است' })
  @IsMobilePhone('fa-IR', {}, { message: 'شماره همراه نامعتبر است' })
  @Matches(/^09[0-9]{9}$/, { message: 'شماره همراه باید با 09 شروع شود و ۱۱ رقم باشد' })
  mobile_phone: string;
}

export class SuggestCategoryDto {
  @ApiProperty({ description: 'عنوان محصول' })
  @IsNotEmpty({ message: 'عنوان الزامی است' })
  @IsString()
  title: string;
}

export class CreateOfferDto {
  @ApiProperty({ description: 'عنوان محصول (برای محصول جدید)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'شناسه محصول موجود (برای الحاق به محصول موجود)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @ApiProperty({ description: 'شناسه دسته‌بندی (برای محصول جدید)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @ApiProperty({ description: 'قیمت پیشنهادی' })
  @IsNotEmpty({ message: 'قیمت الزامی است' })
  price: number;

  @ApiPropertyOptional({ description: 'توضیحات' })
  @IsOptional()
  @IsString()
  description?: string;
}
