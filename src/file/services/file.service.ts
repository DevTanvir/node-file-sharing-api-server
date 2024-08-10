import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { FileInterface } from '../../common/file.interface';
import { Action } from '../../shared/acl/action.constant';
import { Actor } from '../../shared/acl/actor.constant';
import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { UpdateEnvInput } from '../dtos/file-update-env-input.dto';
import { FileUploadOutput } from '../dtos/file-upload-output.dto';
import { FileRepository } from '../repositories/file.repository';
import { FileAclService } from './file-acl.service';

@Injectable()
export class FileService implements FileInterface {
  private readonly folder = process.env.FOLDER || 'uploads';
  private readonly envFilePath = '.env';

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly aclService: FileAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FileService.name);
  }

  async uploadFile(
    ctx: RequestContext,
    file: Express.Multer.File,
  ): Promise<FileUploadOutput> {
    const actor: Actor = ctx.user!;

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Create);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    const publicKey = uuidv4();
    const privateKey = uuidv4();
    const uniqueIdforFile = uuidv4();

    const filePath = path.join(
      this.folder!,
      `${uniqueIdforFile}-${file.originalname}`,
    );

    const uploadFileDetail = {
      publicKey,
      privateKey,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      filePath,
      fileName: file.originalname,
      createdBy: ctx.user!.id,
    };

    await this.fileRepository.save(uploadFileDetail);

    await fs.writeFile(filePath, file.buffer);

    const output: FileUploadOutput = { publicKey, privateKey };

    return output;
  }

  async downloadFile(publicKey: string, res: any): Promise<void> {
    const file = await this.fileRepository.getByPublicKey(publicKey);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${publicKey}"`);
    res.send(file.fileBuffer);
  }

  async deleteFile(ctx: RequestContext, privateKey: string): Promise<any> {
    const file = await this.fileRepository.getByPrivateKey(privateKey);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const actor: Actor = ctx.user!;

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, file);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    await this.fileRepository.delete(file.id);

    const filePath = file.filePath;
    await fs.unlink(filePath);

    return { message: `File ${file.fileName} deleted successfully` };
  }

  async deleteFileForCleanupService(filePath: string): Promise<any> {
    const file = await this.fileRepository.getByFilePath(filePath);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.fileRepository.delete(file.id);

    return { message: 'File deleted successfully by clean up service' };
  }

  async updateEnv(ctx: RequestContext, input: UpdateEnvInput): Promise<string> {
    const actor: Actor = ctx.user!;

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Manage, input);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }
    const envConfig = dotenv.parse(await fs.readFile(this.envFilePath));

    envConfig[input.key] = input.value;

    const newEnvContent = Object.keys(envConfig)
      .map((k) => `${k}=${envConfig[k]}`)
      .join('\n');

    fs.writeFile(this.envFilePath, newEnvContent);

    return `${input.key} updated successfully to ${input.value}`;
  }
}
