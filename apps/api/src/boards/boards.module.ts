import { Module } from '@nestjs/common';
import { BoardsController, BoardDetailController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  // IMPORTANT: BoardsController must come BEFORE BoardDetailController
  // to ensure static routes (/boards, /boards/pinned) are matched
  // before dynamic routes (/boards/:key, /boards/:key/pin)
  controllers: [BoardsController, BoardDetailController],
  providers: [BoardsService],
})
export class BoardsModule {}
