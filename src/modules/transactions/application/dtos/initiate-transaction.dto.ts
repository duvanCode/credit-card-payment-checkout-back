import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CustomerDataDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  legalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  legalIdType!: string;
}

export class InitiateTransactionDto {
  @ApiProperty({ type: [TransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items!: TransactionItemDto[];

  @ApiProperty({
    example: 'tok_stagtest_12345_abcde12345',
    description: 'Token de tarjeta generado en el frontend',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^tok_(test|prod|stagtest)_\d+_[a-zA-Z0-9]+$/, {
    message: 'El token de la tarjeta no es valido.',
  })
  cardToken!: string;

  @ApiProperty({ type: CustomerDataDto })
  @ValidateNested()
  @Type(() => CustomerDataDto)
  customerData!: CustomerDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}
