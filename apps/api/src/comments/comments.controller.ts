import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  createCommentSchema,
  updateCommentSchema,
} from '@quadly/shared';

@ApiTags('comments')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all comments for a post' })
  async findAll(
    @Param('postId') postId: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.commentsService.findAll(postId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  async create(
    @Param('postId') postId: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = createCommentSchema.parse(body);
    return this.commentsService.create(postId, req.user.id, input);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: unknown,
  ) {
    const input = updateCommentSchema.parse(body);
    return this.commentsService.update(id, req.user.id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.delete(id, req.user.id);
  }
}
