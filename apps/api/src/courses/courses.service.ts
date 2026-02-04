import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async searchCourses(options: {
    query?: string;
    subject?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { query, subject, page = 1, pageSize = 20 } = options;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
        { catalog_number: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (subject) {
      where.subject = subject;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ subject: 'asc' }, { catalog_number: 'asc' }],
        include: {
          reviews: {
            where: { status: 'ACTIVE' },
            select: {
              rating_overall: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    // Calculate average rating for each course
    const coursesWithRating = courses.map((course) => {
      const reviews = course.reviews;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length
          : null;

      return {
        id: course.id,
        subject: course.subject,
        catalog_number: course.catalog_number,
        title: course.title,
        credits_min: course.credits_min,
        credits_max: course.credits_max,
        term_tags: course.term_tags,
        review_count: reviews.length,
        avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      };
    });

    return {
      data: coursesWithRating,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        reviews: {
          where: { status: 'ACTIVE' },
          select: {
            rating_overall: true,
            difficulty: true,
            workload: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const reviews = course.reviews;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating_overall, 0) / reviews.length
        : null;
    const avgDifficulty =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.difficulty, 0) / reviews.length
        : null;
    const avgWorkload =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.workload, 0) / reviews.length
        : null;

    return {
      id: course.id,
      subject: course.subject,
      catalog_number: course.catalog_number,
      title: course.title,
      credits_min: course.credits_min,
      credits_max: course.credits_max,
      term_tags: course.term_tags,
      review_count: reviews.length,
      avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      avg_difficulty: avgDifficulty ? Math.round(avgDifficulty * 10) / 10 : null,
      avg_workload: avgWorkload ? Math.round(avgWorkload * 10) / 10 : null,
    };
  }

  async getSubjects() {
    const subjects = await this.prisma.course.findMany({
      select: {
        subject: true,
      },
      distinct: ['subject'],
      orderBy: {
        subject: 'asc',
      },
    });

    return subjects.map((s) => s.subject);
  }
}
