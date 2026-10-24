import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientAccessService } from './client-access.service';
import { ClientsController } from './clients.controller';
import { ClientsRepository } from './clients.repository';
import { VideoStorageService } from '../programs/video-storage.service';
import { ClientsService } from './clients.service';
import { MeController } from './me.controller';

@Module({
  imports: [AuthModule], // for PasswordService
  controllers: [ClientsController, MeController],
  // VideoStorageService is provided here rather than imported from
  // ProgramsModule, which already imports this module — importing back would
  // be a cycle. It is stateless, so a second instance costs nothing.
  providers: [ClientsService, ClientsRepository, ClientAccessService, VideoStorageService],
  // Only ClientAccessService leaves this module: other features need the
  // ownership check, not client CRUD. Keeping the export surface small is what
  // stops feature modules from reaching into each other.
  exports: [ClientAccessService],
})
export class ClientsModule {}
