import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { VIDEO_UPLOAD } from '@wizzapp/shared';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { appConfig } from '../config/app.config';

/**
 * Stores exercise demonstration videos on disk.
 *
 * Filenames are generated here and never taken from the upload — a client
 * supplied name is the classic path-traversal vector, and it would also let one
 * trainer overwrite another's file by guessing a name.
 */
@Injectable()
export class VideoStorageService {
  private readonly logger = new Logger(VideoStorageService.name);
  private readonly root: string;

  constructor(@Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>) {
    this.root = resolve(process.cwd(), config.uploadDir);
  }

  /** Writes the upload and returns the filename to store on the exercise. */
  async save(file: Express.Multer.File): Promise<string> {
    this.assertAcceptable(file);

    await mkdir(this.root, { recursive: true });

    const extension = this.extensionFor(file);
    const filename = `${randomUUID()}${extension}`;

    await writeFile(join(this.root, filename), file.buffer);
    this.logger.log(`Stored exercise video ${filename} (${file.size} bytes)`);

    return filename;
  }

  /**
   * Deletes a stored video. A missing file is not an error — the row is the
   * source of truth, and a half-cleaned disk should not block the request.
   */
  async remove(filename: string | null): Promise<void> {
    if (!filename) return;

    // Defensive: only ever unlink a bare filename inside our own directory.
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      this.logger.warn(`Refusing to delete suspicious filename: ${filename}`);
      return;
    }

    try {
      await unlink(join(this.root, filename));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        this.logger.warn(`Could not delete ${filename}: ${String(error)}`);
      }
    }
  }

  /**
   * Duplicates a stored video under a fresh name.
   *
   * Applying a template copies rather than shares the file, so deleting the
   * client's programme video can never pull the clip out from under the
   * template it came from. Returns null if the source has gone missing —
   * a missing demo clip must not block creating the programme.
   */
  async copy(filename: string | null): Promise<string | null> {
    if (!filename) return null;

    const extension = extname(filename) || '.mp4';
    const target = `${randomUUID()}${extension}`;

    try {
      await mkdir(this.root, { recursive: true });
      await copyFile(join(this.root, filename), join(this.root, target));
      return target;
    } catch (error) {
      this.logger.warn(`Could not copy ${filename}: ${String(error)}`);
      return null;
    }
  }

  /** Stored filename → the absolute URL the client app opens. */
  toUrl(filename: string): string {
    return `${this.config.publicUrl}/uploads/${filename}`;
  }

  private assertAcceptable(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('الملف فارغ');
    }
    if (file.size > VIDEO_UPLOAD.maxBytes) {
      const mb = Math.round(VIDEO_UPLOAD.maxBytes / (1024 * 1024));
      throw new BadRequestException(`حجم الفيديو يجب ألا يتجاوز ${mb} ميجابايت`);
    }
    if (
      !VIDEO_UPLOAD.mimeTypes.includes(file.mimetype as (typeof VIDEO_UPLOAD.mimeTypes)[number])
    ) {
      throw new BadRequestException('صيغة الفيديو غير مدعومة — استخدم MP4 أو MOV أو WebM');
    }
  }

  /** Trust the declared type over the uploaded name, which we never reuse. */
  private extensionFor(file: Express.Multer.File): string {
    const byMime: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    };
    const fromMime = byMime[file.mimetype];
    if (fromMime) return fromMime;

    const fromName = extname(file.originalname ?? '').toLowerCase();
    return VIDEO_UPLOAD.extensions.includes(fromName as (typeof VIDEO_UPLOAD.extensions)[number])
      ? fromName
      : '.mp4';
  }
}
