import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';

@Controller('')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('search')
  async search(
    @Query() data: SearchDto,
    @Query() query: Record<string, string>,
  ) {
    const specifications: Record<string, string[]> = {};

    Object.keys(query).forEach((key) => {
      if (key.startsWith('spec_')) {
        const specKey = key.replace('spec_', '');
        specifications[specKey] = query[key].split(',');
      }
    });
    return await this.searchService.search(data, specifications);
  }

  @Get('search-by-image')
  async searcgByImage() {}

  @Get('search/autocomplete')
  async autocomplete(@Query('keyword') keyword: string, @Req() request) {
    return await this.searchService.autocomplete(keyword, request.user?.userId);
  }

  @Post('search/log')
  async log() {}
}
