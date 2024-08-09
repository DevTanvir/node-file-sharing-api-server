import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Express } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { UpdateEnvInput } from '../dtos/file-update-env-input.dto';
import { FileUploadOutput } from '../dtos/file-upload-output.dto';
import { FileService } from '../services/file.service';
import { GoogleStorageService } from '../services/google-storage.service';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly googleStorageService: GoogleStorageService,
    private readonly logger: AppLogger,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Upload File API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(FileUploadOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @ReqContext() ctx: RequestContext,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseApiResponse<FileUploadOutput>> {
    this.logger.log(ctx, `${this.uploadFile.name} was called`);

    const keys = await this.fileService.uploadFile(ctx, file);

    return { data: keys, meta: {} };
  }

  @Get(':publicKey')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // manual override if needed
  @ApiOperation({
    summary: 'Download File API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([]),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getFile(
    @ReqContext() ctx: RequestContext,
    @Param('publicKey') publicKey: string,
    @Res() res: any,
  ): Promise<void> {
    this.logger.log(ctx, `${this.getFile.name} was called`);
    await this.fileService.downloadFile(publicKey, res);
  }

  @Delete(':privateKey')
  @ApiOperation({
    summary: 'Delete File API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([]),
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async deleteFile(
    @ReqContext() ctx: RequestContext,
    @Param('privateKey') privateKey: string,
  ): Promise<void> {
    this.logger.log(ctx, `${this.deleteFile.name} was called`);

    const deleted = await this.fileService.deleteFile(ctx, privateKey);
    return deleted;
  }

  @Post('update-env')
  @ApiOperation({
    summary: 'Update ENV file API (ADMIN ONLY)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([]),
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  async updateEnv(
    @ReqContext() ctx: RequestContext,
    @Body() input: UpdateEnvInput,
  ): Promise<string> {
    this.logger.log(ctx, `${this.updateEnv.name} was called`);

    await this.fileService.updateEnv(ctx, input);

    return 'Successfully updated .env file';
  }
}
