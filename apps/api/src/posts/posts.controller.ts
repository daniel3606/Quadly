import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createPostSchema, updatePostSchema } from '@quadly/shared';

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
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.postsService.findAll(
      boardKey,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      sort || 'new',
      userId,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  async create(
    @Param('boardKey') boardKey: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = createPostSchema.parse(body);
    return this.postsService.create(boardKey, req.user.id, input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  async findOne(@Param('id') id: string, @Request() req?: any) {
    const userId = req?.user?.id;
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = updatePostSchema.parse(body);
    return this.postsService.update(id, req.user.id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.postsService.delete(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a post' })
  async like(@Param('id') id: string, @Request() req: any) {
    return this.postsService.likePost(id, req.user.id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a post' })
  async unlike(@Param('id') id: string, @Request() req: any) {
    return this.postsService.unlikePost(id, req.user.id);
  }
}

@ApiTags('boards')
@Controller('boards/hot/posts')
export class HotPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get hot posts from all boards' })
  async findHotPosts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.postsService.findHotPosts(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
      userId,
    );
  }
}
