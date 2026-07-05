import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get(':product_id/similar')
  async similar() {}

  @Get('special-offers')
  async specialOffers() {}
}
