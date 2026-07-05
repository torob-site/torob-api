import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async provinces() {
    return await this.prisma.province.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async cities(province_id: number) {
    return await this.prisma.city.findMany({
      where: {
        province_id,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async popular() {
    const grouped = await this.prisma.user.groupBy({
      by: ['city_id'],
      where: {
        city_id: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          city_id: 'desc',
        },
      },
      take: 5,
    });

    return this.prisma.city.findMany({
      where: {
        id: {
          in: grouped.map((item) => item.city_id!),
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }
}
