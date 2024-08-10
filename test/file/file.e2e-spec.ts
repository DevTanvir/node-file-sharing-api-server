import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { GoogleStorageService } from '../../src/file/services/google-storage.service';
import { LocalStorageService } from '../../src/file/services/local-storage.service';
import { IStorageService } from '../../src/file/services/storage.interface';
import {
  closeDBAfterTest,
  createDBEntities,
  resetDBBeforeTest,
} from '../test-utils';

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let storageService: IStorageService;

  beforeAll(async () => {
    await resetDBBeforeTest();
    await createDBEntities();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IStorageService')
      .useClass(
        process.env.PROVIDER === 'google'
          ? GoogleStorageService
          : LocalStorageService,
      )
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    storageService = app.get<IStorageService>('IStorageService');
  });

  describe('Upload File', () => {
    it('uploads a file', async () => {
      const fileBuffer = Buffer.from('test file content');
      const expectedOutput = {
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      };

      return request(app.getHttpServer())
        .post('/files')
        .attach('file', fileBuffer, 'test.txt')
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.data).toEqual(expectedOutput);
        });
    });
  });

  describe('Download File', () => {
    it('downloads a file by public key', async () => {
      const publicKey = 'publicKey';

      return request(app.getHttpServer())
        .get(`/files/${publicKey}`)
        .expect(HttpStatus.OK)
        .expect('Content-Type', /octet-stream/);
    });

    it('returns NOT_FOUND when file does not exist', () => {
      return request(app.getHttpServer())
        .get('/files/non-existent-key')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Delete File', () => {
    it('deletes a file by private key', async () => {
      const privateKey = 'privateKey';

      return request(app.getHttpServer())
        .delete(`/files/${privateKey}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(storageService.deleteFile).toHaveBeenCalledWith(
            expect.anything(),
            privateKey,
          );
        });
    });

    it('returns NOT_FOUND when file does not exist', () => {
      return request(app.getHttpServer())
        .delete('/files/non-existent-key')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDBAfterTest();
  });
});
