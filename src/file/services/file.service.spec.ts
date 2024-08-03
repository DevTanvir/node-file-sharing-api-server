import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

import { ROLE } from '../../auth/constants/role.constant';
import { AppLogger } from '../../shared/logger/logger.service';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { FileUploadOutput } from '../dtos/file-upload-output.dto';
import { FileEntity } from '../entities/file.entity';
import { FileRepository } from '../repositories/file.repository';
import { FileService } from './file.service';
import { FileAclService } from './file-acl.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('FileService', () => {
  let service: FileService;
  let fileRepository: FileRepository;

  const mockedFileRepository = {
    save: jest.fn(),
    getByPublicKey: jest.fn(),
    getByPrivateKey: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const mockedLogger = { setContext: jest.fn(), log: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: FileRepository,
          useValue: mockedFileRepository,
        },
        { provide: AppLogger, useValue: mockedLogger },
        { provide: FileAclService, useValue: new FileAclService() },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
    fileRepository = module.get<FileRepository>(FileRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const ctx = new RequestContext();

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
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
      ctx.user = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };
      const publicKey = 'mock-uuid';
      const privateKey = 'mock-uuid';
      const uniqueIdforFile = uuidv4();

      const filePath = path.join(
        'uploads',
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
      const output: FileUploadOutput = { publicKey, privateKey };

      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await service.uploadFile(ctx, file);

      expect(fileRepository.save).toHaveBeenCalledWith(uploadFileDetail);
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, file.buffer);
      expect(result).toEqual(output);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  describe('downloadFile', () => {
    it('should download the file and send it as a response', async () => {
      const publicKey = 'testPublicKey';
      const file = {
        mimeType: 'text/plain',
        fileBuffer: Buffer.from('test content'),
      };
      mockedFileRepository.getByPublicKey.mockResolvedValue(file);

      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await service.downloadFile(publicKey, res);

      expect(fileRepository.getByPublicKey).toHaveBeenCalledWith(publicKey);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', file.mimeType);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename="${publicKey}"`,
      );
      expect(res.send).toHaveBeenCalledWith(file.fileBuffer);
    });

    it('should throw NotFoundException if the file is not found', async () => {
      const publicKey = 'testPublicKey';
      mockedFileRepository.getByPublicKey.mockResolvedValue(null);

      await expect(service.downloadFile(publicKey, {} as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(fileRepository.getByPublicKey).toHaveBeenCalledWith(publicKey);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return message when user has permission', async () => {
      const privateKey = 'mock-uuid';
      const file = new FileEntity();
      file.createdBy = 1;
      file.filePath = 'path/to/test.txt';
      file.fileName = 'test';

      ctx.user = {
        id: 1,
        roles: [ROLE.USER],
        username: 'testuser',
      };

      mockedFileRepository.getByPrivateKey.mockResolvedValue(file);
      jest.spyOn(fs, 'unlink').mockResolvedValue();
      const expectedOutput = {
        message: `File ${file.fileName} deleted successfully`,
      };

      const result = await service.deleteFile(ctx, privateKey);

      expect(result).toEqual(expectedOutput);
      expect(fileRepository.getByPrivateKey).toHaveBeenCalledWith(privateKey);
      expect(fileRepository.delete).toHaveBeenCalledWith(file.id);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });
});
