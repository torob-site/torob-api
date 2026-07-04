import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async provinces() {
    return await this.prisma.province.findMany({});
  }

  async cities(province_id: number) {
    return await this.prisma.city.findMany({
      where: {
        province_id,
      },
    });
  }
}
