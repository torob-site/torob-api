import { Body, Controller, Delete, Get, ParseBoolPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateAlertDto, RemoveAlertDto } from './alert.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me/alerts')
export class AlertController {
  constructor(private alertService: AlertService) {}

  @Get()
  async all(@Req() request, @Query('only_ids', ParseBoolPipe) only_ids: boolean) {
    return await this.alertService.all(request.user.userId, only_ids);
  }

  @Post()
  async create(@Req() request, @Body() data: CreateAlertDto) {
    return await this.alertService.create(request.user.userId, data);
  }

  @Delete()
  async remove(@Req() request, @Body() data: RemoveAlertDto) {
    return await this.alertService.remove(request.user.userId, data);
  }
}
