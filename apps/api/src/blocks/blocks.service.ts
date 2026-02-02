import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if blocked user exists
    const blockedUser = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blocker_user_id_blocked_user_id: {
          blocker_user_id: blockerId,
          blocked_user_id: blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }

    const block = await this.prisma.block.create({
      data: {
        blocker_user_id: blockerId,
        blocked_user_id: blockedId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return block;
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.block.findUnique({
      where: {
        blocker_user_id_blocked_user_id: {
          blocker_user_id: blockerId,
          blocked_user_id: blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.block.delete({
      where: {
        id: block.id,
      },
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: {
        blocker_user_id: userId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return blocks.map((block) => block.blocked);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.block.findUnique({
      where: {
        blocker_user_id_blocked_user_id: {
          blocker_user_id: blockerId,
          blocked_user_id: blockedId,
        },
      },
    });

    return !!block;
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: {
        blocker_user_id: userId,
      },
      select: {
        blocked_user_id: true,
      },
    });

    return blocks.map((block) => block.blocked_user_id);
  }
}
