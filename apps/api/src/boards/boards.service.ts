import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.board.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }

  async findByKey(key: string) {
    return this.prisma.board.findUnique({
      where: { key },
    });
  }

  async initializeBoards() {
    const boards = [
      {
        key: 'free',
        name: 'General Board',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
      {
        key: 'secret',
        name: 'Private Board',
        visibility: 'school_only',
        anon_mode: 'forced',
      },
      {
        key: 'info',
        name: 'Info Board',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
      {
        key: 'hot',
        name: 'Hot Board',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
      {
        key: 'cs',
        name: 'Computer Science Board',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
    ];

    for (const board of boards) {
      await this.prisma.board.upsert({
        where: { key: board.key },
        update: {
          name: board.name,
          visibility: board.visibility,
          anon_mode: board.anon_mode,
        },
        create: board,
      });
    }
  }

  async pinBoard(userId: string, boardKey: string) {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if already pinned
    const existingPin = await this.prisma.pinnedBoard.findUnique({
      where: {
        user_id_board_id: {
          user_id: userId,
          board_id: board.id,
        },
      },
    });

    if (existingPin) {
      return existingPin;
    }

    return this.prisma.pinnedBoard.create({
      data: {
        user_id: userId,
        board_id: board.id,
      },
      include: {
        board: true,
      },
    });
  }

  async unpinBoard(userId: string, boardKey: string) {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const result = await this.prisma.pinnedBoard.deleteMany({
      where: {
        user_id: userId,
        board_id: board.id,
      },
    });

    return {
      success: result.count > 0,
      board: board,
    };
  }

  async getPinnedBoards(userId: string) {
    const pinnedBoards = await this.prisma.pinnedBoard.findMany({
      where: {
        user_id: userId,
      },
      include: {
        board: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Get the latest post for each pinned board
    const result = await Promise.all(
      pinnedBoards.map(async (pinnedBoard) => {
        const latestPost = await this.prisma.post.findFirst({
          where: {
            board_id: pinnedBoard.board_id,
            status: 'ACTIVE',
          },
          orderBy: {
            created_at: 'desc',
          },
          select: {
            id: true,
            title: true,
            created_at: true,
          },
        });

        // Check if the post is new (created after the board was pinned)
        const is_new = latestPost
          ? new Date(latestPost.created_at) > new Date(pinnedBoard.created_at)
          : false;

        return {
          ...pinnedBoard,
          latest_post: latestPost
            ? {
                id: latestPost.id,
                title: latestPost.title,
                created_at: latestPost.created_at,
                is_new,
              }
            : null,
        };
      }),
    );

    return result;
  }

  async isBoardPinned(userId: string, boardKey: string): Promise<boolean> {
    const board = await this.prisma.board.findUnique({
      where: { key: boardKey },
    });

    if (!board) {
      return false;
    }

    const pinned = await this.prisma.pinnedBoard.findUnique({
      where: {
        user_id_board_id: {
          user_id: userId,
          board_id: board.id,
        },
      },
    });

    return !!pinned;
  }
}
