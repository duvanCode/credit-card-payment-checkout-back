import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { Type } from 'class-transformer';
import { validateLuhn } from '../../../../shared/utils/luhn.util';

@ValidatorConstraint({ name: 'isLuhnValid', async: false })
class IsLuhnValidConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return validateLuhn(value ?? '');
  }

  defaultMessage(): string {
    return 'El numero de tarjeta no supera la validacion Luhn.';
  }
}

function IsLuhnValid() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLuhnValid',
      target: object.constructor,
      propertyName,
      validator: IsLuhnValidConstraint,
    });
  };
}

function IsFutureExpiry() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureExpiry',
      target: object.constructor,
      propertyName,
      constraints: [],
      validator: {
        validate(_value: string, args: ValidationArguments) {
          const dto = args.object as CardDataDto;
          const month = Number(dto.expiryMonth);
          const year = Number(dto.expiryYear);

          if (Number.isNaN(month) || Number.isNaN(year)) {
            return false;
          }

          const currentDate = new Date();
          const currentYear = Number(String(currentDate.getFullYear()).slice(-2));
          const currentMonth = currentDate.getMonth() + 1;

          return year > currentYear || (year === currentYear && month >= currentMonth);
        },
        defaultMessage() {
          return 'La tarjeta esta vencida.';
        },
      },
    });
  };
}

export class CardDataDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d{13,19}$/)
  @IsLuhnValid()
  number!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  holderName!: string;

  @ApiProperty()
  @Matches(/^(0[1-9]|1[0-2])$/)
  expiryMonth!: string;

  @ApiProperty()
  @Matches(/^\d{2}$/)
  @IsFutureExpiry()
  expiryYear!: string;

  @ApiProperty()
  @Matches(/^\d{3,4}$/)
  cvc!: string;
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
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ type: CardDataDto })
  @ValidateNested()
  @Type(() => CardDataDto)
  cardData!: CardDataDto;

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
