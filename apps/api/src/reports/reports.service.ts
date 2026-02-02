import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportInput } from '@quadly/shared';

// Auto-blinding threshold: hide content after N reports
const AUTO_BLIND_THRESHOLD = 3;

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, input: ReportInput) {
    const { target_type, target_id, reason_code, description } = input;

    // Check if target exists and validate
    await this.validateTarget(target_type, target_id);

    // Check if user already reported this target
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reporter_user_id: userId,
        target_type: target_type.toUpperCase() as any,
        target_id,
        status: 'OPEN',
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Determine foreign key fields based on target type
    const reportData: any = {
      reporter_user_id: userId,
      target_type: target_type.toUpperCase() as any,
      target_id,
      reason_code: reason_code.toUpperCase() as any,
      description,
      status: 'OPEN',
    };

    if (target_type === 'post') {
      reportData.post_id = target_id;
    } else if (target_type === 'comment') {
      reportData.comment_id = target_id;
    } else if (target_type === 'review') {
      reportData.review_id = target_id;
    }

    const report = await this.prisma.report.create({
      data: reportData,
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // Check if auto-blinding threshold is reached
    await this.checkAutoBlind(target_type, target_id);

    return report;
  }

  private async validateTarget(targetType: string, targetId: string) {
    switch (targetType) {
      case 'post':
        const post = await this.prisma.post.findUnique({
          where: { id: targetId },
        });
        if (!post) {
          throw new NotFoundException('Post not found');
        }
        break;
      case 'comment':
        const comment = await this.prisma.comment.findUnique({
          where: { id: targetId },
        });
        if (!comment) {
          throw new NotFoundException('Comment not found');
        }
        break;
      case 'review':
        const review = await this.prisma.review.findUnique({
          where: { id: targetId },
        });
        if (!review) {
          throw new NotFoundException('Review not found');
        }
        break;
      case 'user':
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        break;
      default:
        throw new BadRequestException('Invalid target type');
    }
  }

  private async checkAutoBlind(targetType: string, targetId: string) {
    const reportCount = await this.prisma.report.count({
      where: {
        target_type: targetType.toUpperCase() as any,
        target_id: targetId,
        status: 'OPEN',
      },
    });

    if (reportCount >= AUTO_BLIND_THRESHOLD) {
      // Auto-hide the content
      switch (targetType) {
        case 'post':
          await this.prisma.post.update({
            where: { id: targetId },
            data: { status: 'HIDDEN' },
          });
          break;
        case 'comment':
          await this.prisma.comment.update({
            where: { id: targetId },
            data: { status: 'HIDDEN' },
          });
          break;
        case 'review':
          await this.prisma.review.update({
            where: { id: targetId },
            data: { status: 'HIDDEN' },
          });
          break;
      }
    }
  }

  async findAll(status?: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: pageSize,
        include: {
          reporter: {
            select: {
              id: true,
              nickname: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          comment: {
            select: {
              id: true,
              body: true,
            },
          },
          review: {
            select: {
              id: true,
              text_body: true,
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        post: true,
        comment: true,
        review: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async updateStatus(id: string, status: 'RESOLVED' | 'REJECTED') {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id },
      data: { status },
    });
  }
}
