import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { FileEntity } from '../entities/file.entity';
import { FileRepository } from './file.repository';

describe('FileRepository', () => {
  let repository: FileRepository;

  let dataSource: {
    createEntityManager: jest.Mock;
  };

  beforeEach(async () => {
    dataSource = {
      createEntityManager: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FileRepository,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = moduleRef.get<FileRepository>(FileRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getById', () => {
    it('should return the file if it exists', async () => {
      const file = new FileEntity();
      jest.spyOn(repository, 'findOne').mockResolvedValue(file);

      const result = await repository.getById('1');

      expect(result).toBe(file);
    });

    it('should throw a NotFoundException if the file does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(repository.getById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByPublicKey', () => {
    it('should return the correct file using public key', async () => {
      const key = 'testKey';
      const file = new FileEntity();
      jest.spyOn(repository, 'findOne').mockResolvedValue(file);

      const result = await repository.getByPublicKey(key);

      expect(result).toBe(file);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { publicKey: key },
      });
    });

    it('should throw a NotFoundException if the file does not exist', async () => {
      const key = 'testKey';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(repository.getByPublicKey(key)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { publicKey: key },
      });
    });
  });

  describe('getByPrivateKey', () => {
    it('should return the correct file using private key', async () => {
      const file = new FileEntity();
      const key = 'testKey';
      jest.spyOn(repository, 'findOne').mockResolvedValue(file);

      const result = await repository.getByPrivateKey('testKey');

      expect(result).toEqual(file);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { privateKey: key },
      });
    });

    it('should throw NotFoundException when the file does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(repository.getByPrivateKey('testKey')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
