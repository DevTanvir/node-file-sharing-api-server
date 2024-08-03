import { Express } from 'express';

import { RequestContext } from '../shared/request-context/request-context.dto';

export interface FileInterface {
  uploadFile(
    ctx: RequestContext,
    file: Express.Multer.File,
  ): Promise<{ publicKey: string; privateKey: string }>;
  downloadFile(publicKey: string, res: any): Promise<void>;
  deleteFile(ctx: RequestContext, privateKey: string): Promise<void>;
}
