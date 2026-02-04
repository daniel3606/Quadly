import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReviewInput } from '@quadly/shared';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getReviewsForCourse(
    courseId: string,
    options: { page?: number; pageSize?: number } = {},
  ) {
    const { page = 1, pageSize = 10 } = options;
    const skip = (page - 1) * pageSize;

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          course_id: courseId,
          status: 'ACTIVE',
        },
        skip,
        take: pageSize,
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          rating_overall: true,
          difficulty: true,
          workload: true,
          exams: true,
          attendance_required: true,
          text_body: true,
          created_at: true,
          author: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      }),
      this.prisma.review.count({
        where: {
          course_id: courseId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async createReview(
    courseId: string,
    userId: string,
    input: CreateReviewInput,
  ) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user already reviewed this course
    const existingReview = await this.prisma.review.findFirst({
      where: {
        course_id: courseId,
        author_user_id: userId,
        status: 'ACTIVE',
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this course');
    }

    const review = await this.prisma.review.create({
      data: {
        course_id: courseId,
        author_user_id: userId,
        rating_overall: input.rating_overall,
        difficulty: input.difficulty,
        workload: input.workload,
        exams: input.exams,
        attendance_required: input.attendance_required,
        text_body: input.text_body,
      },
      select: {
        id: true,
        rating_overall: true,
        difficulty: true,
        workload: true,
        exams: true,
        attendance_required: true,
        text_body: true,
        created_at: true,
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return review;
  }
}
