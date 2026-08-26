import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';
import { OptionalJwtGuard } from 'src/auth/optional-jwt.guard';
import { type User } from '@prisma/client';
import { UserPipe } from 'src/auth/user.decorator';

@Controller('')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('search')
  @UseGuards(OptionalJwtGuard)
  async search(@Query() data: SearchDto, @Query() query: Record<string, string>, @UserPipe() user: User) {
    const specifications: Record<string, string[]> = {};

    Object.keys(query).forEach((key) => {
      if (key.startsWith('spec_')) {
        const specKey = key.replace('spec_', '');
        specifications[specKey] = query[key].split(',');
      }
    });
    return await this.searchService.search(user.id, data, specifications);
  }

  @Get('search-by-image')
  async searcgByImage() {}

  @Get('search/autocomplete')
  @UseGuards(OptionalJwtGuard)
  async autocomplete(@Query('keyword') keyword: string, @UserPipe() user: User) {
    return await this.searchService.autocomplete(keyword, user.id);
  }
}
