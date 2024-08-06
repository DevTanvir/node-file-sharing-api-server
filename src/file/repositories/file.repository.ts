import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { FileEntity } from '../entities/file.entity';

@Injectable()
export class FileRepository extends Repository<FileEntity> {
  constructor(private dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }

  async getById(id: string): Promise<FileEntity> {
    const file = await this.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException();
    }

    return file;
  }

  async getByPublicKey(key: string): Promise<FileEntity> {
    const file = await this.findOne({ where: { publicKey: key } });
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }

  async getByPrivateKey(key: string): Promise<FileEntity> {
    const file = await this.findOne({ where: { privateKey: key } });
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }
}
