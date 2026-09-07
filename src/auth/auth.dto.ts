import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'phone must be a valid Iranian mobile number' })
  phone: string;
}

export class VerifyCodeDto extends SendCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}
