import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { calculateHotScore } from '@quadly/shared';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(boardKey: string, page = 1, pageSize = 20, sort = 'new') {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const skip = (page - 1) * pageSize;
    const orderBy =
      sort === 'hot'
        ? { hot_score: 'desc' as const }
        : { created_at: 'desc' as const };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          board_id: board.id,
          status: 'ACTIVE',
        },
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
      this.prisma.post.count({
        where: {
          board_id: board.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: {
        view_count: { increment: 1 },
      },
    });

    return post;
  }
}
