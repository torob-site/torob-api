import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { ShopType } from '@prisma/client';
import { CreateReportDto } from './report.dto';
import { type User } from '@prisma/client';
import { UserPipe } from 'src/auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('users/me/reports')
  async all(@UserPipe() user: User) {
    return await this.reportService.all(user.id);
  }

  @Get('users/me/recent-offer-clicks')
  async recentOfferClicks(@UserPipe() user: User) {
    return await this.reportService.recentOfferClicks(user.id);
  }

  @Get('reports/options')
  async options(@Query('shop_type') shop_type: ShopType) {
    return this.reportService.options(shop_type);
  }

  @Post('users/me/reports')
  async create(@UserPipe() user: User, @Body() data: CreateReportDto) {
    return await this.reportService.create(user.id, data);
  }
}
