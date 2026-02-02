import { Module } from '@nestjs/common';
import { PostsController, HotPostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
  imports: [BlocksModule],
  // IMPORTANT: HotPostsController must come BEFORE PostsController
  // to ensure static route /boards/hot/posts is matched before dynamic /boards/:boardKey/posts
  controllers: [HotPostsController, PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
