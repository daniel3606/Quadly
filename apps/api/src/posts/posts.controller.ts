import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('boards/:boardKey/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get posts by board' })
  async findAll(
    @Param('boardKey') boardKey: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: string,
  ) {
    return this.postsService.findAll(
      boardKey,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      sort || 'new',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }
}
