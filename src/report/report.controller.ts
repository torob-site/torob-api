import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { ShopType } from '@prisma/client';
import { CreateReportDto } from './report.dto';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get()
  async all(@Req() request) {
    return await this.reportService.all(request.user.userId);
  }

  @Get('options')
  async options(@Query('shop_type') shop_type: ShopType) {
    return this.reportService.options(shop_type);
  }

  @Post()
  async create(@Req() request, @Body() data: CreateReportDto) {
    return await this.reportService.create(request.user.userId, data);
  }
}
