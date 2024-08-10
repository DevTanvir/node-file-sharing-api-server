import { Storage } from '@google-cloud/storage';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import mime from 'mime';
import { v4 as uuidv4 } from 'uuid';

import { Action } from '../../shared/acl/action.constant';
import { Actor } from '../../shared/acl/actor.constant';
import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { FileUploadOutput } from '../dtos/file-upload-output.dto';
import { FileRepository } from '../repositories/file.repository';
import { FileAclService } from './file-acl.service';
import { IStorageService } from './storage.interface';

const keyFilename = process.env.CONFIG;
const bucketName = process.env.GCS_BUCKET_NAME;
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename,
});
const bucket = storage.bucket(bucketName!);
@Injectable()
export class GoogleStorageService implements IStorageService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly aclService: FileAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GoogleStorageService.name);
  }
  async uploadFile(
    ctx: RequestContext,
    file: Express.Multer.File,
  ): Promise<FileUploadOutput> {
    if (!file) {
      throw new BadRequestException('Please select a file to upload');
    }

    const actor: Actor = ctx.user!;

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Create);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    const publicKey = uuidv4();
    const privateKey = uuidv4();
    const newUniqueFileName = `${publicKey}-${file.originalname}`;

    const blob = bucket.file(newUniqueFileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      return new BadRequestException(error.message);
    });
    blobStream.on('finish', () => {
      return 'File uploaded successfully';
    });
    blobStream.end(file.buffer);

    const uploadFileDetail = {
      publicKey,
      privateKey,
      mimeType: file.mimetype,
      fileName: newUniqueFileName,
      createdBy: ctx.user!.id,
      storageType: 'gcs',
    };

    await this.fileRepository.save(uploadFileDetail);

    return {
      publicKey,
      privateKey,
    };
  }

  async downloadFile(publicKey: string, res: any): Promise<any> {
    const file = await this.fileRepository.getByPublicKey(publicKey);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const fileGcs = bucket.file(file.fileName);

    const signedUrl = await fileGcs.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,
    });

    const [metadata] = await fileGcs.getMetadata();
    const mimeType =
      metadata.contentType ||
      mime.lookup(publicKey) ||
      'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${publicKey}"`);
    res.setHeader('Content-Type', mimeType);

    fileGcs.createReadStream().pipe(res);
    return signedUrl[0];
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
    await bucket.file(file.fileName).delete();

    return { message: `File ${file.fileName} deleted successfully` };
  }
}
