import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('')
  async all() {
    return await this.categoryService.all();
  }

  @Get('/popular')
  async popular() {
    return await this.categoryService.popular();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':category_id/log')
  async createLog(@UserPipe() user: User, @Param('category_id', ParseIntPipe) category_id: number) {
    return await this.categoryService.createLog(user.id, category_id);
  }
}
