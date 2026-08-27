import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { type User } from '@prisma/client';
import { UserPipe } from 'src/auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users/me/purchases')
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @Get()
  async all(
    @UserPipe() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return await this.purchaseService.all(user.id, page, limit, search);
  }

  @Get(':id')
  async detail(
    @UserPipe() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.purchaseService.detail(user.id, id);
  }
}
