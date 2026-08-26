import { Body, Controller, Get, ParseBoolPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateFavoriteDto } from './favorite.dto';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users/me/favorites')
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Get()
  async all(@UserPipe() user: User, @Query('only_ids', new ParseBoolPipe({ optional: true })) only_ids?: boolean) {
    return await this.favoriteService.all(user.id, only_ids);
  }

  @Post('toggle')
  async toggle(@UserPipe() user: User, @Body() data: CreateFavoriteDto) {
    return await this.favoriteService.toggle(user.id, data);
  }
}
