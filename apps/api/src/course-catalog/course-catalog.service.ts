import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface SearchCoursesParams {
  term?: string;
  subject?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CourseCatalogService {
  constructor(private prisma: PrismaService) {}

  async searchCourses(params: SearchCoursesParams) {
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const where: any = {};

    if (params.subject) {
      where.subject_code = params.subject;
    }

    if (params.term) {
      where.last_seen_term = params.term;
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { course_number: { contains: params.q } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.courseCatalogCourse.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ subject_code: 'asc' }, { course_number: 'asc' }],
        include: {
          tags: true,
          prerequisites: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.courseCatalogCourse.count({ where }),
    ]);

    return {
      data: courses,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseDetail(courseId: string) {
    const course = await this.prisma.courseCatalogCourse.findUnique({
      where: { id: courseId },
      include: {
        tags: true,
        prerequisites: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async getCrawlJob(jobId: string) {
    const job = await this.prisma.crawlJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Crawl job not found');
    }

    return job;
  }
}
