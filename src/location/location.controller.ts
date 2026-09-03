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
  async getProvinceCities(@Param('province_id', ParseIntPipe) province_id: number) {
    return await this.locationService.getProvinceCities(province_id);
  }

  @Get('/cities/popular')
  async mostVisited() {
    return await this.locationService.popular();
  }

  @Get('/cities')
  async getCities() {
    return await this.locationService.getCities();
  }
}
