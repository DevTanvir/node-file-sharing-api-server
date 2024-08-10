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

  afterAll(async () => {
    await app.close();
    await closeDBAfterTest();
  });
});
