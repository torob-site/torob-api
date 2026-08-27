import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FavoriteModule } from './favorite/favorite.module';
import { ShopModule } from './shop/shop.module';
import { CategoryModule } from './category/category.module';
import { TicketModule } from './ticket/ticket.module';
import { UserModule } from './user/user.module';
import { HistoryModule } from './history/history.module';
import { ReportModule } from './report/report.module';
import { LocationModule } from './location/location.module';
import { SearchModule } from './search/search.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma/prisma.module';
import { PanelModule } from './panel/panel.module';
import { AlertModule } from './alert/alert.module';
import { PurchaseModule } from './purchase/purchase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    FavoriteModule,
    ShopModule,
    CategoryModule,
    TicketModule,
    UserModule,
    HistoryModule,
    ReportModule,
    LocationModule,
    SearchModule,
    ProductModule,
    PrismaModule,
    AlertModule,
    PurchaseModule,
    PanelModule,
  ],
})
export class AppModule {}
