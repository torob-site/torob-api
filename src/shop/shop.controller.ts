import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ShopService } from './shop.service';
import { GetShopProductsDto } from './shop.dto';

@Controller('shops')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get()
  async all(@Query('q') q: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return await this.shopService.all(q, page, limit);
  }

  @Get(':shop_id')
  async get() {}

  @Get(':shop_id/products')
  async shopProducts(@Param('shop_id', ParseIntPipe) shop_id: number, @Body() data: GetShopProductsDto) {
    return await this.shopService.shopProducts(shop_id, data);
  }

  @Post()
  async create() {}
}
