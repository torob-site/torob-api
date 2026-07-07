import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserSelectCity } from './user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async me(@Req() request) {
    return await this.userService.me(request.user.userId);
  }

  @Get('me/favorites')
  async listFavorites(@Req() request) {
    return await this.userService.listFavorites(request.user.userId);
  }

  @Get('me/watchs')
  async listWatchs(@Req() request) {
    return await this.userService.listWatchs(request.user.userId);
  }

  @Post('me/select-city')
  async selectCity(@Body() data: UserSelectCity, @Req() request) {
    return await this.userService.selectCity(data, request.user.userId);
  }
}
