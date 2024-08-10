import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';

import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { FileController } from './file.controller';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('FileController', () => {
  let controller: FileController;

  const mockedIStorageService = {
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockedLogger = { setContext: jest.fn(), log: jest.fn() };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: 'IStorageService', useValue: mockedIStorageService },
        { provide: AppLogger, useValue: mockedLogger },
      ],
    }).compile();

    controller = moduleRef.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const ctx = new RequestContext();

  describe('upload File', () => {
    it('calls the local uploadFile function with necessary input', async () => {
      const file: Express.Multer.File = {
        fieldname: 'fileField',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: Readable.from('test'),
        destination: 'file/path',
        filename: 'test.txt',
        path: 'sample path string',
      };
      mockedIStorageService.uploadFile.mockResolvedValue({
        key1: 'mock-uuid',
        key2: 'mock-uuid',
      });
      await controller.uploadFile(ctx, file);
      expect(mockedIStorageService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('download file', () => {
    it('should call downloadFile with the correct parameters', async () => {
      const ctx = {} as RequestContext;
      const publicKey = 'testPublicKey';
      const res = {} as any;

      await controller.downloadFile(ctx, publicKey, res);

      expect(mockedIStorageService.downloadFile).toHaveBeenCalledWith(
        publicKey,
        res,
      );
    });
  });

  describe('Update user by id', () => {
    it('should call deleteFile with the correct parameters', async () => {
      const ctx = {} as RequestContext;
      const privateKey = 'testPrivateKey';

      await controller.deleteFile(ctx, privateKey);

      expect(mockedIStorageService.deleteFile).toHaveBeenCalledWith(
        ctx,
        privateKey,
      );
    });
  });
});
