import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateViewDto } from './history.dto';
import { type User } from '@prisma/client';
import { UserPipe } from 'src/auth/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users/me/histories')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  async all(@UserPipe() user: User) {
    return await this.historyService.all(user.id);
  }

  @Post()
  async createView(@UserPipe() user: User, @Body() data: CreateViewDto) {
    return await this.historyService.createView(user.id, data);
  }

  @Delete()
  async allRemove(@UserPipe() user: User) {
    return await this.historyService.allRemove(user.id);
  }
}
