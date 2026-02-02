import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import {
  calculateHotScore,
  generateAnonymousHandleId,
  CreatePostInput,
  UpdatePostInput,
} from '@quadly/shared';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private blocksService: BlocksService,
  ) {}

  async findAll(
    boardKey: string,
    page = 1,
    pageSize = 20,
    sort = 'new',
    userId?: string,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
    if (userId) {
      blockedUserIds = await this.blocksService.getBlockedUserIds(userId);
    }

    const skip = (page - 1) * pageSize;
    const orderBy =
      sort === 'hot'
        ? { hot_score: 'desc' as const }
        : { created_at: 'desc' as const };

    const where: any = {
      board_id: board.id,
      status: 'ACTIVE',
    };

    // Filter out posts from blocked users
    if (blockedUserIds.length > 0) {
      where.author_user_id = {
        notIn: blockedUserIds,
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Format response - hide author info if anonymous
    const formattedPosts = posts.map((post) => {
      const response: any = { ...post };
      if (post.is_anonymous) {
        response.author = {
          id: null,
          nickname: null,
          anonymous_handle: post.anonymous_handle_id || 'Anonymous',
        };
      }
      return response;
    });

    return {
      data: formattedPosts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
        board: {
          select: {
            key: true,
            anon_mode: true,
          },
        },
        likes: userId
          ? {
              where: {
                user_id: userId,
              },
              select: {
                user_id: true,
              },
            }
          : false,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.status !== 'ACTIVE') {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: {
        view_count: { increment: 1 },
        hot_score: calculateHotScore(
          post.like_count,
          post.comment_count,
          post.view_count + 1,
          post.created_at,
        ),
      },
    });

    // Format response - hide author info if anonymous
    const isLiked = userId && post.likes && post.likes.length > 0;
    const response: any = {
      ...post,
      is_liked: isLiked || false,
      author: post.is_anonymous
        ? {
            id: null,
            nickname: null,
            anonymous_handle: post.anonymous_handle_id || 'Anonymous',
          }
        : post.author || {
            id: null,
            nickname: null,
          },
    };

    delete response.likes;
    return response;
  }

  async create(
    boardKey: string,
    userId: string,
    input: CreatePostInput,
  ) {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is blocked (would need to check against all users who blocked this user)
    // For now, we'll skip this check in create

    // Determine anonymous mode
    let isAnonymous = false;
    let anonymousHandleId: string | null = null;

    if (board.anon_mode === 'forced') {
      isAnonymous = true;
      anonymousHandleId = generateAnonymousHandleId(userId, board.id);
    } else if (board.anon_mode === 'optional' && input.is_anonymous) {
      isAnonymous = true;
      anonymousHandleId = generateAnonymousHandleId(userId, board.id);
    }

    const post = await this.prisma.post.create({
      data: {
        board_id: board.id,
        author_user_id: userId,
        title: input.title,
        body: input.body,
        is_anonymous: isAnonymous,
        anonymous_handle_id: anonymousHandleId,
        hot_score: calculateHotScore(0, 0, 0, new Date()),
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

    // Format response - ensure author is always properly structured
    const response: any = {
      ...post,
      author: post.is_anonymous
        ? {
            id: null,
            nickname: null,
            anonymous_handle: post.anonymous_handle_id || 'Anonymous',
          }
        : post.author || {
            id: null,
            nickname: null,
          },
    };

    return response;
  }

  async update(id: string, userId: string, input: UpdatePostInput) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        board: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author_user_id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    if (post.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot edit deleted or hidden post');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        title: input.title,
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

    // Format response - ensure author is always properly structured
    const response: any = {
      ...updated,
      author: updated.is_anonymous
        ? {
            id: null,
            nickname: null,
            anonymous_handle: updated.anonymous_handle_id || 'Anonymous',
          }
        : updated.author || {
            id: null,
            nickname: null,
          },
    };

    return response;
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author_user_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });

    return { message: 'Post deleted successfully' };
  }

  async updateHotScore(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return;
    }

    const hotScore = calculateHotScore(
      post.like_count,
      post.comment_count,
      post.view_count,
      post.created_at,
    );

    await this.prisma.post.update({
      where: { id: postId },
      data: { hot_score: hotScore },
    });
  }

  async findHotPosts(page = 1, pageSize = 20, userId?: string) {
    const skip = (page - 1) * pageSize;

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
    if (userId) {
      blockedUserIds = await this.blocksService.getBlockedUserIds(userId);
    }

    const where: any = {
      status: 'ACTIVE',
    };

    // Filter out posts from blocked users
    if (blockedUserIds.length > 0) {
      where.author_user_id = {
        notIn: blockedUserIds,
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: {
          hot_score: 'desc',
        },
        skip,
        take: pageSize,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
            },
          },
          board: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    // Format response - hide author info if anonymous
    const formattedPosts = posts.map((post) => {
      const response: any = {
        ...post,
        author: post.is_anonymous
          ? {
              id: null,
              nickname: null,
              anonymous_handle: post.anonymous_handle_id || 'Anonymous',
            }
          : post.author || {
              id: null,
              nickname: null,
            },
      };
      return response;
    });

    return {
      data: formattedPosts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new NotFoundException('Post not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    // Create like
    await this.prisma.postLike.create({
      data: {
        post_id: postId,
        user_id: userId,
      },
    });

    // Update post like count and hot score
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        like_count: { increment: 1 },
      },
    });

    await this.updateHotScore(postId);

    return { message: 'Post liked successfully', liked: true };
  }

  async unlikePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.status !== 'ACTIVE') {
      throw new NotFoundException('Post not found');
    }

    // Check if liked
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('Post not liked');
    }

    // Delete like using compound unique key
    await this.prisma.postLike.delete({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });

    // Update post like count and hot score
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        like_count: { decrement: 1 },
      },
    });

    await this.updateHotScore(postId);

    return { message: 'Post unliked successfully', liked: false };
  }
}
