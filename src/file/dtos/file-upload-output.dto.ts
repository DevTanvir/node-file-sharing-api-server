import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FileUploadOutput {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  privateKey: string;
}
