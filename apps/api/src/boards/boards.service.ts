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
    return this.prisma.pinnedBoard.findMany({
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
