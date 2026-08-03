import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import type { Request, Response } from 'express';
import { OptionalJwtGuard } from 'src/auth/optional-jwt.guard';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get('special-offers')
  async specialOffers() {}

  @Get('/redirect')
  @UseGuards(OptionalJwtGuard)
  async redirect(@Req() request, @Query('offer_id', ParseIntPipe) offer_id: number, @Req() req: Request, @Res() res: Response) {
    const url = await this.productService.redirect({
      offer_id,
      user_id: request.user.userId,
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.socket.remoteAddress,
      user_agent: req.get('user-agent'),
      referer: req.get('referer'),
    });

    return res.redirect(302, url);
  }

  @Get(':product_id')
  async get(@Param('product_id', ParseIntPipe) product_id: number) {
    return await this.productService.get(product_id);
  }

  @Get(':product_id/offer-history')
  async offerHistory(@Param('product_id', ParseIntPipe) product_id: number, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return await this.productService.offerHistory(product_id, page, limit);
  }

  @Get(':product_id/price-history')
  async priceHistory(@Param('product_id', ParseIntPipe) product_id: number) {
    return await this.productService.priceHistory(product_id);
  }

  @Get(':product_id/similar')
  async similar(@Param('product_id', ParseIntPipe) product_id: number, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return await this.productService.similar(product_id, page, limit);
  }

  @Get(':product_id/offers')
  async productOffers(@Param('product_id', ParseIntPipe) product_id: number) {
    return await this.productService.offers(product_id);
  }

  @Get(':product_id/map/offers')
  @UseGuards(OptionalJwtGuard)
  async productMapOffers(@Param('product_id', ParseIntPipe) product_id: number, @Req() request) {
    return await this.productService.mapOffers(product_id, request.user.userId);
  }
}
