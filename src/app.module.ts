import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CleanupService } from './common/cleanup.service';
import { FileModule } from './file/file.module';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    AuthModule,
    FileModule,
    ThrottlerModule.forRoot([
      {
        ttl: process.env.API_REQUEST_LIMIT_RESET_DURATION
          ? parseInt(process.env.API_REQUEST_LIMIT_RESET_DURATION, 10)
          : 60000, // 1 minute
        limit: process.env.API_REQUEST_LIMIT_PER_IP
          ? parseInt(process.env.API_REQUEST_LIMIT_PER_IP, 10)
          : 10, // 10 times
      },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CleanupService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
