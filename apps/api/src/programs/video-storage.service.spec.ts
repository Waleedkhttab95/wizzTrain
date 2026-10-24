import { BadRequestException } from '@nestjs/common';
import { VIDEO_UPLOAD } from '@wizzapp/shared';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VideoStorageService } from './video-storage.service';

function upload(over: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = over.buffer ?? Buffer.from('fake video bytes');
  return {
    fieldname: 'video',
    originalname: 'clip.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: buffer.length,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...over,
  };
}

describe('VideoStorageService', () => {
  let dir: string;
  let service: VideoStorageService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'wizzapp-video-'));
    service = new VideoStorageService({
      uploadDir: dir,
      publicUrl: 'https://api.example.com',
    } as never);
  });

  describe('save', () => {
    it('writes the file and returns its generated name', async () => {
      const filename = await service.save(upload());

      expect(await readdir(dir)).toEqual([filename]);
    });

    it('never reuses the uploaded filename', async () => {
      // A client-supplied name is the path-traversal vector, and would also
      // let one upload overwrite another.
      const filename = await service.save(upload({ originalname: '../../etc/passwd.mp4' }));

      expect(filename).not.toContain('..');
      expect(filename).not.toContain('/');
      expect(filename).toMatch(/^[0-9a-f-]{36}\.mp4$/);
    });

    it('gives two uploads of the same file different names', async () => {
      const first = await service.save(upload());
      const second = await service.save(upload());

      expect(first).not.toBe(second);
      expect(await readdir(dir)).toHaveLength(2);
    });

    it.each([
      ['video/mp4', '.mp4'],
      ['video/quicktime', '.mov'],
      ['video/webm', '.webm'],
    ])('picks the extension from the %s type, not the name', async (mimetype, extension) => {
      const filename = await service.save(upload({ mimetype, originalname: 'whatever.exe' }));

      expect(filename.endsWith(extension)).toBe(true);
    });

    it('rejects a type that is not a video', async () => {
      await expect(
        service.save(upload({ mimetype: 'application/x-msdownload', originalname: 'virus.exe' })),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(await readdir(dir)).toEqual([]);
    });

    it('rejects a file over the size cap', async () => {
      await expect(
        service.save(upload({ size: VIDEO_UPLOAD.maxBytes + 1 })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an empty upload', async () => {
      await expect(service.save(upload({ buffer: Buffer.alloc(0) }))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('writes nothing to disk when validation fails', async () => {
      await service.save(upload()).catch(() => undefined);
      const before = (await readdir(dir)).length;

      await service.save(upload({ mimetype: 'text/plain' })).catch(() => undefined);

      expect(await readdir(dir)).toHaveLength(before);
    });
  });

  describe('remove', () => {
    it('deletes the file', async () => {
      const filename = await service.save(upload());
      await service.remove(filename);

      expect(await readdir(dir)).toEqual([]);
    });

    it('tolerates a file that is already gone', async () => {
      await expect(service.remove('does-not-exist.mp4')).resolves.toBeUndefined();
    });

    it('does nothing when there is no video attached', async () => {
      await expect(service.remove(null)).resolves.toBeUndefined();
    });

    it('refuses to follow a path out of the upload directory', async () => {
      const outside = join(dir, 'keep-me.txt');
      await writeFile(outside, 'important');

      await service.remove('../keep-me.txt');
      await service.remove('/etc/passwd');

      // The guard is on the filename, so nothing outside the directory is touched.
      expect(await readdir(dir)).toContain('keep-me.txt');
    });
  });

  describe('toUrl', () => {
    it('builds an absolute URL the client app can open', () => {
      expect(service.toUrl('abc.mp4')).toBe('https://api.example.com/uploads/abc.mp4');
    });
  });
});
