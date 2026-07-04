import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SearchTypeEnum {
  product = 'product',
  category = 'category',
  shop = 'shop',
}

export enum SearchSortEnum {
  popularity = 'popularity',
  price_asc = 'price_asc',
  price_desc = 'price_desc',
  new = 'new',
  top_seller = 'top_seller',
}

export class SearchDto {
  @ApiProperty({ enum: SearchTypeEnum })
  @IsNotEmpty()
  @IsEnum(SearchTypeEnum)
  @IsString()
  type: SearchTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(20)
  limit: number = 20;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiProperty({ enum: SearchSortEnum })
  @IsOptional()
  @IsEnum(SearchSortEnum)
  sort: SearchSortEnum = SearchSortEnum.popularity;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  price_gt?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  price_lt?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  shop_type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  stock_status: string;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  brand_id: number;
}
