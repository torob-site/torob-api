import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateAlertDto, RemoveAlertDto } from './alert.dto';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users/me/alerts')
export class AlertController {
  constructor(private alertService: AlertService) {}

  @Get()
  async all(@UserPipe() user: User, @Query('only_ids', new ParseBoolPipe({ optional: true })) only_ids?: boolean) {
    return await this.alertService.all(user.id, only_ids);
  }

  @Get('products/:product_id')
  async getByProduct(@UserPipe() user: User, @Param('product_id', ParseIntPipe) product_id: number) {
    return await this.alertService.getByProduct(user.id, product_id);
  }

  @Post()
  async create(@UserPipe() user: User, @Body() data: CreateAlertDto) {
    return await this.alertService.create(user.id, data);
  }

  @Delete()
  async remove(@UserPipe() user: User, @Body() data: RemoveAlertDto) {
    return await this.alertService.remove(user.id, data);
  }
}
