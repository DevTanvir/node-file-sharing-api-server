import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import * as path from 'path';

import { LocalStorageService } from '../file/services/local-storage.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);
  private folder = process.env.FOLDER;
  private cleanupIntervalHours = process.env.CLEANUP_INTERVAL_HOURS
    ? parseInt(process.env.CLEANUP_INTERVAL_HOURS, 10)
    : 24;

  constructor(private readonly localStorageService: LocalStorageService) {}

  @Cron('0 * * * *') // Run every hour
  async handleCleanup() {
    this.logger.log('Running cleanup job...');
    const files = await fs.readdir(this.folder!);
    const now = Date.now();

    if (!files || !files.length) {
      return this.logger.log('No files to cleanup');
    }

    for (const file of files) {
      const filePath = path.join(this.folder!, file);
      const stats = await fs.stat(filePath);

      const lastModified = new Date(stats.mtime).getTime();
      const elapsedTimeHours = (now - lastModified) / (1000 * 60 * 60);

      if (elapsedTimeHours > this.cleanupIntervalHours) {
        this.logger.log(`Deleting file: ${file}`);
        await fs.unlink(filePath);
        await this.localStorageService.deleteFileForCleanupService(filePath);
      }
    }
  }
}
