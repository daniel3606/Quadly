import { Injectable } from '@nestjs/common';
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
        name: '자유게시판',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
      {
        key: 'secret',
        name: '비밀게시판',
        visibility: 'school_only',
        anon_mode: 'forced',
      },
      {
        key: 'info',
        name: '정보게시판',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
      {
        key: 'hot',
        name: '인기게시판',
        visibility: 'school_only',
        anon_mode: 'optional',
      },
    ];

    for (const board of boards) {
      await this.prisma.board.upsert({
        where: { key: board.key },
        update: {},
        create: board,
      });
    }
  }
}
