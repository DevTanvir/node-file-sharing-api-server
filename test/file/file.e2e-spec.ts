import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuthTokenOutput } from '../../src/auth/dtos/auth-token-output.dto';
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

  describe('Create a new file', () => {
    it('should successfully create a new file', async () => {
      return request(app.getHttpServer())
        .post('/files')
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.CREATED);
    });

    it('should fail to create new file when user is not authenticated', async () => {
      return request(app.getHttpServer())
        .post('/files')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('Unauthorized error when BearerToken is wrong', async () => {
      return request(app.getHttpServer())
        .post('/files')
        .set('Authorization', 'Bearer ' + 'abcd')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('download file', () => {
    it('should return the target file', async () => {
      return request(app.getHttpServer()).get('/files').expect(HttpStatus.OK);
    });

    it('should fail when public key is not provided', async () => {
      return request(app.getHttpServer())
        .get('/files')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('delete file', () => {
    it('should delete the target file', async () => {
      return request(app.getHttpServer())
        .delete('/files')
        .set('Authorization', 'Bearer ' + authTokenForUser.accessToken)
        .expect(HttpStatus.OK);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDBAfterTest();
  });
});
