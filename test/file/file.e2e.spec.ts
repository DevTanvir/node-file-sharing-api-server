import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import mime from 'mime';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuthTokenOutput } from '../../src/auth/dtos/auth-token-output.dto';
import { LocalStorageService } from '../../src/file/services/local-storage.service';
import {
  closeDBAfterTest,
  createDBEntities,
  resetDBBeforeTest,
  seedUser,
} from '../test-utils';

describe('FileController (e2e)', () => {
  let app: INestApplication;
  let authTokenForUser: AuthTokenOutput;
  let publicKey: string;
  let privateKey: string;
  let mimeType: string;
  let filePath: string;

  beforeAll(async () => {
    await resetDBBeforeTest();
    await createDBEntities();

    jest.mock('uuid', () => ({
      v4: jest.fn(() => 'mock-uuid'),
    }));

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IStorageService')
      .useClass(LocalStorageService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    ({ authTokenForUser } = await seedUser(app));
  });

  describe('Upload File', () => {
    it('uploads a file', async () => {
      return request(app.getHttpServer())
        .post('/files')
        .attach('file', Buffer.from('This is a test file'), 'testfile.txt')
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.data.publicKey).toBeDefined();
          expect(res.body.data.privateKey).toBeDefined();
          expect(res.body.data.publicKey).toMatch(/^[0-9a-fA-F-]{36}$/);
          expect(res.body.data.privateKey).toMatch(/^[0-9a-fA-F-]{36}$/);

          // saving this properties to test download and delete file
          publicKey = res.body.data.publicKey;
          privateKey = res.body.data.privateKey;
          filePath = `uploads/${publicKey}-testfile.txt`;
          mimeType = mime.lookup(filePath) || 'application/octet-stream';
        });
    });
  });

  describe('Download File', () => {
    it('downloads a file by public key', async () => {
      return request(app.getHttpServer())
        .get(`/files/${publicKey}`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.OK)
        .expect('Content-Type', mimeType);
    });

    it('returns NOT_FOUND when file does not exist', () => {
      return request(app.getHttpServer())
        .get(`/files`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Delete File', () => {
    it('deletes a file by private key', async () => {
      return request(app.getHttpServer())
        .delete(`/files/${privateKey}`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.OK)
        .expect('Content-Type', /application\/json/);
    });

    it('returns NOT_FOUND when file does not exist', () => {
      return request(app.getHttpServer())
        .delete(`/files}`)
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDBAfterTest();
  });
});
