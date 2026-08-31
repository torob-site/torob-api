import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import type { Request, Response } from 'express';
import { OptionalJwtGuard } from 'src/auth/optional-jwt.guard';
import { type User } from '@prisma/client';
import { UserPipe } from 'src/auth/user.decorator';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get('special-offers')
  async specialOffers() {}

  @Get('price-list/:category_id')
  async priceList(@Param('category_id', ParseIntPipe) category_id: number, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return await this.productService.priceList(category_id, page, limit);
  }

  @Get('/redirect')
  @UseGuards(OptionalJwtGuard)
  async redirect(@UserPipe() user: User, @Query('offer_id', ParseIntPipe) offer_id: number, @Req() req: Request, @Res() res: Response) {
    const url = await this.productService.redirect({
      offer_id,
      user_id: user.id,
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
  @UseGuards(OptionalJwtGuard)
  async productOffers(
    @Param('product_id', ParseIntPipe) product_id: number,
    @UserPipe() user: User,
    @Query('filter') filter?: string,
  ) {
    return await this.productService.offers(product_id, user?.id, filter);
  }

  @Get(':product_id/map/offers')
  @UseGuards(OptionalJwtGuard)
  async productMapOffers(@Param('product_id', ParseIntPipe) product_id: number, @UserPipe() user: User) {
    return await this.productService.mapOffers(product_id, user.id);
  }
}
