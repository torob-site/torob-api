import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserSelectCity } from './user.dto';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async me(@UserPipe() user: User) {
    return await this.userService.me(user.id);
  }

  @Post('me/select-city')
  async selectCity(@Body() data: UserSelectCity, @UserPipe() user: User) {
    return await this.userService.selectCity(data, user.id);
  }
}
