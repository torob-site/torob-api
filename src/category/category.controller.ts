import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';

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
  async createLog(
    @Req() request,
    @Param('category_id', ParseIntPipe) category_id: number,
  ) {
    return await this.categoryService.createLog(
      request.user.userId,
      category_id,
    );
  }
}
