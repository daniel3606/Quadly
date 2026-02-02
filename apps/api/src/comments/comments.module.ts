import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostsModule } from '../posts/posts.module';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
  imports: [PostsModule, BlocksModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
