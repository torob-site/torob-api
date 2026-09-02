import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateOfferDto, FindMergeCandidatesDto, GetProductsQueryDto, GetShopStatisticsDto, SuggestCategoryDto, UpdateBusinessTypeDto, UpdateContactInfoDto, UpdateLocationDto, UpdateOwnerInfoDto, UpdateProductDto, UpdateReportStatusDto, UpdateShopInstagramUserNameDto, UpdateShopStatusDto } from './panel.dto';
import { PanelService } from './panel.service';
import { UserPipe } from 'src/auth/user.decorator';
import { type User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('panel/shops')
export class PanelController {
  constructor(private panelService: PanelService) {}

  @Get('my-shops')
  async myShops(@UserPipe() user: User) {
    return await this.panelService.getMyShops(user.id);
  }

  @Patch(':shop_id/status')
  async updateShopStatus(@Param('shop_id', ParseIntPipe) shop_id: number, @Body() data: UpdateShopStatusDto, @UserPipe() user: User) {
    return this.panelService.updateShopStatus(shop_id, data, user.id);
  }

  @Get(':shop_id/instagram-username')
  async getInstagramUserName(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getInstagramUserName(shop_id, user.id);
  }

  @Patch(':shop_id/instagram-username')
  async updateShopInstagramUserName(@Param('shop_id', ParseIntPipe) shop_id: number, @Body() data: UpdateShopInstagramUserNameDto, @UserPipe() user: User) {
    return this.panelService.updateShopInstagramUserName(shop_id, data, user.id);
  }

  @Get(':shop_id/status')
  async getStatus(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getStatus(shop_id, user.id);
  }

  @Get(':shop_id/owner-info')
  async getOwnerInfo(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getOwnerInfo(shop_id, user.id);
  }

  @Get(':shop_id/business-types')
  async getBusinessType(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getBusinessType(shop_id, user.id);
  }

  @Patch(':shop_id/business-type')
  async updateBusinessType(@Param('shop_id', ParseIntPipe) shop_id: number, @Body() data: UpdateBusinessTypeDto, @UserPipe() user: User) {
    return this.panelService.updateBusinessType(shop_id, data, user.id);
  }

  @Get(':shop_id/profile')
  async getShopProfile(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User) {
    return this.panelService.getShopProfile(shop_id, user.id);
  }

  @Get(':shop_id/images')
  async getShopImages(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User) {
    return this.panelService.getShopImages(shop_id, user.id);
  }

  @Get(':shop_id/products')
  async getShopProducts(@Param('shop_id', ParseIntPipe) shop_id: number, @Query() query: GetProductsQueryDto, @UserPipe() user: User) {
    return this.panelService.getShopProducts(shop_id, user.id, query);
  }

  @Get(':shop_id/products/:product_id')
  async getProduct(@Param('shop_id') shop_id: number, @Param('product_id') product_id: number, @UserPipe() user: User) {
    return await this.panelService.getProduct(shop_id, product_id, user.id);
  }

  @Patch(':shop_id/products/:product_id')
  async updateProduct(@Param('shop_id') shop_id: number, @Param('product_id') product_id: number, @Body() updateData: UpdateProductDto, @UserPipe() user: User) {
    return this.panelService.updateProduct(shop_id, user.id, product_id, updateData);
  }

  @Delete(':shop_id/products/:product_id')
  async removeProduct(@Param('shop_id') shop_id: number, @Param('product_id') product_id: number, @UserPipe() user: User) {
    return this.panelService.removeProduct(shop_id, user.id, product_id);
  }

  @Get(':shop_id/working-hours')
  async getWorkingHours(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getWorkingHours(shop_id, user.id);
  }

  @Post(':shop_id/working-hours')
  async updateWorkingHours(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User, @Body() body: any) {
    return this.panelService.updateWorkingHours(shop_id, user.id, body);
  }

  @Get(':shop_id/location')
  async getLocation(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getLocation(shop_id, user.id);
  }

  @Get(':shop_id/permissions')
  async getPermissions(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getPermissions(shop_id, user.id);
  }

  @Get(':shop_id/national-card')
  async getNationalCard(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getNationalCard(shop_id, user.id);
  }

  @Get(':shop_id/transactions')
  async getShopTransactions(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User) {
    return this.panelService.getShopTransactions(shop_id, user.id);
  }

  @Get(':shop_id/statistics')
  async getShopStatistics(@Param('shop_id', ParseIntPipe) shop_id: number, @Query() query: GetShopStatisticsDto, @UserPipe() user: User) {
    return this.panelService.getShopStatistics(shop_id, user.id, query);
  }

  @Get(':shop_id/reports')
  async getShopReports(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User) {
    return this.panelService.getShopReports(shop_id, user.id);
  }

  @Patch(':shop_id/reports/:report_id')
  async updateReportStatus(@Param('report_id', ParseIntPipe) report_id: number, @Body() body: UpdateReportStatusDto, @UserPipe() user: User) {
    return this.panelService.updateReportStatus(report_id, user.id, body);
  }

  @Get(':shop_id/products-deleted')
  async getProductsDeleted(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User) {
    return this.panelService.getProductsDeleted(shop_id, user.id);
  }

  @Get(':shop_id/contact-info')
  async getContactInfo(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getContactInfo(shop_id, user.id);
  }

  @Patch(':shop_id/contact-info')
  async updateContactInfo(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User, @Body() dto: UpdateContactInfoDto) {
    return this.panelService.updateContactInfo(shop_id, user.id, dto);
  }

  @Patch(':shop_id/location')
  async updateLocation(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User, @Body() data: UpdateLocationDto) {
    return await this.panelService.updateLocation(shop_id, user.id, data);
  }

  @Patch(':shop_id/owner-info')
  async updateOwnerInfo(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User, @Body() data: UpdateOwnerInfoDto) {
    return await this.panelService.updateOwnerInfo(shop_id, user.id, data);
  }

  @Get(':shop_id/address')
  async getAddressVerification(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getAddressVerification(shop_id, user.id);
  }

  @Get(':shop_id/identity-video')
  async getVerificationVideo(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getVerificationVideo(shop_id, user.id);
  }

  @Get(':shop_id/certificate/:type')
  async getBusinessLicense(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number, @Param('type') type: string) {
    return await this.panelService.getBusinessLicense(shop_id, type, user.id);
  }

  @Get(':shop_id/warranties')
  async getWarranties(@UserPipe() user: User, @Param('shop_id', ParseIntPipe) shop_id: number) {
    return await this.panelService.getWarranties(shop_id, user.id);
  }

  @Post(':shop_id/find-merge-candidates')
  async findMergeCandidates(@Param('shop_id', ParseIntPipe) shop_id: number, @Body() dto: FindMergeCandidatesDto, @UserPipe() user: User) {
    return this.panelService.findMergeCandidates(shop_id, user.id, dto);
  }

  @Post(':shop_id/create-offer')
  @UseInterceptors(FileInterceptor('image'))
  async createOffer(@Param('shop_id', ParseIntPipe) shop_id: number, @UserPipe() user: User, @Body() dto: CreateOfferDto) {
    return this.panelService.createOffer(shop_id, user.id, dto);
  }

  @Post(':shop_id/suggest-category')
  async suggestCategory(@Body() dto: SuggestCategoryDto) {
    return this.panelService.suggestCategory(dto.title);
  }
}
