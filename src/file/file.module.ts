import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { FileController } from './controllers/file.controller';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';
import { FileAclService } from './services/file-acl.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([FileEntity])],
  providers: [FileService, FileAclService, JwtAuthStrategy, FileRepository],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
