import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { FileController } from './controllers/file.controller';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from './repositories/file.repository';
import { FileAclService } from './services/file-acl.service';
import { GoogleStorageService } from './services/google-storage.service';
import { LocalStorageService } from './services/local-storage.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([FileEntity])],
  providers: [
    LocalStorageService,
    FileAclService,
    JwtAuthStrategy,
    FileRepository,
    {
      provide: 'IStorageService',
      useClass:
        process.env.PROVIDER === 'google'
          ? GoogleStorageService
          : LocalStorageService,
    },
  ],
  controllers: [FileController],
  exports: [LocalStorageService],
})
export class FileModule {}
