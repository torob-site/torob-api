import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto, GetShopProductsDto } from './shop.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';

@Controller('shops')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get()
  async all(@Query('q') q: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return await this.shopService.all(q, page, limit);
  }

  @Get('business-types')
  async businessTypes() {
    return await this.shopService.businessTypes();
  }

  @Get(':shop_id')
  async get(@Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.shopService.get(shop_id);
  }

  @Get(':shop_id/products')
  async shopProducts(@Param('shop_id', ParseIntPipe) shop_id: number, @Query() data: GetShopProductsDto) {
    return await this.shopService.shopProducts(shop_id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateShopDto, @UserPipe() user: User) {
    return await this.shopService.create(user.id, dto);
  }
}
