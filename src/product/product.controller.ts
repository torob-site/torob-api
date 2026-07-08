import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get(':product_id/:slug')
  async get(@Param('product_id', ParseIntPipe) product_id: number) {
    return await this.productService.get(product_id)
  }

  @Get(':product_id/price-history')
  async priceHistory(
    @Param('product_id', ParseIntPipe) product_id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return await this.productService.priceHistory(product_id, page, limit);
  }

  @Get(':product_id/price-chart')
  async priceChart(@Param('product_id', ParseIntPipe) product_id: number) {
    return await this.productService.priceChart(product_id)
  }

  @Get(':product_id/similar')
  async similar(
    @Param('product_id', ParseIntPipe) product_id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return await this.productService.similar(product_id, page, limit);
  }

  @Get('special-offers')
  async specialOffers() {}
}
