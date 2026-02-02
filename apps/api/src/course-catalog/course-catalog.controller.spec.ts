import { Test, TestingModule } from '@nestjs/testing';
import { CourseCatalogController } from './course-catalog.controller';
import { CourseCatalogService } from './course-catalog.service';
import { CourseCatalogCrawlerService } from './course-catalog-crawler.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CourseCatalogController', () => {
  let controller: CourseCatalogController;
  let service: CourseCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseCatalogController],
      providers: [
        CourseCatalogService,
        CourseCatalogCrawlerService,
        {
          provide: PrismaService,
          useValue: {
            courseCatalogCourse: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
            },
            crawlJob: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<CourseCatalogController>(CourseCatalogController);
    service = module.get<CourseCatalogService>(CourseCatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchCourses', () => {
    it('should return paginated course results', async () => {
      const mockResults = {
        data: [
          {
            id: '1',
            subject_code: 'ASIAN',
            course_number: '101',
            title: 'Introduction to Asian Studies',
            tags: [],
            prerequisites: [],
          },
        ],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'searchCourses').mockResolvedValue(mockResults as any);

      const result = await controller.searchCourses('Winter 2026', 'ASIAN', undefined, '50', '0');

      expect(result).toEqual(mockResults);
      expect(service.searchCourses).toHaveBeenCalledWith({
        term: 'Winter 2026',
        subject: 'ASIAN',
        q: undefined,
        limit: 50,
        offset: 0,
      });
    });
  });

  describe('getCourseDetail', () => {
    it('should return course detail', async () => {
      const mockCourse = {
        id: '1',
        subject_code: 'ASIAN',
        course_number: '101',
        title: 'Introduction to Asian Studies',
        description: 'Test description',
      };

      jest.spyOn(service, 'getCourseDetail').mockResolvedValue(mockCourse as any);

      const result = await controller.getCourseDetail('1');

      expect(result).toEqual(mockCourse);
      expect(service.getCourseDetail).toHaveBeenCalledWith('1');
    });
  });
});
