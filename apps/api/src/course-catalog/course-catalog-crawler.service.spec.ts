import { Test, TestingModule } from '@nestjs/testing';
import { CourseCatalogCrawlerService } from './course-catalog-crawler.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CourseCatalogCrawlerService', () => {
  let service: CourseCatalogCrawlerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseCatalogCrawlerService,
        {
          provide: PrismaService,
          useValue: {
            crawlJob: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
            courseCatalogCourse: {
              upsert: jest.fn(),
            },
            coursePrerequisite: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CourseCatalogCrawlerService>(CourseCatalogCrawlerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parsePrerequisite', () => {
    it('should parse prerequisite text with course codes', () => {
      const text = 'MATH 115 and EECS 183';
      const result = (service as any).parsePrerequisite(text);
      
      expect(result.parsed).toBeDefined();
      expect(result.parsed.courses.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty prerequisite text', () => {
      const result = (service as any).parsePrerequisite('');
      
      expect(result.parsed).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should detect AND/OR operators', () => {
      const text = 'MATH 115 and (EECS 183 or EECS 280)';
      const result = (service as any).parsePrerequisite(text);
      
      expect(result.parsed.hasAnd).toBe(true);
      expect(result.parsed.hasOr).toBe(true);
      expect(result.parsed.hasParentheses).toBe(true);
    });

    it('should extract minimum credit requirement', () => {
      const text = 'Minimum 30 credits required';
      const result = (service as any).parsePrerequisite(text);
      
      expect(result.parsed.minCredit).toBe(30);
    });
  });

  describe('crawl', () => {
    it('should create a crawl job and return job ID', async () => {
      const mockJobId = 'test-job-id';
      (prisma.crawlJob.create as jest.Mock).mockResolvedValue({
        id: mockJobId,
        status: 'PENDING',
      });

      const params = {
        term: 'Winter 2026',
        subject: 'ASIAN',
      };

      const jobId = await service.crawl(params);

      expect(jobId).toBe(mockJobId);
      expect(prisma.crawlJob.create).toHaveBeenCalledWith({
        data: {
          status: 'PENDING',
          term: params.term,
          subject: params.subject,
          params: params as any,
        },
      });
    });
  });
});
