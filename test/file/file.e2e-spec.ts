import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuthTokenOutput } from '../../src/auth/dtos/auth-token-output.dto';
import { FileUploadOutput } from '../../src/file/dtos/file-upload-output.dto';
import {
  closeDBAfterTest,
  createDBEntities,
  resetDBBeforeTest,
  seedUser,
} from '../test-utils';

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let authTokenForUser: AuthTokenOutput;

  beforeAll(async () => {
    await resetDBBeforeTest();
    await createDBEntities();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    ({ authTokenForUser } = await seedUser(app));
  });

  describe('upload file', () => {
    it('uploads a file', async () => {
      const file = await createTestFile();

      return request(app.getHttpServer())
        .post('/files')
        .attach('file', file.fileBuffer, file.fileName)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const output = res.body as FileUploadOutput;
          expect(output.publicKey).toBeDefined();
          expect(output.privateKey).toBeDefined();
        });
    });

    it('returns UnauthorizedException when user is not authorized', async () => {
      const file = await createTestFile();

      return request(app.getHttpServer())
        .post('/files')
        .attach('file', file.fileBuffer, file.fileName)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({ message: 'Unauthorized' });
    });
  });

  async function createTestFile(): Promise<{
    fileBuffer: Buffer;
    fileName: string;
  }> {
    const fileBuffer = Buffer.from('test file');
    const fileName = 'file.txt';

    return { fileBuffer, fileName };
  }

  describe('download file', () => {
    const file = {
      publicKey: 'a891ca32-b42e-4a94-b636-7c0a202aaa8f',
      privateKey: 'bdd5a5ef-7ace-4f93-81f1-281735a3d181',
      fileBuffer: Buffer.from('test file'),
      mimeType: 'text/plain',
      filePath: 'path/to/file.txt',
      fileName: 'file.txt',
      createdBy: 'testUser',
    };
    it('downloads a file', async () => {
      return request(app.getHttpServer())
        .get(`/files/${file.publicKey}`)
        .expect(HttpStatus.OK)
        .expect('Content-Type', file.mimeType)
        .expect(
          'Content-Disposition',
          `attachment; filename="${file.publicKey}"`,
        )
        .expect(file.fileBuffer);
    });

    it('returns NotFoundException when file is not found', async () => {
      return request(app.getHttpServer())
        .get('/files/12345')
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'File not found' });
    });
  });

  describe('delete file', () => {
    const file = {
      publicKey: 'a891ca32-b42e-4a94-b636-7c0a202aaa8f',
      privateKey: 'bdd5a5ef-7ace-4f93-81f1-281735a3d181',
      fileBuffer: Buffer.from('test file'),
      mimeType: 'text/plain',
      filePath: 'path/to/file.txt',
      fileName: 'file.txt',
      createdBy: 'testUser',
    };

    it('deletes a file', async () => {
      return request(app.getHttpServer())
        .delete(`/files/${file.privateKey}`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.OK)
        .expect({ message: `File ${file.fileName} deleted successfully` });
    });

    it('returns NotFoundException when file is not found', async () => {
      return request(app.getHttpServer())
        .delete('/files/12345')
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.NOT_FOUND)
        .expect({ message: 'File not found' });
    });

    it('returns UnauthorizedException when user is not authorized', async () => {
      return request(app.getHttpServer())
        .delete(`/files/${file.privateKey}`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({ message: 'Unauthorized' });
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDBAfterTest();
  });
});
