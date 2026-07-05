import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Get('/provinces')
  async provinces() {
    return await this.locationService.provinces();
  }

  @Get('/provinces/:province_id/cities')
  async cities(@Param('province_id', ParseIntPipe) province_id: number) {
    return await this.locationService.cities(province_id);
  }

  @Get('/cities/popular')
  async mostVisited() {
    return await this.locationService.popular();
  }
}
