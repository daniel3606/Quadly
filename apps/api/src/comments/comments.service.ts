import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import {
  generateAnonymousHandleId,
  CreateCommentInput,
  UpdateCommentInput,
} from '@quadly/shared';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
    private blocksService: BlocksService,
  ) {}

  async findAll(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        board: {
          select: {
            anon_mode: true,
          },
        },
      },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new NotFoundException('Post not found');
    }

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
    if (userId) {
      blockedUserIds = await this.blocksService.getBlockedUserIds(userId);
    }

    const where: any = {
      post_id: postId,
      status: 'ACTIVE',
    };

    // Filter out comments from blocked users
    if (blockedUserIds.length > 0) {
      where.author_user_id = {
        notIn: blockedUserIds,
      };
    }

    const comments = await this.prisma.comment.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Format response - hide author info if anonymous
    return comments.map((comment) => {
      const response: any = { ...comment };
      if (comment.is_anonymous) {
        response.author = {
          id: null,
          nickname: null,
          anonymous_handle: comment.anonymous_handle_id || 'Anonymous',
        };
      }
      return response;
    });
  }

  async create(postId: string, userId: string, input: CreateCommentInput) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        board: {
          select: {
            anon_mode: true,
          },
        },
      },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new NotFoundException('Post not found');
    }

    // Determine anonymous mode
    let isAnonymous = false;
    let anonymousHandleId: string | null = null;

    if (post.board.anon_mode === 'forced') {
      isAnonymous = true;
      anonymousHandleId = generateAnonymousHandleId(userId, postId);
    } else if (post.board.anon_mode === 'optional' && input.is_anonymous) {
      isAnonymous = true;
      anonymousHandleId = generateAnonymousHandleId(userId, postId);
    }

    const comment = await this.prisma.comment.create({
      data: {
        post_id: postId,
        author_user_id: userId,
        body: input.body,
        is_anonymous: isAnonymous,
        anonymous_handle_id: anonymousHandleId,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Update post comment count and hot score
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        comment_count: { increment: 1 },
      },
    });

    await this.postsService.updateHotScore(postId);

    // Format response
    const response: any = { ...comment };
    if (comment.is_anonymous) {
      response.author = {
        id: null,
        nickname: null,
        anonymous_handle: comment.anonymous_handle_id || 'Anonymous',
      };
    }

    return response;
  }

  async update(commentId: string, userId: string, input: UpdateCommentInput) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author_user_id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (comment.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot edit deleted or hidden comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        body: input.body,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Format response
    const response: any = { ...updated };
    if (updated.is_anonymous) {
      response.author = {
        id: null,
        nickname: null,
        anonymous_handle: updated.anonymous_handle_id || 'Anonymous',
      };
    }

    return response;
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author_user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'DELETED',
      },
    });

    // Update post comment count and hot score
    await this.prisma.post.update({
      where: { id: comment.post_id },
      data: {
        comment_count: { decrement: 1 },
      },
    });

    await this.postsService.updateHotScore(comment.post_id);

    return { message: 'Comment deleted successfully' };
  }
}
