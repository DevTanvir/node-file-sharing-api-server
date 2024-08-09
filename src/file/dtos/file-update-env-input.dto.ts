import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUppercase } from 'class-validator';

export class UpdateEnvInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  value: string;
}
