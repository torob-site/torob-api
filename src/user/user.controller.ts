import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserSelectCity } from './user.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async me(@Req() request) {
    return await this.userService.me(request.user.userId);
  }

  @Post('me/select-city')
  async selectCity(@Body() data: UserSelectCity, @Req() request) {
    return await this.userService.selectCity(data, request.user.userId);
  }
}
